import { constants } from "node:fs";
import { lstat, mkdir, open, readdir, realpath, rename, unlink } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { dirname, isAbsolute, join, parse } from "node:path";

export interface ApiHistoryStore {
  readSummary(key: string): Promise<Uint8Array | undefined>;
  canPublish(key: string): Promise<boolean>;
  putSummary(key: string, bytes: Uint8Array): Promise<void>;
  readJournal(key: string): Promise<unknown | undefined>;
  writeJournal(key: string, journal: unknown): Promise<void>;
  acquireLease(): Promise<() => Promise<void>>;
}
const SUMMARY = 262144, JOURNAL = 65536, FILE = 384 * 1024;
const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const validKey = (key: string) => { if (!/^[a-f0-9]{64}$/.test(key)) throw Error("Invalid history store key"); };
async function statOrMissing(path: string) {
  try { return await lstat(path); } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined; throw error; }
}

/** Dedicated bounded cache/journal directory. Never scans, copies or deletes data elsewhere.
 * A full cache stops before acquisition; maintenance is explicit, not silent eviction.
 * The only removed file is this instance's own transient worker lease.
 */
export async function createApiHistoryFileStore(options: { directory: string; maxEntries?: number }): Promise<ApiHistoryStore> {
  const maxEntries = options.maxEntries ?? 64;
  if (!Number.isSafeInteger(maxEntries) || maxEntries < 1 || maxEntries > 64) throw Error("History store entry bound");
  const requested = options.directory;
  if (!isAbsolute(requested) || requested.startsWith("\\\\") || requested.replace(/\\/g, "/").startsWith("//") || requested.includes("\0") || requested.slice(parse(requested).root.length).includes(":")) throw Error("Unsafe history store directory");
  const exists = await statOrMissing(requested);
  for (let p = exists ? requested : dirname(requested);; p = dirname(p)) {
    const stat = await lstat(p);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw Error("Linked history store directory");
    if (dirname(p) === p) break;
  }
  if (!exists) await mkdir(requested);
  const directory = await realpath(requested);
  const directoryIdentity = await lstat(directory);
  let leaseToken: string | undefined, closing = false;
  let tail: Promise<unknown> = Promise.resolve();
  async function checkDirectory() {
    const current = await lstat(directory);
    if (!current.isDirectory() || current.isSymbolicLink() || current.dev !== directoryIdentity.dev || current.ino !== directoryIdentity.ino) throw Error("History directory identity changed");
  }
  const pathFor = (kind: "summary" | "journal", key: string) => { validKey(key); return join(directory, `${kind}-${key}.json`); };
  async function boundedRead(path: string, limit: number): Promise<Buffer | undefined> {
    await checkDirectory();
    const stat = await statOrMissing(path);
    if (!stat) return undefined;
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.size > limit) throw Error("Unsafe or oversized history store file");
    const file = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    try {
      const opened = await file.stat();
      if (!opened.isFile() || opened.nlink !== 1 || opened.size > limit || opened.dev !== stat.dev || opened.ino !== stat.ino) throw Error("History file identity changed");
      const buffer = Buffer.alloc(limit + 1); let length = 0;
      while (length <= limit) { const next = await file.read(buffer, length, buffer.length - length, null); if (!next.bytesRead) break; length += next.bytesRead; }
      if (length > limit) throw Error("History store file bound");
      return buffer.subarray(0, length);
    } finally { await file.close(); }
  }
  async function checkLease() {
    if (!leaseToken) throw Error("History mutation requires owned lease");
    const bytes = await boundedRead(join(directory, ".history-worker.lock"), 4096);
    if (!bytes || JSON.parse(bytes.toString("utf8")).token !== leaseToken) throw Error("History worker lease ownership changed");
  }
  function mutate(work: () => Promise<void>): Promise<void> {
    if (!leaseToken || closing) return Promise.reject(Error("History mutation requires owned lease"));
    const pending = tail.then(async () => { await checkLease(); await work(); });
    tail = pending.catch(() => undefined);
    return pending;
  }
  async function files(kind: "summary" | "journal") {
    const names = await readdir(directory);
    if (names.length > 132) throw Error("History directory file bound");
    return names.filter(name => new RegExp(`^${kind}-[a-f0-9]{64}\\.json$`).test(name));
  }
  async function room(kind: "summary" | "journal", key: string) {
    const names = await files(kind);
    return names.includes(`${kind}-${key}.json`) || names.length < maxEntries;
  }
  async function atomic(path: string, bytes: Uint8Array) {
    const existing = await statOrMissing(path);
    if (existing && (!existing.isFile() || existing.isSymbolicLink() || existing.nlink !== 1)) throw Error("Unsafe history store target");
    const temporary = path + ".pending";
    const file = await open(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
    try { await file.writeFile(bytes); await file.sync(); } finally { await file.close(); }
    await checkLease();
    const current = await statOrMissing(path);
    if (existing ? !current || current.isSymbolicLink() || current.nlink !== 1 || current.dev !== existing.dev || current.ino !== existing.ino : !!current) throw Error("History target identity changed");
    await rename(temporary, path);
    if (process.platform !== "win32") { const dir = await open(directory, "r"); try { await dir.sync(); } finally { await dir.close(); } }
  }
  const store: ApiHistoryStore = {
    async readSummary(key) {
      const bytes = await boundedRead(pathFor("summary", key), FILE);
      if (!bytes) return undefined;
      const envelope = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
      if (!envelope || Object.keys(envelope).sort().join() !== "key,payload,sha256,version" || envelope.version !== 1 || envelope.key !== key || typeof envelope.payload !== "string" || !/^[A-Za-z0-9+/]*={0,2}$/.test(envelope.payload)) throw Error("History cache integrity");
      const payload = Buffer.from(envelope.payload, "base64");
      if (payload.length > SUMMARY || payload.toString("base64") !== envelope.payload || hash(payload) !== envelope.sha256) throw Error("History cache integrity");
      return payload;
    },
    canPublish(key) { validKey(key); return room("summary", key); },
    putSummary(key, suppliedBytes) {
      if (suppliedBytes.byteLength > SUMMARY) return Promise.reject(Error("History summary byte bound"));
      const bytes = Buffer.from(suppliedBytes); return mutate(async () => {
      if (bytes.byteLength > SUMMARY) throw Error("History summary byte bound");
      const path = pathFor("summary", key);
      if (!(await room("summary", key))) throw Error("History cache capacity");
      const prior = await store.readSummary(key);
      if (prior) { if (hash(prior) !== hash(bytes)) throw Error("History cache revision already published"); return; }
      const envelope = Buffer.from(JSON.stringify({ version: 1, key, sha256: hash(bytes), payload: Buffer.from(bytes).toString("base64") }));
      if (envelope.length > FILE) throw Error("History summary envelope bound");
      await atomic(path, envelope);
    }); },
    async readJournal(key) {
      const bytes = await boundedRead(pathFor("journal", key), JOURNAL);
      return bytes ? JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) : undefined;
    },
    writeJournal(key, journal) { return mutate(async () => {
      const path = pathFor("journal", key);
      if (!(await room("journal", key))) throw Error("History journal capacity");
      const bytes = Buffer.from(JSON.stringify(journal));
      if (bytes.length > JOURNAL) throw Error("History journal byte bound");
      await atomic(path, bytes);
    }); },
    async acquireLease() {
      await checkDirectory();
      const path = join(directory, ".history-worker.lock");
      let file;
      try { file = await open(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600); }
      catch (error) { if ((error as NodeJS.ErrnoException).code === "EEXIST") throw Error("History worker busy; stale ownership requires review"); throw error; }
      const token = randomUUID();
      try { await file.writeFile(JSON.stringify({ token, pid: process.pid })); await file.sync(); }
      catch (error) { await file.close(); throw error; }
      leaseToken = token; closing = false;
      let released = false;
      return async () => {
        if (released) return;
        released = true; closing = true; await tail; await file.close();
        const owner = JSON.parse((await boundedRead(path, 4096))!.toString("utf8"));
        if (owner.token !== token) throw Error("History worker ownership changed");
        await unlink(path); // Only the verified transient lock owned by this lease.
        leaseToken = undefined; closing = false;
      };
    },
  };
  return store;
}
