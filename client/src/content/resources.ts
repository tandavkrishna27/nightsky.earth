export type ResourceTopic='stargazing'|'photography'|'weather'|'events'|'places'|'equipment';
export type ResourceFormat='tools'|'guides'|'learning'|'communities';
export type Resource={id:string;name:string;description:string;topics:ResourceTopic[];format:ResourceFormat;url:string;reviewedAt:string;platforms?:string[];costLabel?:string};
export const topics:Record<ResourceTopic,string>={stargazing:'Stargazing',photography:'Photography',weather:'Weather',events:'Sky events',places:'Places',equipment:'Equipment'};
export const formats:Record<ResourceFormat,string>={tools:'Apps & tools',guides:'Guides',learning:'Videos & courses',communities:'Communities'};
export const resources:Resource[]=[
 {id:'stellarium',name:'Stellarium',description:'Explore a realistic planetarium and become familiar with the sky before you head outside.',topics:['stargazing'],format:'tools',url:'https://stellarium.org/',reviewedAt:'2026-10-16'},
 {id:'timeanddate',name:'Time and Date Astronomy',description:'Explore Sun and Moon information, eclipses and astronomy reference tools for a chosen place.',topics:['stargazing','events'],format:'tools',url:'https://www.timeanddate.com/astronomy/',reviewedAt:'2026-10-16'},
 {id:'nasa-meteors',name:'NASA: Meteors & Meteorites',description:'Understand meteors, meteorites and the celestial debris behind the streaks of light.',topics:['events','stargazing'],format:'guides',url:'https://science.nasa.gov/solar-system/meteors-meteorites/',reviewedAt:'2026-10-16'},
];
