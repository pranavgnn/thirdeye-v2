import { invalidateSession } from "~/lib/auth/session";

export async function POST({ request }: any) {
    try {
        const cookieHeader = request.headers.get("cookie") || "";
        const token = cookieHeader
            .split(";")
            .find((c: string) => c.trim().startsWith("adminToken="))
            ?.split("=")[1];

        if (token) {
            await invalidateSession(token);
        }

        return new Response(
            JSON.stringify({ ok: true }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Set-Cookie": "adminToken=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0",
                },
            }
        );
    } catch (error) {
        console.error("Logout error:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
