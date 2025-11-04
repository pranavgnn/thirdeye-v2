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

        await db.update(
            `UPDATE violation_reports 
       SET status = 'rejected' 
       WHERE id = $1`,
            [id]
        );

        await logAuditEvent({
            action: "violation_rejected",
            entityType: "violation_report",
            entityId: id,
            changes: { status: "rejected" },
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error("Error rejecting report:", error);
        return Response.json({ error: "Failed to reject report" }, { status: 500 });
    }
}
