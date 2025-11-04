import * as db from "./database";

export interface AuditLogInput {
    action: string;
    entityType: string;
    entityId: string;
    userId?: string | null;
    changes?: Record<string, any> | null;
}

export async function logAuditEvent(input: AuditLogInput): Promise<void> {
    try {
        await db.insert(
            `INSERT INTO audit_logs (action, user_id, entity_type, entity_id, changes, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [
                input.action,
                input.userId || null,
                input.entityType,
                input.entityId,
                input.changes ? JSON.stringify(input.changes) : null,
                "success",
            ]
        );
    } catch (error) {
        console.error("Error logging audit event:", error);
    }
}
