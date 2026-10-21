import test from 'node:test';
import assert from 'node:assert/strict';
import {createStore} from '../server.mjs';
const origin='https://shop.example.test',admin={email:'qa@example.test',password:'Synthetic-test-only-234!'};
const catalog=[{code:'AS1101',name:'Sıva üstü lineer',web_image:'/assets/collection/products/p05-02.webp',power:20,group:'Lineer'}];
async function fixture(t,options={}){
  const app=await createStore({dbPath:':memory:',origin,catalog,admin,...options});
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+app.server.address().port;let cookie='',csrf='';
  t.after(()=>app.close());
  async function call(route,{method='GET',body,headers={}}={}){
    const response=await fetch(base+route,{method,headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...(csrf?{'X-CSRF-Token':csrf}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)});
    const data=await response.json();return {response,data,status:response.status};
  }
  async function login(){const result=await call('/api/admin/login',{method:'POST',body:admin});cookie=result.response.headers.get('set-cookie').split(';')[0];csrf=result.data.csrf;return result;}
  async function publish(){await login();return call('/api/admin/products/AS1101',{method:'PATCH',body:{name:'Sıva üstü lineer',priceCents:125050,stock:10,active:true,version:1}});}
  const request={customer:{name:'Örnek müşteri',phone:'05000000000',city:'İstanbul',note:'Sıcak ışık'},items:[{code:'AS1101',quantity:2,version:2,priceCents:1}]};
  return {app,call,login,publish,request};
}
test('admin data requires authentication, mutations require CSRF, logout revokes session',async t=>{
  const f=await fixture(t);assert.equal((await f.call('/api/admin/products')).status,401);
  const login=await f.login();assert.match(login.response.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);assert.match(login.response.headers.get('set-cookie'),/Secure/);
  assert.equal((await f.call('/api/admin/products')).status,200);
  assert.equal((await f.call('/api/admin/products/AS1101',{method:'PATCH',body:{},headers:{'X-CSRF-Token':'wrong'}})).status,403);
  assert.equal((await f.call('/api/admin/logout',{method:'POST',body:{}})).status,200);
  assert.equal((await f.call('/api/admin/requests')).status,401);
});
test('foreign origins cannot log in or submit data; initial setup is closed by default',async t=>{
  const f=await fixture(t,{admin:undefined});
  assert.equal((await f.call('/api/admin/login',{method:'POST',body:admin,headers:{Origin:'https://untrusted.test'}})).status,403);
  assert.equal((await f.call('/api/admin/setup',{method:'POST',body:admin})).status,403);
  assert.equal((await f.call('/api/admin/session')).data.setupAllowed,false);
});
test('prices begin empty; only explicitly published products appear in the store',async t=>{
  const f=await fixture(t);assert.deepEqual((await f.call('/api/store')).data.products,[]);assert.equal((await f.publish()).status,200);
  const p=(await f.call('/api/store')).data.products[0];assert.equal(p.priceCents,125050);assert.equal(p.stock,10);
  assert.equal((await f.call('/api/admin/products/AS1101',{method:'PATCH',body:{name:p.name,priceCents:-1,stock:10,active:true,version:2}})).status,400);
  assert.equal((await f.call('/api/admin/products/AS1101',{method:'PATCH',body:{name:p.name,priceCents:200,stock:10,active:true,version:1}})).status,409);
});
test('server calculates totals, preserves Turkish customer data and deduplicates retries',async t=>{
  const f=await fixture(t);await f.publish();
  const headers={'Idempotency-Key':'synthetic-request-001'},first=await f.call('/api/order-requests',{method:'POST',body:f.request,headers});assert.equal(first.status,201);assert.equal(first.data.paid,false);
  const retry=await f.call('/api/order-requests',{method:'POST',body:f.request,headers});assert.equal(retry.data.id,first.data.id);
  const changed=structuredClone(f.request);changed.items[0].quantity=3;assert.equal((await f.call('/api/order-requests',{method:'POST',body:changed,headers})).status,409);
  const records=(await f.call('/api/admin/requests')).data.requests;assert.equal(records.length,1);assert.equal(records[0].total,250100);assert.equal(records[0].customer.city,'İstanbul');assert.equal(records[0].items[0].priceCents,125050);
  assert.equal((await f.call('/api/store')).data.products[0].stock,10,'requests do not silently reserve stock');
});
test('stale prices, out-of-stock quantities and duplicate lines are rejected',async t=>{
  const f=await fixture(t);await f.publish();
  for(const [n,items]of [[1,[{code:'AS1101',quantity:11,version:2}]],[2,[{code:'AS1101',quantity:2,version:1}]],[3,[{code:'AS1101',quantity:2,version:2},{code:'AS1101',quantity:1,version:2}]]]){
    const result=await f.call('/api/order-requests',{method:'POST',body:{...f.request,items},headers:{'Idempotency-Key':'synthetic-request-00'+n}});assert.equal(result.status,409);
  }
});
test('payment cannot be marked successful when no provider is connected',async t=>{
  const f=await fixture(t);await f.publish();assert.equal((await f.call('/api/checkout',{method:'POST',body:{}})).status,503);
  const created=await f.call('/api/order-requests',{method:'POST',body:f.request,headers:{'Idempotency-Key':'synthetic-request-004'}});
  assert.equal((await f.call('/api/admin/requests/'+created.data.id,{method:'PATCH',body:{status:'paid',version:1}})).status,400);
  assert.equal((await f.call('/api/admin/requests/'+created.data.id,{method:'PATCH',body:{status:'reviewing',note:'Müşteriyle görüşülecek.',version:1}})).status,200);
  assert.equal((await f.call('/api/admin/requests')).data.requests[0].note,'Müşteriyle görüşülecek.');
});
