export const SITE_ORIGIN = 'https://nightsky.earth';
export const SUPPORT_EMAIL = 'NightSky.earth2026@gmail.com';
export type ListingConfig = {published:boolean;url:string|null};
export function resolvePluginAction(config:ListingConfig) {
  const unavailable={label:'Get started',href:'/get-started',external:false};
  try {
    const url=new URL(config.url || '');
    if(!config.published || url.protocol!=='https:' || url.hostname!=='chatgpt.com' || url.username || url.password || url.port || ['/', '/apps','/plugins','/gpts'].includes(url.pathname.replace(/\/$/,'') || '/')) return unavailable;
    return {label:'Get NightSky for ChatGPT',href:url.href,external:true};
  } catch { return unavailable; }
}
export function canonicalUrl(path:string) { try {return SITE_ORIGIN+new URL(path,SITE_ORIGIN).pathname;}catch{return SITE_ORIGIN+'/';} }
export type SiteRoute={path:string;title:string;description:string;sitemap:boolean};
export const siteRoutes:readonly SiteRoute[]=[
 ['/', 'Where Earth meets the stars', 'Explore, understand and prepare for the night sky with NightSky in ChatGPT.'],
 ['/resources','Resources for looking up','Find reviewed astronomy tools, guides and learning resources.'],
 ['/community','The Collective','A shared curiosity. The community we want to grow around the night sky.'],
 ['/news','News from the sky and beyond','Astronomy and space stories with links to the original reporting.'],
 ['/about','About NightSky','Helping curiosity find its way to time under the stars.'],
 ['/contact','Contact NightSky','Questions, feedback and corrections for NightSky.'],
 ['/get-started','Get started with NightSky','Availability, example questions and help starting with NightSky.'],
 ['/meteor-showers','Meteor showers','Understand the factors that shape a night of meteor watching.'],
 ['/sources','Sources & coverage','Understand what a NightSky answer is based on.'],
 ['/privacy','Privacy','Privacy information and publication status.'],
 ['/terms','Terms','Service terms and publication status.'],
].map(([path,title,description])=>({path,title,description,sitemap:true}));
