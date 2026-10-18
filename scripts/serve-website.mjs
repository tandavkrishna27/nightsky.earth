const production=process.argv.includes('--production');
process.env.NODE_ENV=production?'production':'development';
process.env.PORT=process.argv.find(x=>x.startsWith('--port='))?.split('=')[1]||process.env.PORT||'5178';
await import(production?'../dist/index.js':'../server/index.ts');
