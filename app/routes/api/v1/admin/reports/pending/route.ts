import type { LoaderFunctionArgs } from "react-router";
import * as db from "~/lib/database";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const query = `
      SELECT 
        id,
        vehicle_number,
        description,
        severity,
        violation_type,
        ai_assessment_score,
        recommended_fine_amount,
        status,
        created_at
      FROM violation_reports
      WHERE status = 'pending_review'
      ORDER BY created_at ASC
      LIMIT 1
    `;

    const reports = await db.getMany(query, []);
    return Response.json(reports || []);
  } catch (error) {
    console.error("Error fetching pending reports:", error);
    return Response.json([], { status: 500 });
  }
}
