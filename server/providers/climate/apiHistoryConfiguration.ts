import { hostedMethodAdmissionSchema } from "../../../shared/nightsky/climate";
import { createApiHistoryProvider } from "./apiHistoryProvider";
import { createApiHistoryFileStore } from "./apiHistoryStore";

export interface ApiHistoryEnvironment {
  NIGHTSKY_API_HISTORY_CACHE_DIRECTORY?: string;
  /** Strict JSON HostedMethodAdmission. An operator policy decision, never inferred from cache contents. */
  NIGHTSKY_API_HISTORY_ADMISSION?: string;
}

/** Optional configured-server seam. Never reads process.env implicitly and never launches acquisition. */
export async function createConfiguredApiHistoryProvider(env: ApiHistoryEnvironment) {
  const directory = env.NIGHTSKY_API_HISTORY_CACHE_DIRECTORY, raw = env.NIGHTSKY_API_HISTORY_ADMISSION;
  if (directory === undefined && raw === undefined) return undefined;
  if (!directory || !raw) throw Error("API history serving requires both cache directory and explicit hosted admission");
  if (directory.length > 4096 || raw.length > 2048) throw Error("API history configuration bound");
  const admission = hostedMethodAdmissionSchema.parse(JSON.parse(raw));
  const cache = await createApiHistoryFileStore({ directory, maxEntries: 64 });
  return createApiHistoryProvider({ cache, admission });
}
