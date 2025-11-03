import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("./routes/index/page.tsx"),
    route("report", "./routes/report/page.tsx"),
] satisfies RouteConfig;
