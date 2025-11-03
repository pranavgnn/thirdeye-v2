import * as db from "~/lib/database";
import { verifyPassword } from "~/lib/auth/password";
import { createSession } from "~/lib/auth/session";
import { redirect } from "react-router";

export async function action({ request }: any) {
    if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }

    const formData = await request.formData();
    const email = (formData.get("email") as string)?.trim();
    const password = formData.get("password") as string;

    if (!email || !password) {
        return {
            error: "Email and password are required",
            email: email || "",
        };
    }

    try {
        const admin = await db.getOne<{
            id: string;
            email: string;
            fullname: string;
            passwordhash: string;
            isactive: boolean;
        }>(
            `SELECT id, email, fullName, passwordHash, isActive FROM admin_users WHERE email = $1`,
            [email]
        );

        if (!admin) {
            return {
                error: "Invalid credentials",
                email,
            };
        }

        if (!admin.isactive) {
            return {
                error: "This account has been disabled",
                email,
            };
        }

        const passwordValid = await verifyPassword(password, admin.passwordhash);
        if (!passwordValid) {
            return {
                error: "Invalid credentials",
                email,
            };
        }

        const ipAddress =
            (request.headers.get("x-forwarded-for") as string) ||
            (request.headers.get("x-real-ip") as string) ||
            "0.0.0.0";
        const userAgent = request.headers.get("user-agent") || "Unknown";

        const session = await createSession(admin.id, ipAddress, userAgent);

        const response = redirect("/admin/dashboard", {
            headers: {
                "Set-Cookie": `adminToken=${session.token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${24 * 60 * 60}`,
            },
        });

        return response;
    } catch (error) {
        console.error("Login error:", error);
        return {
            error: "An error occurred during login",
            email,
        };
    }
}
