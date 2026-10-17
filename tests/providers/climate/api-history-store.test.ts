import assert from "node:assert/strict";
import test from "node:test";
import { lstat, mkdir, mkdtemp, readFile, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("history file store persists bounded summaries and serializes worker leases", async () => {
  const api = await import("../../../server/providers/climate/apiHistoryStore").catch(() => undefined);
  assert.equal(typeof api?.createApiHistoryFileStore, "function", "durable compact history store is missing");
  if (!api) return;
  const directory = await mkdtemp(join(tmpdir(), "nightsky-history-store-"));
  const first = await api.createApiHistoryFileStore({ directory, maxEntries: 1 });
  const key = "a".repeat(64);
  const bytes = Buffer.from('{"synthetic":"summary","count":3}');
  const release = await first.acquireLease();
  await first.putSummary(key, bytes);
  const reopened = await api.createApiHistoryFileStore({ directory, maxEntries: 1 });
  assert.deepEqual(await reopened.readSummary(key), bytes);
  assert.equal(await reopened.readSummary("b".repeat(64)), undefined);
  await assert.rejects(reopened.putSummary("b".repeat(64), bytes), /lease/);
  await assert.rejects(first.putSummary("b".repeat(64), bytes), /capacity/);
  await assert.rejects(reopened.acquireLease(), /busy/);
  await release();
  const secondRelease = await reopened.acquireLease();
  await secondRelease();
  assert.deepEqual(await readFile(join(directory, `summary-${key}.json`), "utf8").then(JSON.parse).then(x => x.key), key);
});

test("history store rejects a linked ancestor before creating its directory", async () => {
  const { createApiHistoryFileStore } = await import("../../../server/providers/climate/apiHistoryStore");
  const base = await mkdtemp(join(tmpdir(), "nightsky-history-link-"));
  const target = join(base, "target"), alias = join(base, "alias");
  await mkdir(target);
  await symlink(target, alias, process.platform === "win32" ? "junction" : "dir");
  await assert.rejects(createApiHistoryFileStore({ directory: join(alias, "unexpected") }), /Linked/);
  await assert.rejects(lstat(join(target, "unexpected")), { code: "ENOENT" });
});

test("history store rejects corruption, oversized writes and invalid identities", async () => {
  const { createApiHistoryFileStore } = await import("../../../server/providers/climate/apiHistoryStore");
  const directory = await mkdtemp(join(tmpdir(), "nightsky-history-corrupt-"));
  const store = await createApiHistoryFileStore({ directory });
  const key = "c".repeat(64);
  const release = await store.acquireLease();
  await assert.rejects(store.putSummary("../escape", Buffer.from("{}")), /key/);
  await assert.rejects(store.putSummary(key, Buffer.alloc(262145)), /bound/);
  await store.putSummary(key, Buffer.from('{"synthetic":true}'));
  const path = join(directory, `summary-${key}.json`);
  const envelope = JSON.parse(await readFile(path, "utf8"));
  envelope.sha256 = "0".repeat(64);
  await writeFile(path, JSON.stringify(envelope));
  await assert.rejects(store.readSummary(key), /integrity/);
  await store.writeJournal(key, { status: "request-intent", request: 1 });
  assert.deepEqual(await store.readJournal(key), { status: "request-intent", request: 1 });
  await release();
});

test("history mutations require ownership and serialize the capacity check", async () => {
  const { createApiHistoryFileStore } = await import("../../../server/providers/climate/apiHistoryStore");
  const directory = await mkdtemp(join(tmpdir(), "nightsky-history-own-"));
  const store = await createApiHistoryFileStore({ directory, maxEntries: 1 });
  await assert.rejects(store.putSummary("a".repeat(64), Buffer.from("{}")), /lease/);
  await assert.rejects(store.writeJournal("b".repeat(64), {}), /lease/);
  const release = await store.acquireLease();
  const outcomes = await Promise.allSettled([store.putSummary("a".repeat(64), Buffer.from("{}")), store.putSummary("b".repeat(64), Buffer.from("{}"))]);
  assert.equal(outcomes.filter(x => x.status === "fulfilled").length, 1);
  assert.equal(outcomes.filter(x => x.status === "rejected").length, 1);
  await release();
  await assert.rejects(store.writeJournal("b".repeat(64), {}), /lease/);
});
