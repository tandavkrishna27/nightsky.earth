/** Small process-local cache. Stores successful normalized results only, never credentials or errors. */
export function cacheSourceMethod<T extends (input: any) => Promise<any>>(method:T, now:()=>number, ttlMs:number):T {
  const entries=new Map<string,{until:number;value:unknown}>();
  return (async(input:Parameters<T>[0])=>{
    const key=JSON.stringify(input);
    const old=entries.get(key);
    if(old&&old.until>now())return structuredClone(old.value);
    entries.delete(key);
    const value=await method(input);
    if((value?.status==='ok'||value?.status==='available')&&key.length<=4096&&Buffer.byteLength(JSON.stringify(value),'utf8')<=128*1024){
      if(entries.size>=32)entries.delete(entries.keys().next().value!);
      entries.set(key,{until:now()+ttlMs,value:structuredClone(value)});
    }
    return value;
  }) as T;
}
