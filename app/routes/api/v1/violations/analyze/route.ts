import type { Route } from "./+types/route";
import { streamViolationAnalysis } from "~/lib/ai/chain";
import * as db from "~/lib/database";

export async function action({ request }: Route.ActionArgs) {
    if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }

    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
        return new Response(JSON.stringify({ error: "No file provided" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
        async start(controller) {
            try {
                const events: any[] = [];

                for await (const event of streamViolationAnalysis(base64)) {
                    events.push(event);
                    const data = JSON.stringify(event);
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`));

                    if (sessionId) {
                        try {
                            await db.query(
                                `UPDATE violation_analysis_sessions 
                                 SET progress_data = $1, updatedAt = CURRENT_TIMESTAMP
                                 WHERE id = $2`,
                                [JSON.stringify(events), sessionId]
                            );
                        } catch (dbError) {
                            console.error("[API] Failed to update session progress:", dbError);
                        }
                    }
                }

                if (sessionId) {
                    const finalEvent = events[events.length - 1];
                    const result = finalEvent?.type === "final_result" ? finalEvent.data : null;

                    await db.query(
                        `UPDATE violation_analysis_sessions 
                         SET status = $1, result = $2, updatedAt = CURRENT_TIMESTAMP
                         WHERE id = $3`,
                        ["complete", result ? JSON.stringify(result) : null, sessionId]
                    );
                }

                controller.close();
            } catch (error) {
                console.error("[API] Stream error:", error);

                if (sessionId) {
                    try {
                        await db.query(
                            `UPDATE violation_analysis_sessions 
                             SET status = $1, error = $2, updatedAt = CURRENT_TIMESTAMP
                             WHERE id = $3`,
                            ["failed", error instanceof Error ? error.message : String(error), sessionId]
                        );
                    } catch (dbError) {
                        console.error("[API] Failed to update session error:", dbError);
                    }
                }

                const errorEvent = JSON.stringify({
                    type: "error",
                    data: error instanceof Error ? error.message : String(error),
                    timestamp: Date.now(),
                });
                controller.enqueue(encoder.encode(`data: ${errorEvent}\n\n`));
                controller.close();
            }
        },
    });

    return new Response(readable, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}
