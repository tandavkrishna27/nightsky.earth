/** Test-only launcher for synthetic library integration. Production CLI has no bypass flag. */
import {assembleMembership,prepareAssemblyInputs} from '../../scripts/osm/membership-assembly';
const args=process.argv.slice(2);
if(args.length===7&&args[0]==='--prepare')await prepareAssemblyInputs(args[1],args[2],{path:args[3],bytes:Number(args[4]),sha256:args[5]},args[6]);
else if(args.length===4)await assembleMembership(args[0],args[1],args[2],args[3]);
else throw new Error('Synthetic assembly fixture arguments');
