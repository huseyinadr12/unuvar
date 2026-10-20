const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const navigation=readFileSync(join(__dirname,'../dist/assets/navigation.js'),'utf8');
const head=readFileSync(join(__dirname,'../dist/assets/navigation-head.js'),'utf8');

function setup({reduced=false,visible=true,arrival=false,headOnly=false}={}){
  let now=1000,id=0;
  const timers=new Map(),frames=[],stored=new Map(),visited=[];
  function target(extra={}){
    const handlers={};
    return Object.assign({dataset:{},hidden:false,
      addEventListener(type,fn){(handlers[type]??=[]).push(fn);},
      fire(type,event={}){for(const fn of handlers[type]||[])fn(event);}},extra);
  }
  const root=target({dataset:{brandIntro:'pending',...(arrival?{brandArrival:'1'}:{})}});
  const brand=target(),skip=target(),media=target({matches:reduced}),win=target();
  const document=target({
    readyState:'complete',visibilityState:visible?'visible':'hidden',documentElement:root,
    querySelector:s=>s==='[data-brand-transition]'?brand:s==='[data-brand-skip]'?skip:null,
    getElementById:()=>null
  });
  const location={href:'https://example.test/unuvar/',assign:url=>visited.push(url)};
  const context={document,location,URL,matchMedia:()=>media,
    Date:{now:()=>now},
    sessionStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)},
    setTimeout:(fn,delay)=>{timers.set(++id,{fn,at:now+delay});return id;},
    clearTimeout:key=>timers.delete(key),
    requestAnimationFrame:fn=>frames.push(fn),addEventListener:win.addEventListener
  };
  vm.runInNewContext(headOnly?head:navigation,context);
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
  return {root,brand,skip,media,document,win,visited,stored,paint,tick,click};
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
test('internal navigation lights the brand, retains the exact URL and stores a short arrival',()=>{
  const s=setup();s.paint();s.tick(3000);
  const url='https://example.test/unuvar/b2c/?urun=AS1101#talep-listesi';
  assert.equal(s.click(url),true);assert.equal(s.brand.dataset.phase,'leave');
  s.tick(619);assert.deepEqual(s.visited,[]);
  s.tick(1);assert.deepEqual(s.visited,[url]);
  assert.equal(JSON.parse(s.stored.get('unuvar-navigation-arrival')).url,url);
  const arriving=setup({arrival:true});arriving.paint();
  assert.equal(arriving.brand.dataset.phase,'arrive');
  arriving.tick(400);assert.equal(arriving.brand.hidden,true);
});
test('skip and keyboard access dismiss opening; skipping an exit follows its destination',()=>{
  const s=setup();s.paint();s.document.fire('keydown',{key:'Tab'});
  assert.equal(s.brand.hidden,true);s.tick(5000);assert.equal(s.root.dataset.navMotion,'idle');
  s.click('https://example.test/unuvar/urunler/');s.skip.fire('click');
  assert.equal(s.visited.length,1);s.tick(620);assert.equal(s.visited.length,1);
});
test('reduced motion keeps navigation native and cancels an in-progress opening',()=>{
  const s=setup({reduced:true});s.paint();assert.equal(s.brand.hidden,true);
  assert.equal(s.click('https://example.test/unuvar/urunler/'),false);
  const active=setup();active.paint();active.media.matches=true;active.media.fire('change');
  active.tick(3000);assert.equal(active.brand.hidden,true);assert.equal(active.root.dataset.navMotion,'idle');
});
test('current menu item replays the opening, while cancelled frame callbacks cannot revive it',()=>{
  const s=setup();s.paint();s.tick(3000);
  s.click('https://example.test/unuvar/');s.paint();assert.equal(s.brand.dataset.phase,'intro');
  s.click('https://example.test/unuvar/');s.skip.fire('click');s.paint();
  assert.equal(s.brand.hidden,true);
});
test('head bootstrap fails open even if the deferred navigation script never arrives',()=>{
  const s=setup({headOnly:true});assert.equal(s.root.dataset.brandIntro,'pending');
  s.tick(2600);assert.equal(s.root.dataset.brandIntro,undefined);
});
