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
        vr.vehicleNumber,
        vr.description,
        vr.severity,
        vr.aiAssessmentScore,
        vr.createdAt,
        e.escalationReason
      FROM violation_reports vr
      LEFT JOIN escalations e ON vr.id = e.violationId
      WHERE vr.status = 'escalated'
      ORDER BY vr.createdAt DESC
      LIMIT 100`
        );

        return new Response(
            JSON.stringify({
                ok: true,
                violations: violations.map((v: any) => ({
                    id: v.id,
                    vehicleNumber: v.vehiclenumber,
                    description: v.description,
                    severity: v.severity,
                    aiAssessmentScore: parseFloat(v.aiassessmentscore) || 0,
                    createdAt: v.createdat,
                    escalationReason: v.escalationreason,
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
