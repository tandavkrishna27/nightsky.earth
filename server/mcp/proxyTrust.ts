import { BlockList, isIP } from "node:net";
import type { Express } from "express";

/** Sole immediate proxy only. The proxy must replace, never preserve, client XFF. */
export function configureMcpProxyTrust(app: Express, raw?: string): void {
  app.set("trust proxy", false);
  if (raw === undefined || raw === "") return;
  const list = new BlockList();
  const entries = raw.split(",");
  if (entries.length > 32) throw new TypeError("MCP proxy trust accepts at most 32 addresses.");
  for (const entry of entries) {
    const parts = entry.trim().split("/");
    const address = parts[0];
    const family = isIP(address);
    if (!family || parts.length > 2 || address.toLowerCase().startsWith("::ffff:") || address.includes("%")) {
      throw new TypeError("MCP proxy trust requires explicit IP addresses or narrow CIDRs.");
    }
    const type = family === 4 ? "ipv4" : "ipv6";
    if (parts.length === 1) list.addAddress(address, type);
    else {
      if (!/^\d+$/.test(parts[1])) throw new TypeError("Invalid MCP proxy CIDR.");
      const prefix = Number(parts[1]);
      if (prefix < (family === 4 ? 24 : 64) || prefix > (family === 4 ? 32 : 128)) {
        throw new TypeError("MCP proxy CIDRs must be /24–/32 or /64–/128.");
      }
      list.addSubnet(address, prefix, type);
    }
  }
  app.set("trust proxy", (peer: string, hop: number) => {
    if (hop !== 0) return false;
    const address = peer.startsWith("::ffff:") && isIP(peer.slice(7)) === 4 ? peer.slice(7) : peer;
    const family = isIP(address);
    return family !== 0 && list.check(address, family === 4 ? "ipv4" : "ipv6");
  });
}

/** Reject chains: this opt-in mode supports exactly one rewriting proxy. */
export const validateMcpForwardedClient: import("express").RequestHandler = (req, res, next) => {
 const trust = req.app.get("trust proxy fn") as (address:string,hop:number)=>boolean;
 if (trust?.(req.socket.remoteAddress ?? "",0)) {
  const forwarded=req.headers["x-forwarded-for"];
  if (forwarded !== undefined && (typeof forwarded !== "string" || !isIP(forwarded.trim()))) {
   res.status(400).json({message:"Invalid request."}); return;
  }
 }
 next();
};
