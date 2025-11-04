import type { LoaderFunctionArgs } from "react-router";
import * as db from "~/lib/database";

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const url = new URL(request.url);
        const priority = url.searchParams.get("priority");

        let query = `
      SELECT e.id, e.violation_id, e.escalation_reason, e.escalation_level, e.priority, 
             e.created_at, vr.id AS "reportId", vr.description, vr.ai_assessment_score,
             vr.violation_type, vr.vehicle_number
      FROM escalations e
      JOIN violation_reports vr ON e.violation_id = vr.id
      WHERE 1=1
    `;
        const params: (string | number)[] = [];

        if (priority && priority !== "all") {
            params.push(priority);
            query += ` AND e.priority = $${params.length}`;
        }

        query += ` ORDER BY e.created_at DESC LIMIT 50`;

        const escalations = await db.getMany(query, params);
        return Response.json(escalations || []);
    } catch (error) {
        console.error("Error fetching escalations:", error);
        return Response.json([], { status: 500 });
    }
}
