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
        catch {
            return safeError("NightSky could not complete this tool request. Try a smaller request or try again shortly.");
        }
    };
}
/** Registration facade preserves the SDK's generic overloads and config.
 * Only callbacks are wrapped; every server owns its own registrations.
 */
export function boundedToolRegistration(server: McpServer): McpServer {
    return new Proxy(server, {
        get(target, property) {
            if (property !== "registerTool")
                return Reflect.get(target, property, target);
            return (name: unknown, config: unknown, callback: unknown) => {
                if (typeof callback !== "function")
                    throw new TypeError("A tool callback is required.");
                const guarded = guardToolCallback((...args: unknown[]) => Reflect.apply(callback, undefined, args));
                return Reflect.apply(target.registerTool, target, [name, config, guarded]);
            };
        },
    });
}
