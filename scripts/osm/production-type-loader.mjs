/** Fixed Node 24 admission loader. Type erasure stays in-process: no esbuild child. */
import {registerHooks,stripTypeScriptTypes} from 'node:module';
import {openSync,readSync,fstatSync,closeSync,lstatSync,realpathSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {relative,isAbsolute} from 'node:path';
const root=realpathSync(fileURLToPath(new URL('../../',import.meta.url)));
registerHooks({
 resolve(specifier,context,nextResolve){
  try{return nextResolve(specifier,context);}catch(error){
   if(error.code!=='ERR_MODULE_NOT_FOUND'||!specifier.startsWith('.'))throw error;
   for(const suffix of ['.ts','/index.ts']){
    try{return nextResolve(specifier+suffix,context);}catch(candidate){if(candidate.code!=='ERR_MODULE_NOT_FOUND')throw candidate;}
   }
   throw error;
  }
 },
 load(url,context,nextLoad){
  const location=new URL(url);
  if(location.protocol!=='file:'||!location.pathname.endsWith('.ts'))return nextLoad(url,context);
  if(location.search||location.hash)throw new Error('Admission TypeScript query/fragment refused');
  const path=realpathSync(fileURLToPath(location)),inside=relative(root,path);
  if(inside.startsWith('..')||isAbsolute(inside)||lstatSync(fileURLToPath(location)).isSymbolicLink())throw new Error('Admission TypeScript outside fixed checkout');
  const handle=openSync(path,'r');let source;
  try{
   const before=fstatSync(handle);if(!before.isFile()||before.size>1024*1024)throw new Error('Admission TypeScript byte limit');
   const body=Buffer.alloc(before.size+1);let count=0;
   while(count<body.length){const amount=readSync(handle,body,count,body.length-count,null);if(!amount)break;count+=amount;}
   const after=fstatSync(handle),linked=lstatSync(path);
   const identity=value=>[value.dev,value.ino,value.size,value.mtimeMs,value.ctimeMs].join(':');
   if(count!==before.size||identity(before)!==identity(after)||identity(after)!==identity(linked))throw new Error('Admission TypeScript mutation');
   source=new TextDecoder('utf8',{fatal:true}).decode(body.subarray(0,count));
  }finally{closeSync(handle);}
  return {format:'module',source:stripTypeScriptTypes(source,{mode:'strip',sourceUrl:url}),shortCircuit:true};
 }
});
