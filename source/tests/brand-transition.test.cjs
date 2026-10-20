const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const navigation=readFileSync(join(__dirname,'../dist/assets/navigation.js'),'utf8');
const head=readFileSync(join(__dirname,'../dist/assets/navigation-head.js'),'utf8');

function setup({reduced=false,visible=true,arrival=false,headOnly=false,
  navigationType='navigate',referrer='',storageBlocked=false,marker,
  href='https://example.test/unuvar/',startTime=1000}={}){
  let now=startTime,id=0;
  const timers=new Map(),frames=[],stored=new Map(),visited=[];
  function target(extra={}){
    const handlers={};
    return Object.assign({dataset:{},hidden:false,
      addEventListener(type,fn){(handlers[type]??=[]).push(fn);},
      fire(type,event={}){for(const fn of handlers[type]||[])fn(event);}},extra);
  }
  const root=target();
  const brand=target(),skip=target(),media=target({matches:reduced}),win=target();
  const document=target({
    readyState:'complete',visibilityState:visible?'visible':'hidden',documentElement:root,referrer,
    querySelector:s=>s==='[data-brand-transition]'?brand:s==='[data-brand-skip]'?skip:null,
    getElementById:()=>null
  });
  const location={href,origin:new URL(href).origin,assign:url=>visited.push(url)};
  if(arrival||marker)stored.set('unuvar-navigation-arrival',JSON.stringify(marker||{url:href,time:now}));
  const storageAccess=fn=>{if(storageBlocked)throw new Error('Storage blocked');return fn();};
  const context={document,location,URL,matchMedia:()=>media,
    performance:{getEntriesByType:()=>[{type:navigationType}]},
    Date:{now:()=>now},
    sessionStorage:{
      getItem:k=>storageAccess(()=>stored.get(k)||null),
      setItem:(k,v)=>storageAccess(()=>stored.set(k,v)),
      removeItem:k=>storageAccess(()=>stored.delete(k))
    },
    setTimeout:(fn,delay)=>{timers.set(++id,{fn,at:now+delay});return id;},
    clearTimeout:key=>timers.delete(key),
    requestAnimationFrame:fn=>frames.push(fn),addEventListener:win.addEventListener
  };
  vm.runInNewContext(head,context);
  const firstPaint={...root.dataset};
  if(!headOnly)vm.runInNewContext(navigation,context);
  function paint(){while(frames.length)frames.splice(0).forEach(fn=>fn());}
  function tick(ms){
    const until=now+ms;
    while(true){
      const next=[...timers].filter(([,t])=>t.at<=until).sort((a,b)=>a[1].at-b[1].at)[0];
      if(!next)break;
      now=next[1].at;timers.delete(next[0]);next[1].fn();
    }
    now=until;
  }
  function click(href){
    let prevented=false;
    const anchor={href,target:'',hasAttribute:()=>false};
    document.fire('click',{button:0,target:{closest:()=>anchor},preventDefault(){prevented=true;}});
    return prevented;
  }
  return {root,brand,skip,media,document,win,visited,stored,paint,tick,click,firstPaint};
}

test('fresh opening starts with the fixture off, then reveals content and clears the overlay',()=>{
  const s=setup();assert.equal(s.brand.dataset.phase,'waiting');
  s.paint();assert.equal(s.brand.dataset.phase,'intro');assert.equal(s.brand.hidden,false);
  s.tick(1300);assert.equal(s.brand.dataset.phase,'out');assert.equal(s.root.dataset.navMotion,'enter');
  s.tick(400);assert.equal(s.brand.hidden,true);
  s.tick(950);assert.equal(s.root.dataset.navMotion,'idle');
});
test('opening waits for a background tab to become visible',()=>{
  const s=setup({visible:false});s.paint();s.tick(5000);
  assert.equal(s.brand.dataset.phase,'waiting');
  s.document.visibilityState='visible';s.document.fire('visibilitychange');s.paint();
  assert.equal(s.brand.dataset.phase,'intro');
});
test('internal navigation plays one moving logo; destination never shows a second brand scene',()=>{
  const s=setup();s.paint();s.tick(3000);
  const url='https://example.test/unuvar/b2c/?urun=AS1101#talep-listesi';
  assert.equal(s.click(url),true);assert.equal(s.brand.dataset.phase,'navigate');
  s.tick(1019);assert.deepEqual(s.visited,[]);
  s.tick(1);assert.deepEqual(s.visited,[url]);
  assert.equal(JSON.parse(s.stored.get('unuvar-navigation-arrival')).url,url);
  const marker=JSON.parse(s.stored.get('unuvar-navigation-arrival'));
  const arriving=setup({href:url,marker,startTime:marker.time});
  assert.equal(arriving.firstPaint.brandIntro,undefined);
  assert.equal(arriving.firstPaint.brandArrival,'1');
  assert.equal(arriving.brand.hidden,true);
  arriving.paint();assert.equal(arriving.root.dataset.navMotion,'enter');
  assert.equal(arriving.brand.dataset.phase,undefined);
  arriving.tick(3000);assert.equal(arriving.brand.hidden,true);
});
test('skip and keyboard access dismiss opening; skipping an exit follows its destination',()=>{
  const s=setup();s.paint();s.document.fire('keydown',{key:'Tab'});
  assert.equal(s.brand.hidden,true);s.tick(5000);assert.equal(s.root.dataset.navMotion,'idle');
  s.click('https://example.test/unuvar/urunler/');s.skip.fire('click');
  assert.equal(s.visited.length,1);s.tick(1020);assert.equal(s.visited.length,1);
});
test('reduced motion keeps navigation native and cancels an in-progress opening',()=>{
  const s=setup({reduced:true});s.paint();assert.equal(s.brand.hidden,true);
  assert.equal(s.click('https://example.test/unuvar/urunler/'),false);
  const active=setup();active.paint();active.media.matches=true;active.media.fire('change');
  active.tick(3000);assert.equal(active.brand.hidden,true);assert.equal(active.root.dataset.navMotion,'idle');
});
test('current menu item only reveals content and cancelled callbacks cannot revive the opening',()=>{
  const s=setup();s.paint();s.tick(3000);
  s.click('https://example.test/unuvar/');s.paint();assert.equal(s.brand.hidden,true);
  assert.equal(s.root.dataset.navMotion,'enter');assert.deepEqual(s.visited,[]);
  s.click('https://example.test/unuvar/');s.skip.fire('click');s.paint();
  assert.equal(s.brand.hidden,true);
});
test('rapid repeat clicks and repeated skip keys cannot restart the scene or navigate twice',()=>{
  const s=setup();s.paint();s.tick(3000);
  const url='https://example.test/unuvar/urunler/';
  s.click(url);s.tick(600);s.click(url);s.click('https://example.test/unuvar/iletisim/');
  s.tick(420);assert.deepEqual(s.visited,[url]);
  s.skip.fire('click');s.document.fire('keydown',{key:'Tab'});s.document.fire('keydown',{key:'Escape'});
  assert.deepEqual(s.visited,[url]);
});
test('storage-blocked internal arrivals skip the opening before first paint using their referrer',()=>{
  const s=setup({storageBlocked:true,referrer:'https://example.test/unuvar/urunler/'});
  assert.equal(s.firstPaint.brandIntro,undefined);
  s.paint();assert.equal(s.brand.hidden,true);
  s.click('https://example.test/unuvar/b2c/');s.tick(1020);
  assert.equal(s.visited.length,1);
});
test('a reload still opens with the fixture, even with an internal referrer and stale arrival',()=>{
  const s=setup({navigationType:'reload',arrival:true,referrer:'https://example.test/unuvar/urunler/'});
  assert.equal(s.firstPaint.brandIntro,'pending');
  s.paint();assert.equal(s.brand.dataset.phase,'intro');
});
test('expired and unrelated arrival markers cannot suppress a fresh external visit',()=>{
  for(const marker of [{url:'https://example.test/unuvar/',time:-10000},{url:'https://example.test/unuvar/b2c/',time:1000}]){
    const s=setup({marker,referrer:'https://search.example/'});
    assert.equal(s.firstPaint.brandIntro,'pending');assert.equal(s.stored.size,0);
    s.paint();assert.equal(s.brand.dataset.phase,'intro');
  }
});
test('history navigation and BFCache restoration never replay either brand scene',()=>{
  const s=setup({navigationType:'back_forward'});
  assert.equal(s.firstPaint.brandIntro,undefined);s.paint();assert.equal(s.brand.hidden,true);
  s.click('https://example.test/unuvar/b2c/');s.tick(400);
  s.win.fire('pagehide');s.win.fire('pageshow',{persisted:true});s.paint();s.tick(3000);
  assert.equal(s.brand.hidden,true);assert.deepEqual(s.visited,[]);
});
test('head bootstrap fails open even if the deferred navigation script never arrives',()=>{
  const s=setup({headOnly:true});assert.equal(s.root.dataset.brandIntro,'pending');
  s.tick(2600);assert.equal(s.root.dataset.brandIntro,undefined);
});
