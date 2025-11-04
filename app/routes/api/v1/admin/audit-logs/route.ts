import type { LoaderFunctionArgs } from "react-router";
import * as db from "~/lib/database";

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const url = new URL(request.url);
        const search = url.searchParams.get("search");
        const page = parseInt(url.searchParams.get("page") || "1", 10);
        const limit = 20;
        const offset = (page - 1) * limit;

        let query = `SELECT * FROM audit_logs WHERE 1=1`;
        const params: (string | number)[] = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (action::text ILIKE $${params.length} OR entity_type ILIKE $${params.length} OR changes::text ILIKE $${params.length})`;
        }

        query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

        const logs = await db.getMany(query, params);

        let countQuery = `SELECT COUNT(*) as count FROM audit_logs WHERE 1=1`;
        const countParams: (string | number)[] = [];

        if (search) {
            countParams.push(`%${search}%`);
            countQuery += ` AND (action::text ILIKE $1 OR entity_type ILIKE $1 OR changes::text ILIKE $1)`;
        }

        const countResult = await db.getOne(countQuery, countParams);
        const total = countResult?.count || 0;

        return Response.json({
            data: logs || [],
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        return Response.json({ data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }, { status: 500 });
    }
}
