const test=require('node:test'),assert=require('node:assert/strict'),C=require('../dist/assets/b2b-core.js');
test('bulk parsing rejects partial invalid input and invalid quantities',()=>{
  assert.deepEqual(C.parse('AS5002;6\nAS5206\t12').items,[{code:'AS5002',quantity:6},{code:'AS5206',quantity:12}]);
  for(const x of ['A;0','A;-1','A;1.5','A;NaN','A;10000','A;1\nB;x',';1'])assert.ok(C.parse(x).error,x);
});
test('merge keeps the original draft intact on limits and aggregates duplicates',()=>{
  const rows=[{code:'A',quantity:9998}];assert.deepEqual(C.merge(rows,[{code:'a',quantity:1}]).items,[{code:'A',quantity:9999}]);
  assert.ok(C.merge(rows,[{code:'a',quantity:2}]).error);assert.equal(rows[0].quantity,9998);
  const full=Array.from({length:50},(_,i)=>({code:'P'+i,quantity:1}));assert.ok(C.merge(full,[{code:'EXTRA',quantity:1}]).error);
});
test('storage handles corruption, expiry and future timestamps; omits private fields',()=>{
  const now=1000000000,rows=[{code:'AS5002',quantity:6,company:'Private firm'}];
  assert.equal(C.save(rows,now).includes('Private firm'),false);
  assert.equal(C.restore(C.save(rows,now),now).length,1);
  assert.deepEqual(C.restore(C.save(rows,now),now+C.TTL+1),[]);
  assert.deepEqual(C.restore(C.save(rows,now+70000),now),[]);
  assert.deepEqual(C.restore('{bad',now),[]);
});
test('messages preserve real catalog data and flag manual codes; CSV blocks formulas',()=>{
  const products=new Map([['AS5002',{name:'Artline sarkıt',power:112,page:22}]]);
  const rows=[{code:'AS5002',quantity:6},{code:'=HYPERLINK("bad")',quantity:2}];
  const text=C.message(rows,products,{company:'Örnek firma',note:'3000 K'},'https://example.test/urunler/');
  assert.match(text,/AS5002 — 6 adet.*112 W.*s.22/);assert.match(text,/Kod teyidi gerekli/);
  const csv=C.csv(rows,products);assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));
});
