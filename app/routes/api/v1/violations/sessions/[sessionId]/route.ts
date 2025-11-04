import type { Route } from "./+types/route";
import * as db from "~/lib/database";

export async function loader({ params }: Route.LoaderArgs) {
  const { sessionId } = params;

  if (!sessionId) {
    return new Response(JSON.stringify({ error: "Session ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const result = await db.getOne(
      `SELECT id, status, progress_data, result, error, image_data, created_at, updated_at
       FROM violation_analysis_sessions
       WHERE id = $1`,
      [sessionId]
    );

    if (!result) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Session Get API] Error fetching session:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
