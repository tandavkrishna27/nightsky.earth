import type { RequestHandler } from "express";
/** Fixed public route labels only: never interpolate untrusted path segments. */
function routeLabel(path: string): string | undefined {
    if (path === "/api/news")
        return "/api/news";
    if (path.startsWith("/api/news/"))
        return "/api/news/:id";
    if (path === "/api" || path.startsWith("/api/"))
        return "/api/other";
    if (path === "/mcp" || path === "/health")
        return path;
    return undefined;
}
export function requestLogging(write: (line: string) => void): RequestHandler {
    return (req, res, next) => {
        const started = Date.now();
        const label = routeLabel(req.path);
        const method = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].includes(req.method) ? req.method : "OTHER";
        if (label)
            res.once("finish", () => {
                write(`${method} ${label} ${res.statusCode} in ${Math.max(0, Date.now() - started)}ms`);
            });
        next();
    };
}
