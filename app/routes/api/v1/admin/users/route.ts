import type { LoaderFunctionArgs } from "react-router";
import * as db from "~/lib/database";
import { hashPassword } from "~/lib/auth/password";
import { logAuditEvent } from "~/lib/audit";

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const users = await db.getMany(
            `SELECT id, full_name, email, created_at FROM admin_users ORDER BY created_at DESC`,
            []
        );
        return Response.json(users || []);
    } catch (error) {
        console.error("Error fetching admin users:", error);
        return Response.json([], { status: 500 });
    }
}

export async function action({ request }: LoaderFunctionArgs) {
    if (request.method === "POST") {
        try {
            const body = await request.json();
            const { fullName, email, password } = body;

            if (!fullName || !email || !password) {
                return Response.json(
                    { error: "Missing required fields" },
                    { status: 400 }
                );
            }

            const hashedPassword = await hashPassword(password);

            const result = await db.insert(
                `INSERT INTO admin_users (full_name, email, password_hash) 
         VALUES ($1, $2, $3) 
         RETURNING id, full_name, email, created_at`,
                [fullName, email, hashedPassword]
            );

            await logAuditEvent({
                action: "admin_user_created",
                entityType: "admin_user",
                entityId: result.id,
                changes: { email, full_name: fullName },
            });

            return Response.json(result, { status: 201 });
        } catch (error) {
            console.error("Error creating admin user:", error);
            return Response.json({ error: "Failed to create user" }, { status: 500 });
        }
    }

    return Response.json({ error: "Method not allowed" }, { status: 405 });
}
