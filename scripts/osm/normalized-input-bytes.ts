/** Exact UTF8 size of JSON.stringify(string), without allocating the escaped representation. */
export function jsonStringBytes(value:string,maxBytes:number,checkpoint:()=>void=()=>{}):number {
 let bytes=2; // Surrounding quotation marks.
 if(bytes>maxBytes||value.length>maxBytes-2)throw new RangeError('Normalized input byte limit');
 for(let i=0;i<value.length;i++){
  if((i&1023)===0)checkpoint();
  const code=value.charCodeAt(i);
  if(code===34||code===92)bytes+=2;
  else if(code<32)bytes+=code===8||code===9||code===10||code===12||code===13?2:6;
  else if(code<128)bytes++;
  else if(code<2048)bytes+=2;
  else if(code>=0xd800&&code<=0xdbff){const next=value.charCodeAt(i+1);if(next>=0xdc00&&next<=0xdfff){bytes+=4;i++;}else bytes+=6;}
  else if(code>=0xdc00&&code<=0xdfff)bytes+=6;
  else bytes+=3;
  if(bytes>maxBytes)throw new RangeError('Normalized input byte limit');
 }
 checkpoint();return bytes;
}
