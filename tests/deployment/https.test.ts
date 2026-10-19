import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=(name:string)=>readFileSync(`ops/hetzner/${name}`,'utf8');

test('HTTP bootstrap exposes only bounded ACME files and requires no certificate or proxy',()=>{
 const s=read('nginx-acme-bootstrap.conf');
 for(const value of ['listen 80;','server_name mcp.nightsky.earth mcp-staging.nightsky.earth;','location ^~ /.well-known/acme-challenge/','root /var/www/nightsky-acme;','try_files $uri =404;','limit_except GET { deny all; }','location / { return 403; }','client_max_body_size 32k;'])assert.ok(s.includes(value),value);
 assert.ok(!s.includes('ssl_certificate '));assert.ok(!s.includes('proxy_pass '));
});

test('HTTPS templates keep HTTP ACME renewal ahead of location redirect and staging denied',()=>{
 for(const env of ['staging','production']){
  const s=read(`nginx-${env}.conf`),http=s.slice(s.lastIndexOf('server {'));
  assert.ok(http.includes('location ^~ /.well-known/acme-challenge/'));
  assert.ok(http.includes('try_files $uri =404;'));
  assert.ok(http.includes('limit_except GET { deny all; }'));
  assert.match(http,/location \/ \{ return 308 https:/);
  assert.doesNotMatch(http,/^    return 308/m);
  assert.equal((s.match(/location \^~ \/\.well-known/g)||[]).length,1);
  if(env==='staging')assert.match(s.slice(0,s.lastIndexOf('server {')),/location \/ \{\s+deny all;/);
 }
});
