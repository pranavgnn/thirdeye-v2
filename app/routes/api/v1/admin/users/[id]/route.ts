import type { LoaderFunctionArgs } from "react-router";
import * as db from "~/lib/database";
import { logAuditEvent } from "~/lib/audit";

export async function action({ params, request }: LoaderFunctionArgs) {
    if (request.method !== "DELETE") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const { id } = params;
        if (!id) {
            return Response.json({ error: "Missing user ID" }, { status: 400 });
        }

        const user = await db.getOne(`SELECT id, email, full_name FROM admin_users WHERE id = $1`, [id]);

        await db.remove(`DELETE FROM admin_users WHERE id = $1`, [id]);

        if (user) {
            await logAuditEvent({
                action: "admin_user_deleted",
                entityType: "admin_user",
                entityId: id,
                changes: { email: user.email, full_name: user.full_name },
            });
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error("Error deleting admin user:", error);
        return Response.json({ error: "Failed to delete user" }, { status: 500 });
    }
}
