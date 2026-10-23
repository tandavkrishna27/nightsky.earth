import { CalculationPlaceClarificationError } from "../places/calculationPlace";
import type { McpServer } from "@modelcontextprotocol/server";
import { MAX_STRUCTURED_RESULT_BYTES } from "../../shared/nightsky/common";
function safeError(text: string) {
    return { isError: true as const, content: [{ type: "text" as const, text }] };
}
/** Preserve typed input/context; replace failures, never truncate evidence. */
export function guardToolCallback<Args extends unknown[], Result>(callback: (...args: Args) => Result) {
    return async (...args: Args) => {
        try {
            const result = await callback(...args);
            if (result && typeof result === "object" && "structuredContent" in result && result.structuredContent !== undefined) {
                const bytes = Buffer.byteLength(JSON.stringify(result.structuredContent), "utf8");
                if (bytes > MAX_STRUCTURED_RESULT_BYTES)
                    return safeError("Too much evidence; compare fewer options or request a shorter time window.");
            }
            return result;
        }
        catch (error) {
            if (error instanceof CalculationPlaceClarificationError) {
                const messages = {
                    "resolve-again": "The selected place or catalogue revision is unavailable. Search and select the place again before planning.",
                    "display-time-zone-required": "Choose an explicit display time zone before planning this candidate; its actual site time zone is unverified.",
                    "time-zone-mismatch": "The selected place and requested display time zone must match. Resolve the place again and use its returned named-place zone or chosen site display zone.",
                };
                return safeError(messages[error.code]);
            }
            return safeError("NightSky could not complete this tool request. Try a smaller request or try again shortly.");
        }
    };
}
/** Registration facade preserves the SDK's generic overloads and config.
 * Only callbacks are wrapped; every server owns its own registrations.
 */
export function boundedToolRegistration(server: McpServer, retainToolWork?: () => () => void): McpServer {
    return new Proxy(server, {
        get(target, property) {
            if (property !== "registerTool")
                return Reflect.get(target, property, target);
            return (name: unknown, config: unknown, callback: unknown) => {
                if (typeof callback !== "function")
                    throw new TypeError("A tool callback is required.");
                const toolConfig = config as { title?: unknown; annotations?: Record<string, unknown> } | undefined;
                const titledConfig = typeof toolConfig?.title === "string" && toolConfig.title.trim()
                    ? { ...toolConfig, annotations: { ...toolConfig.annotations, title: toolConfig.title } }
                    : config;
                const guarded = guardToolCallback(async (...args: unknown[]) => {
                    const release = retainToolWork?.();
                    try { return await Reflect.apply(callback, undefined, args); }
                    finally { release?.(); }
                });
                return Reflect.apply(target.registerTool, target, [name, titledConfig, guarded]);
            };
        },
    });
}
