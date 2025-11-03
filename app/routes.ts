import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("./routes/index/page.tsx"),
    route("report", "./routes/report/page.tsx"),
    route("report/:sessionId", "./routes/report/[sessionId]/page.tsx"),
    route("admin/login", "./routes/admin/login/page.tsx"),
    route("admin/dashboard", "./routes/admin/dashboard/page.tsx"),
    route("api/v1/admin/me", "./routes/api/v1/admin/me/route.ts"),
    route("api/v1/admin/logout", "./routes/api/v1/admin/logout/route.ts"),
    route("api/v1/violations/analyze", "./routes/api/v1/violations/analyze/route.ts"),
    route("api/v1/violations/escalated", "./routes/api/v1/violations/escalated/route.ts"),
    route("api/v1/violations/sessions", "./routes/api/v1/violations/sessions/route.ts"),
    route("api/v1/violations/sessions/:sessionId", "./routes/api/v1/violations/sessions/[sessionId]/route.ts"),
] satisfies RouteConfig;
