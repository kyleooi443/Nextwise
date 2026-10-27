import test from 'node:test';
import { workspaceStorageKey } from './workspace.ts';
import assert from 'node:assert/strict';
import { validateAuthInput, safeNext, isSameOrigin } from './validation.ts';
import { MemoryRateLimiter, consumeRateLimit } from './rate-limit.ts';

test('normalizes email and name without altering passwords', () => {
 const result=validateAuthInput('signup',{email:' Jane@Example.COM ',name:' Jane ',password:' a long passphrase ',confirmPassword:' a long passphrase '});
 assert.equal(result.email,'jane@example.com'); assert.equal(result.name,'Jane'); assert.equal(result.password,' a long passphrase '); assert.deepEqual(result.errors,{});
});
test('validates new passwords, confirmation, input types and length limits', () => {
 assert.ok(validateAuthInput('signup',{email:'bad',name:'',password:'short'}).errors.password);
 assert.ok(validateAuthInput('reset',{password:'long enough password',confirmPassword:'different'}).errors.confirmPassword);
 assert.ok(validateAuthInput('login',{email:['a@b.com'],password:'x'}).errors.email);
 assert.ok(validateAuthInput('login',{email:'a@b.com',password:'x'.repeat(129)}).errors.password);
 assert.deepEqual(validateAuthInput('login',{email:'a@b.com',password:'oldpass'}).errors,{});
});
test('rejects external, protocol-relative, encoded and unknown redirect destinations', () => {
 for(const path of ['https://evil.test','//evil.test','/\\evil.test','/%2f%2fevil.test','/api/auth/login','/login']) assert.equal(safeNext(path),'/today');
 assert.equal(safeNext('/inbox?q=notes'),'/inbox?q=notes');
 assert.equal(isSameOrigin('https://app.test','https://app.test'),true);
 assert.equal(isSameOrigin(null,'https://app.test'),false);
 assert.equal(isSameOrigin('https://evil.test','https://app.test'),false);
});
test('limits concurrent attempts, isolates keys and expires windows', async () => {
 let now=1000;const store=new MemoryRateLimiter(()=>now);
 const results=await Promise.all(Array.from({length:12},()=>store.consume('a',5,60)));
 assert.equal(results.filter(x=>x.allowed).length,5);
 assert.equal(results.at(-1).retryAfter,60);
 assert.equal((await store.consume('b',5,60)).allowed,true);
 now+=60000;assert.equal((await store.consume('a',5,60)).allowed,true);
});
test('production refuses to fall back to memory when shared limiter is unavailable', async () => {
 await assert.rejects(()=>consumeRateLimit('x',5,60,{NODE_ENV:'production'}),/unavailable/);
});
test('Redis errors and malformed counters fail closed', async () => {
 const env={NODE_ENV:'production',UPSTASH_REDIS_REST_URL:'https://redis.test',UPSTASH_REDIS_REST_TOKEN:'test'};
 await assert.rejects(()=>consumeRateLimit('x',5,60,env,async()=>new Response('{"error":"denied"}',{status:200})),/unavailable/);
 await assert.rejects(()=>consumeRateLimit('x',5,60,env,async()=>new Response('{"result":[null,60]}',{status:200})),/unavailable/);
 let sent;const response=await consumeRateLimit('x',5,60,env,async(url,options)=>{sent=JSON.parse(options.body);return new Response('{"result":[6,42]}');});
 assert.equal(sent[0],'EVAL');assert.equal(response.allowed,false);assert.equal(response.retryAfter,42);
});

test('workspace storage is separated by verified identity and never uses the legacy key', () => {
 assert.notEqual(workspaceStorageKey('user-a'),workspaceStorageKey('user-b'));
 assert.notEqual(workspaceStorageKey('user-a'),'nextwise-state-v1');
 assert.throws(()=>workspaceStorageKey(''));
});
