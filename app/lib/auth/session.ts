import { SignJWT, jwtVerify } from "jose";
import * as db from "~/lib/database";

const SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

const ALGORITHM = "HS256";
const SESSION_DURATION = 24 * 60 * 60 * 1000;

export interface AdminSession {
    id: string;
    adminId: string;
    token: string;
    expiresAt: number;
}

export interface AdminUser {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
}

export async function createSession(
    adminId: string,
    ipAddress: string,
    userAgent: string
): Promise<AdminSession> {
    const expiresAt = new Date(Date.now() + SESSION_DURATION);
    const token = await new SignJWT({ adminId })
        .setProtectedHeader({ alg: ALGORITHM })
        .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
        .sign(SECRET);

    await db.query("DELETE FROM admin_sessions WHERE admin_id = $1", [adminId]);

    const result = await db.insert(
        `INSERT INTO admin_sessions (admin_id, jwt_token, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, admin_id, jwt_token as token, EXTRACT(EPOCH FROM expires_at) * 1000 as expiresAt`,
        [adminId, token, ipAddress, userAgent, expiresAt]
    );

    return {
        id: result.id,
        adminId: result.adminId,
        token: result.token,
        expiresAt: parseInt(result.expiresAt),
    };
}

export async function verifySession(token: string): Promise<AdminUser | null> {
    try {
        const { payload } = await jwtVerify(token, SECRET);
        const adminId = payload.adminId as string;

        const session = await db.getOne<{ id: string }>(
            `SELECT id FROM admin_sessions 
       WHERE admin_id = $1 AND jwt_token = $2 AND expires_at > CURRENT_TIMESTAMP`,
            [adminId, token]
        );

        if (!session) {
            return null;
        }

        const admin = await db.getOne<AdminUser>(
            `SELECT id, email, full_name, role, is_active FROM admin_users 
       WHERE id = $1 AND is_active = true`,
            [adminId]
        );

        return admin || null;
    } catch {
        return null;
    }
}

export async function invalidateSession(token: string): Promise<void> {
    try {
        const { payload } = await jwtVerify(token, SECRET);
        const adminId = payload.adminId as string;

        await db.query(
            "DELETE FROM admin_sessions WHERE admin_id = $1 AND jwt_token = $2",
            [adminId, token]
        );
    } catch {
    }
}
