const {test}=require('node:test');
const assert=require('node:assert/strict');
const {destination,withRevision}=require('../dist/assets/navigation.js');
const current='https://example.test/unuvar/';
const click={button:0};
test('internal pages retain their query, hash and hosted base path',()=>{
  const target=destination({href:'/unuvar/b2c/?urun=AS1101#talep-listesi'},click,current);
  assert.equal(target.kind,'page');
  assert.equal(target.url.href,'https://example.test/unuvar/b2c/?urun=AS1101#talep-listesi');
});
test('downloads, assets, external destinations and non-HTTP links are never intercepted',()=>{
  for(const href of ['https://wa.me/905456105009','tel:+905456105009','mailto:test@example.test',
    '/unuvar/assets/catalog.pdf','/unuvar/assets/page.webp'])
    assert.equal(destination({href},click,current),null,href);
  assert.equal(destination({href:'/unuvar/',download:true},click,current),null);
  assert.equal(destination({href:'/unuvar/b2c/',target:'_blank'},click,current),null);
  assert.equal(destination({href:'/unuvar/urunler/',reader:true},click,current),null);
});
test('modifier clicks, middle clicks and actions handled by other components keep native behavior',()=>{
  for(const event of [{button:1},{button:0,ctrlKey:true},{button:0,metaKey:true},{button:0,shiftKey:true},
    {button:0,altKey:true},{button:0,defaultPrevented:true}])
    assert.equal(destination({href:'/unuvar/b2c/'},event,current),null);
});
test('same-page section links stay anchors and the current menu item stays on the page',()=>{
  assert.equal(destination({href:'#koleksiyonlar'},click,current).kind,'anchor');
  assert.equal(destination({href:current},click,current).kind,'same');
  assert.equal(destination({href:'/unuvar/?grup=dis'},click,current).kind,'page');
});
test('a publication revision replaces an old cache key without losing product filters or hashes',()=>{
  const original=new URL('https://example.test/unuvar/b2c/?urun=AS1101&sayfa=46&_v=old#talep-listesi');
  const result=withRevision(original,'new-release');
  assert.equal(result.href,'https://example.test/unuvar/b2c/?urun=AS1101&sayfa=46&_v=new-release#talep-listesi');
  assert.equal(original.searchParams.get('_v'),'old');
  assert.equal(withRevision(original,null).href,original.href);
});
test('cache versions never turn a same-document anchor or active menu into another page load',()=>{
  const here='https://example.test/unuvar/urunler/?_v=current';
  const anchor=destination({href:'/unuvar/urunler/#katalog-okuyucu'},click,here);
  assert.equal(anchor.kind,'anchor');
  assert.equal(anchor.url.href,here+'#katalog-okuyucu');
  assert.equal(destination({href:'/unuvar/urunler/?_v=old'},click,here).kind,'same');
  assert.equal(destination({href:'/unuvar/urunler/?grup=ic'},click,here).kind,'page');
});
