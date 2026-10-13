/** Resolved absolute paths can differ in drive-letter case after Windows
 * realpath. Keep every other character exact: do not conceal path traversal,
 * symlink targets, or case-sensitive directory distinctions by folding names. */
export function sameResolvedPath(left:string,right:string,platform:NodeJS.Platform=process.platform):boolean {
 if(left===right)return true;
 if(platform!=="win32")return false;
 const driveCase=(path:string)=>/^[a-z]:[\\/]/i.test(path)?path[0]!.toLowerCase()+path.slice(1):path;
 return driveCase(left)===driveCase(right);
}
