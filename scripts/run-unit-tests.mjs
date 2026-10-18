import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const files=readdirSync('tests/unit').filter(x=>x.endsWith('.test.ts')).sort().map(x=>resolve('tests/unit',x));
const result=spawnSync(process.execPath,['--import','tsx','--test',...files],{stdio:'inherit'});
process.exit(result.status??1);
