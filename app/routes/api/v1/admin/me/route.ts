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

        return new Response(
            JSON.stringify({
                ok: true,
                admin: {
                    id: admin.id,
                    email: admin.email,
                    fullName: admin.fullName,
                    role: admin.role,
                },
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("Get admin error:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
