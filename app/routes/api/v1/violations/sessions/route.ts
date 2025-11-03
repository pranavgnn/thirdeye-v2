import type { Route } from "./+types/route";
import * as db from "~/lib/database";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO violation_analysis_sessions (status, progress_data, result, error)
       VALUES ($1, $2, $3, $4)
       RETURNING id, status, createdAt`,
      ["processing", JSON.stringify([]), null, null]
    );

    const session = result.rows[0];

    return new Response(JSON.stringify(session), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Session API] Error creating session:", error);
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
