import { McpServer } from "@modelcontextprotocol/server";
import { registerNightSkyTools, type NightSkyDependencies } from "./registerTools";
import { boundedToolRegistration } from "./toolResults";

export const NIGHTSKY_SERVER_INSTRUCTIONS = `Candidate places do not prove access or safety. Historical data history is not a forecast. Keep forecast sources separate. Missing inputs and unavailable data must remain unknown rather than guessed. Never convert user-supplied coordinates into a place name; ask for a named destination. Set useApproximateHostLocation only when the user explicitly asks for “near me” or their current area. Ignore host-location metadata unless this flag is true. Preserve source attribution, forecast valid times, uncertainty, and source disagreement in every answer.`;

export function createNightSkyMcpServer(dependencies: NightSkyDependencies = {}, retainToolWork?: () => () => void): McpServer {
  const server = new McpServer({ name: "nightsky-earth", version: "0.1.0" }, { capabilities: { tools: {} }, instructions: NIGHTSKY_SERVER_INSTRUCTIONS, maxToolInputElements: 10_000 });
  registerNightSkyTools(boundedToolRegistration(server, retainToolWork), dependencies);
  return server;
}
