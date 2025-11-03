import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("./routes/index/page.tsx"),
    route("report", "./routes/report/page.tsx"),
    route("report/:sessionId", "./routes/report/[sessionId]/page.tsx"),
    route("api/v1/violations/analyze", "./routes/api/v1/violations/analyze/route.ts"),
    route("api/v1/violations/sessions", "./routes/api/v1/violations/sessions/route.ts"),
    route("api/v1/violations/sessions/:sessionId", "./routes/api/v1/violations/sessions/[sessionId]/route.ts"),
] satisfies RouteConfig;
