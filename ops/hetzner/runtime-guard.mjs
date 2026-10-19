// Loaded only by the hosted container command, before application modules.
// Do not print environment values: this process may contain provider secrets.
const env=process.env;
function reject(){throw Error('Invalid hosted NightSky configuration. Check the operator guide.');}
const mode=env.NIGHTSKY_DEPLOYMENT_ENV;
if(!['staging','production'].includes(mode)||env.NODE_ENV!=='production'||env.HOST!=='0.0.0.0'||env.PORT!=='5000'||env.NIGHTSKY_DISCOVERY_MODE!=='api')reject();
const hostname=mode==='production'?'mcp.nightsky.earth':'mcp-staging.nightsky.earth';
if(env.NIGHTSKY_MCP_ALLOWED_HOSTS!==`${hostname},localhost,127.0.0.1`||env.NIGHTSKY_MCP_TRUSTED_PROXIES!==(mode==='production'?'172.30.80.1':'172.30.81.1'))reject();
for(const key of Object.keys(env)) {
 if(/^(NIGHTSKY_GEONAMES_INDEX|NIGHTSKY_OSM_|NIGHTSKY_GLOBAL_CATALOGUE_|NIGHTSKY_CLIMATE_|NIGHTSKY_ERA5_|NIGHTSKY_API_HISTORY_)/.test(key))reject();
}
if(env.NIGHTSKY_LIGHT_POLLUTION_BROWSER_ENABLED!==undefined&&env.NIGHTSKY_LIGHT_POLLUTION_BROWSER_ENABLED!=='false')reject();
const paths=['NIGHTSKY_QUOTA_STATE_PATH','NIGHTSKY_SKY_QUOTA_STATE_PATH','NIGHTSKY_LIGHT_POLLUTION_QUOTA_STATE_PATH','NIGHTSKY_PUBLICUNIVERSE_QUOTA_STATE_PATH'];
const selected=paths.flatMap(key=>env[key]===undefined?[]:[env[key]]);
if(selected.some(path=>!/^\/state\/[a-zA-Z0-9_-]+\.json$/.test(path))||new Set(selected).size!==selected.length)reject();
if(mode==='staging') {
 for(const key of Object.keys(env)) {
  if(/^NIGHTSKY_.*(?:API_KEY|_KEY|APP_ID|APP_SECRET|USERNAME)$/.test(key)||paths.includes(key))reject();
 }
 for(const key of ['NIGHTSKY_SKY_PROVIDERS','NIGHTSKY_SKY_ADMITTED_PROVIDERS','NIGHTSKY_WEATHER_ADMITTED_PROVIDERS','NIGHTSKY_LIGHT_POLLUTION_SOURCES','NIGHTSKY_LIGHT_POLLUTION_API_ADMITTED'])if(env[key])reject();
 globalThis.fetch=async()=>{throw Error('External sources are disabled in the staging profile.');};
}
