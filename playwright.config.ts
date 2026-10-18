import { defineConfig, devices } from '@playwright/test';
const testPort = process.env.PLAYWRIGHT_PORT ?? '5182';
const testOrigin = `http://127.0.0.1:${testPort}`;
export default defineConfig({testDir:'./tests/browser',testIgnore:'host-routing.spec.ts',fullyParallel:false,workers:1,use:{baseURL:testOrigin,...devices['Desktop Chrome'],reducedMotion:'reduce',screenshot:'only-on-failure',storageState:{cookies:[],origins:[{origin:testOrigin,localStorage:[{name:'nightsky-analytics-consent',value:'rejected'}]}]}},webServer:{command:`node --import tsx scripts/serve-website.mjs --port=${testPort}`,url:testOrigin,reuseExistingServer:false,timeout:30000}});
