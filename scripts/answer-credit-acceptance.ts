import type { SourceRecord } from '../shared/nightsky/common';

const normalize = (value:string) => value.replace(/\s+/g,' ').trim();
const safeUrl = (value:string):string|undefined => {
  try { const url=new URL(value); return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password?url.href:undefined; } catch { return undefined; }
};

/** Conservative offline acceptance contract, not a legal assessment or host enforcement.
 * Caller must explicitly supply the source records used by this particular answer.
 * Exact attribution after whitespace normalization is intentional; paraphrases need review.
 */
export function assessAnswerCredits(answer: string, selectedSources: readonly SourceRecord[]): {status:'complete'|'incomplete'|'not-assessed';issues:Array<{source:string;missing:string}>} {
  if(!selectedSources.length)return {status:'not-assessed',issues:[]};
  // This intentionally is not a general Markdown renderer. Refuse contexts in
  // which raw strings could be hidden/escaped or rendered as images, rather
  // than interpreting them optimistically. Such answers need visual review.
  if(/`|~~~|<!--|!\[|\\[\[\]()<>]|<[!/?a-zA-Z][^<>]*>(?!\))/u.test(answer.replace(/<https?:\/\/[^<>\s]+>/g,'')))
    return {status:'incomplete',issues:[{source:'selected answer',missing:'rendering review required: unsupported Markdown or HTML context'}]};
  const links=new Set(Array.from(answer.matchAll(/\]\(\s*(?:<([^<>\s]+)>|([^\s)]+))\s*\)/g),match=>safeUrl(match[1]??match[2]!)).filter((url):url is string=>url!==undefined));
  const text=normalize(answer),issues:Array<{source:string;missing:string}>=[];
  for(const source of selectedSources){
    if(!normalize(source.attribution)||!text.includes(normalize(source.attribution)))issues.push({source:source.name,missing:'returned attribution/modification notice'});
    for(const [field,value] of [['source link',source.url],...(source.licenseUrl?[['licence link',source.licenseUrl]]:[])] as Array<[string,string]>){
      const url=safeUrl(value);
      if(!url||!links.has(url))issues.push({source:source.name,missing:url?field:`unsafe ${field}`});
    }
  }
  return {status:issues.length?'incomplete':'complete',issues};
}
