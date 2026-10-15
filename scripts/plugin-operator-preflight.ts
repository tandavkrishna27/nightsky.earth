import { lstat, open } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { constants } from 'node:fs';
import { operatorPreflight } from '../shared/nightsky/operator';
/** Only explicit --config path; relative artifact paths are based on that file's directory. */
export async function operatorPreflightCli(args: string[]): Promise<number> {
    try {
        if (args.length !== 2 || args[0] !== '--config')
            throw Error();
        const path = resolve(args[1]);
        const info = await lstat(path);
        if (!info.isFile() || info.isSymbolicLink() || info.size > 1024 * 1024)
            throw Error();
        const handle = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
        let input: unknown;
        try {
            const before = await handle.stat();
            if (!before.isFile() || before.size > 1024 * 1024)
                throw Error();
            const buffer = Buffer.alloc(1024 * 1024 + 1);
            let length = 0;
            while (length < buffer.length) {
                const { bytesRead } = await handle.read(buffer, length, buffer.length - length, null);
                if (!bytesRead)
                    break;
                length += bytesRead;
            }
            const after = await handle.stat();
            if (length > 1024 * 1024 || before.ino !== after.ino || before.mtimeMs !== after.mtimeMs || before.size !== after.size)
                throw Error();
            input = JSON.parse(buffer.subarray(0, length).toString('utf8'));
        }
        finally {
            await handle.close();
        }
        const result = await operatorPreflight(input, dirname(path));
        console.log(JSON.stringify(result));
        return result.status === 'offline-pass' ? 0 : result.status === 'incomplete-owner-inputs' ? 2 : 1;
    }
    catch {
        console.log(JSON.stringify({ status: 'invalid', findings: ['CONFIG_INPUT_INVALID'], hostChecksPerformed: false, deploymentReady: false, officialAccepted: false }));
        return 1;
    }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
    operatorPreflightCli(process.argv.slice(2)).then(code => { process.exitCode = code; });
