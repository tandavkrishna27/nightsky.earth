import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { V1_TOOL_ANNOTATIONS } from './registerTools';
import { OPTIONAL_SKY_TOOL_NAMES } from './optionalSkyTools';
import { LIGHT_POLLUTION_TOOL_NAMES } from './lightPollutionTools';
import { RESULT_CARD_URI } from './resultCard';

const methods = ['initialize', 'ping', 'tools/list', 'tools/call', 'notifications/initialized', 'notifications/cancelled', 'resources/list', 'resources/read', 'resources/templates/list', 'prompts/list', 'prompts/get', 'logging/setLevel', 'completion/complete'] as const;
export type McpDiagnosticMethod = typeof methods[number] | 'OTHER';
export type McpDiagnosticTool = keyof typeof V1_TOOL_ANNOTATIONS | typeof OPTIONAL_SKY_TOOL_NAMES[number] | typeof LIGHT_POLLUTION_TOOL_NAMES[number] | 'unknown';
export type McpDiagnosticReason = 'completed' | 'client-disconnected' | 'global-limit' | 'tool-limit' | 'protocol-limit' | 'key-limit' | 'subject-limit' | 'concurrency-limit' | 'host-rejected' | 'proxy-rejected' | 'handler-failure' | 'unknown-rejection';
type Labels = {requestId: string; method: McpDiagnosticMethod; tool: McpDiagnosticTool; resource: 'planning-card' | 'other' | 'none'};
export type McpDiagnosticEvent =
 | (Labels & {kind: 'ingress'; status: null; elapsedMs: 0; reason: 'ingress'})
 | (Labels & {kind: 'completion'; status: number; elapsedMs: number; reason: McpDiagnosticReason});
export type McpDiagnosticSink = (event: McpDiagnosticEvent) => void | Promise<void>;
const context = new AsyncLocalStorage<string>();
/** Only locally generated correlation UUIDs enter this context. */
export function currentMcpRequestId(): string | undefined { return context.getStore(); }
const knownTools = new Set<string>([...Object.keys(V1_TOOL_ANNOTATIONS), ...OPTIONAL_SKY_TOOL_NAMES, ...LIGHT_POLLUTION_TOOL_NAMES]);

/** Runs after the host application's body parser; parser rejections are outside its scope. */
export function mcpRequestDiagnostics(sink?: McpDiagnosticSink): {middleware: RequestHandler; reason: (response: object, reason: McpDiagnosticReason) => void; gate: (gate: RequestHandler, reason: McpDiagnosticReason) => RequestHandler} {
 const reasons = new WeakMap<object, McpDiagnosticReason>();
 const emit = (event: McpDiagnosticEvent) => {
  try { const pending = sink?.(event); if (pending) void Promise.resolve(pending).catch(() => undefined); } catch { /* Observability cannot affect admission or response completion. */ }
 };
 const middleware: RequestHandler = (req, res, next) => {
  const requestId = randomUUID();
  const body = req.body;
  const rawMethod = body && !Array.isArray(body) ? body.method : undefined;
  const method = methods.includes(rawMethod) ? rawMethod as McpDiagnosticMethod : 'OTHER';
  const name = method === 'tools/call' ? body?.params?.name : undefined;
  const tool = typeof name === 'string' && knownTools.has(name) ? name as McpDiagnosticTool : 'unknown';
  const resource = method === 'resources/read' ? body?.params?.uri === RESULT_CARD_URI ? 'planning-card' : 'other' : 'none';
  const labels: Labels = {requestId, method, tool, resource};
  const start = performance.now(); let done = false;
  const complete = (closed: boolean) => {
   if (done) return; done = true;
   emit({...labels,kind:'completion',status:res.statusCode,elapsedMs:Math.min(Number.MAX_SAFE_INTEGER,Math.max(0,Math.round(performance.now()-start))),reason:reasons.get(res) ?? (closed && !res.writableFinished ? 'client-disconnected' : res.statusCode >= 400 ? 'unknown-rejection' : 'completed')});
  };
  res.set('X-NightSky-Request-ID',requestId);
  res.once('finish',()=>complete(false));res.once('close',()=>complete(true));
  context.run(requestId,()=>{emit({...labels,kind:'ingress',status:null,elapsedMs:0,reason:'ingress'});next();});
 };
 return {middleware, reason: (res,reason)=>{reasons.set(res,reason);}, gate:(gate,reason)=>(req,res,next)=>{
  reasons.set(res,reason);
  gate(req,res,error=>{reasons.delete(res);next(error);});
 }};
}
