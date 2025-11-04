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
            return Response.json({ error: "Missing report ID" }, { status: 400 });
        }

        const body = await request.json();
        const escalationReason = body.escalationReason || "Admin escalation";

        await db.update(
            `UPDATE violation_reports 
       SET status = 'escalated' 
       WHERE id = $1`,
            [id]
        );

        await db.insert(
            `INSERT INTO escalations (violation_id, escalation_reason, escalation_level, priority)
       VALUES ($1, $2, $3, $4)`,
            [id, escalationReason, 1, "high"]
        );

        await logAuditEvent({
            action: "violation_escalated",
            entityType: "violation_report",
            entityId: id,
            changes: {
                status: "escalated",
                escalation_reason: escalationReason,
                escalation_level: 1,
            },
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error("Error escalating report:", error);
        return Response.json({ error: "Failed to escalate report" }, { status: 500 });
    }
}
