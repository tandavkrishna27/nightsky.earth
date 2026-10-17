import type { SourceRecord } from '../../../shared/nightsky/common';
const plain = (value: string) => value.replace(/[\\[\]<>`*_~\r\n]/g, ' ').replace(/\s+/g, ' ').trim();
const link = (value: string): string | undefined => {
    try {
        const url = new URL(value);
        if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password)
            return;
        return url.href.replace(/[<>]/g, c => encodeURIComponent(c));
    }
    catch {
        return;
    }
};
/** Required credits are distinct even when two sources share one URL. */
export function apiAttributionText(text: string, sources: SourceRecord[]): string {
    const unique = new Map(sources.map(source => [JSON.stringify([source.name, source.url, source.attribution, source.licenseUrl]), source]));
    const lines = Array.from(unique.values()).map(source => {
        const url = link(source.url);
        const license = source.licenseUrl ? link(source.licenseUrl) : undefined;
        return `- ${plain(source.name)}: ${plain(source.attribution)}${url ? ` [Source](<${url}>)` : ''}${license ? ` [License](<${license}>)` : ''}`;
    });
    return `${text}\n\nSource credits:\n${lines.join('\n')}`;
}
