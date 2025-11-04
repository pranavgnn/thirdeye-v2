import type { LoaderFunctionArgs } from "react-router";
import * as db from "~/lib/database";

export async function loader({ params }: LoaderFunctionArgs) {
    try {
        const { id } = params;
        if (!id) {
            return Response.json({ error: "Missing report ID" }, { status: 400 });
        }

        const report = await db.getOne(
            `SELECT 
        id,
        vehicle_number,
        description,
        severity,
        violation_type,
        ai_assessment_score,
        recommended_fine_amount,
        status,
        created_at,
        notes
      FROM violation_reports
      WHERE id = $1`,
            [id]
        );

        if (!report) {
            return Response.json({ error: "Report not found" }, { status: 404 });
        }

        return Response.json(report);
    } catch (error) {
        console.error("Error fetching report:", error);
        return Response.json({ error: "Failed to fetch report" }, { status: 500 });
    }
}
