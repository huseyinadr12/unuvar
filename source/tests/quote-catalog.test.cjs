const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const data=name=>JSON.parse(fs.readFileSync(path.join(root,'data',name),'utf8'));
const products=data('quote-products.json'),catalog=data('catalog.json'),artline=data('editorial-products.json');
const C=require('../dist/assets/b2b-core.js');
test('quote catalog covers every section and every product page with unique selectable codes',()=>{
  assert.equal(new Set(products.map(p=>p.code)).size,products.length);
  assert.deepEqual([...new Set(products.map(p=>p.family))].sort(),catalog.sections.map(s=>s.id).sort());
  assert.deepEqual([...new Set(products.map(p=>p.page))].sort((a,b)=>a-b),
    Array.from({length:catalog.page_count-4},(_,i)=>i+4));
  for(const product of products) {
    assert.match(product.code,/^AS\d+\*?$/);
    const section=catalog.sections.find(s=>s.id===product.family);
    assert.ok(product.page>=section.start && product.page<=section.end);
    assert.ok(fs.existsSync(path.join(root,'dist',product.web_image)));
  }
});
test('existing Artline codes and bookmarked catalog pages stay consistent',()=>{
  const lookup=new Map(products.map(p=>[p.code,p]));
  for(const original of artline) {
    const expanded=lookup.get(original.code);
    assert.ok(expanded,original.code);assert.equal(expanded.page,original.page);
    assert.equal(expanded.power,String(original.power));
  }
});
test('products without a published wattage can be requested without inventing power',()=>{
  const product=products.find(p=>p.code==='AS8001');
  assert.equal(product.power,null);
  const message=C.message([{code:product.code,quantity:3}],new Map([[product.code,product]]),{},'https://example.test/unuvar/urunler/');
  assert.match(message,/AS8001 — 3 adet/);assert.doesNotMatch(message,/null W|undefined W|0 W/);
});
