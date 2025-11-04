import type { LoaderFunctionArgs } from "react-router";
import * as db from "~/lib/database";

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get("page") || "1", 10);
        const limit = 20;
        const offset = (page - 1) * limit;
        const timeRange = url.searchParams.get("timeRange") || "all";
        const confidenceMin = parseInt(url.searchParams.get("confidenceMin") || "0");
        const confidenceMax = parseInt(url.searchParams.get("confidenceMax") || "100");
        const hasVehicle = url.searchParams.get("hasVehicle") || "all";
        const hasViolation = url.searchParams.get("hasViolation") || "all";
        const violationType = url.searchParams.get("violationType") || "";

        let query = `
      SELECT 
        id,
        vehicle_number,
        description,
        severity,
        violation_type,
        ai_assessment_score,
        status,
        created_at
      FROM violation_reports
      WHERE ai_assessment_score >= $1 
        AND ai_assessment_score <= $2
    `;

        const params: any[] = [confidenceMin / 100.0, confidenceMax / 100.0];
        let paramIndex = 3;

        if (timeRange === "today") {
            query += ` AND created_at >= CURRENT_DATE`;
        } else if (timeRange === "week") {
            query += ` AND created_at >= CURRENT_DATE - INTERVAL '7 days'`;
        } else if (timeRange === "month") {
            query += ` AND created_at >= CURRENT_DATE - INTERVAL '30 days'`;
        }

        if (hasVehicle === "yes") {
            query += ` AND vehicle_number IS NOT NULL`;
        } else if (hasVehicle === "no") {
            query += ` AND vehicle_number IS NULL`;
        }

        if (violationType) {
            query += ` AND violation_type = $${paramIndex}`;
            params.push(violationType);
            paramIndex++;
        }

        query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

        const reports = await db.getMany(query, params);

        let countQuery = `SELECT COUNT(*) as count FROM violation_reports WHERE ai_assessment_score >= $1 AND ai_assessment_score <= $2`;
        const countParams: any[] = [confidenceMin / 100.0, confidenceMax / 100.0];
        let countParamIndex = 3;

        if (timeRange === "today") {
            countQuery += ` AND created_at >= CURRENT_DATE`;
        } else if (timeRange === "week") {
            countQuery += ` AND created_at >= CURRENT_DATE - INTERVAL '7 days'`;
        } else if (timeRange === "month") {
            countQuery += ` AND created_at >= CURRENT_DATE - INTERVAL '30 days'`;
        }

        if (hasVehicle === "yes") {
            countQuery += ` AND vehicle_number IS NOT NULL`;
        } else if (hasVehicle === "no") {
            countQuery += ` AND vehicle_number IS NULL`;
        }

        if (violationType) {
            countQuery += ` AND violation_type = $${countParamIndex}`;
            countParams.push(violationType);
        }

        const countResult = await db.getOne(countQuery, countParams);
        const total = countResult?.count || 0;

        return Response.json({
            data: reports || [],
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching reports:", error);
        return Response.json({ data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }, { status: 500 });
    }
}
