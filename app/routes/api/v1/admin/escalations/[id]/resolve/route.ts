import type { LoaderFunctionArgs } from "react-router";
import * as db from "~/lib/database";
import { logAuditEvent } from "~/lib/audit";

export async function action({ params, request }: LoaderFunctionArgs) {
    if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const { id } = params;
        if (!id) {
            return Response.json({ error: "Missing escalation ID" }, { status: 400 });
        }

        const body = await request.json();
        const resolution = body.resolution || "resolved";

        await db.update(
            `UPDATE escalations SET resolution = $1, resolved_at = NOW() WHERE id = $2`,
            [resolution, id]
        );

        const escalation = await db.getOne(
            `SELECT violation_id FROM escalations WHERE id = $1`,
            [id]
        );

        if (escalation) {
            await db.update(
                `UPDATE violation_reports SET status = $1 WHERE id = $2`,
                [resolution, escalation.violation_id]
            );

            await logAuditEvent({
                action: "escalation_resolved",
                entityType: "escalation",
                entityId: id,
                changes: {
                    resolution,
                    violation_id: escalation.violation_id,
                },
            });
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error("Error resolving escalation:", error);
        return Response.json({ error: "Failed to resolve escalation" }, { status: 500 });
    }
}
