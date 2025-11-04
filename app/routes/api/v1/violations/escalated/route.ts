import * as db from "~/lib/database";
import { verifySession } from "~/lib/auth/session";

export async function loader({ request }: any) {
    try {
        const cookieHeader = request.headers.get("cookie") || "";
        const token = cookieHeader
            .split(";")
            .find((c: string) => c.trim().startsWith("adminToken="))
            ?.split("=")[1];

        if (!token) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const admin = await verifySession(token);
        if (!admin) {
            return new Response(JSON.stringify({ error: "Invalid session" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const violations = await db.getMany(
            `SELECT 
        vr.id,
        vr.vehicle_number,
        vr.description,
        vr.severity,
        vr.ai_assessment_score,
        vr.created_at,
        e.escalation_reason
      FROM violation_reports vr
      LEFT JOIN escalations e ON vr.id = e.violation_id
      WHERE vr.status = 'escalated'
      ORDER BY vr.created_at DESC
      LIMIT 100`
        );

        return new Response(
            JSON.stringify({
                ok: true,
                violations: violations.map((v: any) => ({
                    id: v.id,
                    vehicleNumber: v.vehicle_number,
                    description: v.description,
                    severity: v.severity,
                    aiAssessmentScore: parseFloat(v.ai_assessment_score) || 0,
                    createdAt: v.created_at,
                    escalationReason: v.escalation_reason,
                })),
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("Get escalated violations error:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
