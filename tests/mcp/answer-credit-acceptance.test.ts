import test from 'node:test';
import assert from 'node:assert/strict';
import { assessAnswerCredits } from '../../scripts/answer-credit-acceptance';

const source={name:'GeoNames',url:'https://www.geonames.org/',attribution:'GeoNames. Modified by NightSky.earth.',licenseUrl:'https://creativecommons.org/licenses/by/4.0/',modified:true,dataClass:'context' as const};
const complete=`Facts. ${source.attribution} [GeoNames](<${source.url}>) [Licence](<${source.licenseUrl}>)`;

test('credit acceptance rejects omission and accepts exact returned notices with actual links',()=>{
 assert.equal(assessAnswerCredits('A useful plan.',[source]).status,'incomplete');
 assert.deepEqual(assessAnswerCredits(complete,[source]),{status:'complete',issues:[]});
 assert.equal(assessAnswerCredits(`${source.attribution} ${source.url} ${source.licenseUrl}`,[source]).status,'incomplete','plain URLs are not proof of a displayed linked credit');
 assert.equal(assessAnswerCredits(complete.replace(source.attribution,'GeoNames.'),[source]).status,'incomplete');
 assert.equal(assessAnswerCredits(complete.replace(`[Licence](<${source.licenseUrl}>)`,''),[source]).status,'incomplete');
});

test('credit acceptance preserves distinct same-provider notices and refuses absent or unsafe evidence',()=>{
 const other={...source,attribution:'Different dataset notice.'};
 assert.equal(assessAnswerCredits(complete,[source,other]).status,'incomplete');
 assert.equal(assessAnswerCredits(`${complete} ${other.attribution}`,[source,other]).status,'complete');
 assert.equal(assessAnswerCredits(complete,[]).status,'not-assessed');
 for(const url of ['javascript:alert(1)','https://user:secret@example.test/','not-a-url']){
  assert.equal(assessAnswerCredits(complete,[{...source,url}]).status,'incomplete');
  assert.equal(assessAnswerCredits(complete,[{...source,licenseUrl:url}]).status,'incomplete');
 }
 const decoy=complete.replace(`[GeoNames](<${source.url}>)`,`[Decoy](<https://example.test/?url=${source.url}>)`);
 assert.equal(assessAnswerCredits(decoy,[source]).status,'incomplete');
 assert.equal(assessAnswerCredits(complete.replace(/ /g,'  '),[source]).status,'complete');
});

test('credit acceptance never counts non-rendered or ambiguous Markdown as proof of displayed credits',()=>{
 const links=`[Source](<${source.url}>) [Licence](<${source.licenseUrl}>)`;
 for(const hidden of [`\`\`\`\n${links}\n\`\`\``,`~~~\n${links}\n~~~`,`<!-- ${links} -->`,`\`${links}\``,links.replaceAll('[','!['),links.replaceAll('[','\\['),`<script>${links}</script>`]){
  assert.equal(assessAnswerCredits(`${source.attribution}\n${hidden}`,[source]).status,'incomplete',hidden);
 }
});
