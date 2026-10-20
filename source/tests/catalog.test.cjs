const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const code=readFileSync(require('node:path').join(__dirname,'../dist/assets/catalog.js'),'utf8');

function setup({reduced=false,hash='',saveData=false,effectiveType='4g'}={}){
  const pending=[],animations=[],links=[],idle=[];
  class Element{
    constructor(){this.events={};this.attrs={};this.hidden=true;this.style={};this.children=[];this.classList={add(){},remove(){}};}
    addEventListener(type,fn){this.events[type]=fn;}
    setAttribute(k,v){this.attrs[k]=v;}
    getAttribute(k){return this.attrs[k];}
    removeAttribute(k){delete this.attrs[k];}
    append(el){this.children.push(el);}
    remove(){this.removed=true;}
    scrollIntoView(){}
    focus(){}
    cloneNode(){return new Element();}
    animate(frames,opts){
      const a={frames,opts,finished:new Promise(resolve=>{this.finish=resolve;}),cancel(){this.cancelled=true;}};
      animations.push(a);return a;
    }
    fire(type,event={}){this.events[type]?.(event);}
  }
  const map=Object.fromEntries(['#reader-page','[data-reader-image]','.reader-canvas','[data-reader-prev]','[data-reader-next]','[data-reader-status]','[data-reader-error]','[data-reader-large]','[data-reader-pdf]','[data-reader-controls]'].map(k=>[k,new Element()]));
  const img=map['[data-reader-image]'];Object.assign(img,{src:'page-1.webp',complete:true,naturalWidth:1684});
  map['#reader-page'].options=Array.from({length:4},(_,i)=>({dataset:{pageImage:`page-${i+1}.webp`},textContent:`${i+1} · Title ${i+1}`}));
  map['[data-reader-pdf]'].attrs.href='/catalog.pdf#page=1';
  const enquiry=new Element();enquiry.href='https://example.com/b2c/?sayfa=1#hizli-giris';
  const reader=new Element();reader.querySelector=s=>map[s];
  const location={hash};
  const media=new Element();media.matches=reduced;
  const context={
    document:{querySelector:s=>s==='[data-reader]'?reader:enquiry,querySelectorAll:()=>links,createElement:()=>new Element()},
    Image:class{decode(){return new Promise((resolve,reject)=>pending.push({source:this.src,resolve,reject}));}},
    URL,location,history:{replaceState:(_,__,h)=>location.hash=h},matchMedia:()=>media,
    window:Object.assign(new Element(),{navigator:{connection:{saveData,effectiveType}},requestIdleCallback:fn=>idle.push(fn)})
  };
  vm.runInNewContext(code,context);
  const flush=async()=>{await new Promise(resolve=>setImmediate(resolve));};
  const settle=async(index=0,fail=false)=>{pending[index][fail?'reject':'resolve']();await flush();};
  return {map,img,enquiry,location,pending,animations,media,settle,flush,
    warm:()=>{const tasks=idle.splice(0);tasks.forEach(fn=>fn());},
    next:()=>map['[data-reader-next]'].fire('click')};
}

test('old page stays visible until the incoming page decodes; links move together',async()=>{
  const s=setup();s.next();assert.equal(s.img.src,'page-1.webp');assert.equal(s.map['.reader-canvas'].attrs['aria-busy'],'true');
  await s.settle();assert.equal(s.img.src,'page-2.webp');assert.equal(s.location.hash,'#sayfa-2');
  assert.equal(s.map['[data-reader-pdf]'].href,'/catalog.pdf#page=2');assert.match(s.enquiry.href,/sayfa=2/);
  assert.equal(s.animations.length,1);
  const sheet=s.map['.reader-canvas'].children[0];
  assert.equal(sheet.attrs['aria-hidden'],'true');assert.equal(sheet.children[0].alt,'');
});
test('rapid navigation ignores a late older response',async()=>{
  const s=setup();s.next();s.next();await s.settle(1);await s.settle(0);
  assert.equal(s.img.src,'page-3.webp');assert.equal(s.map['#reader-page'].value,'3');
});
test('failed page load retains current image, links and selection, and permits retry',async()=>{
  const s=setup();s.next();await s.settle(0,true);assert.equal(s.img.src,'page-1.webp');
  assert.equal(s.map['#reader-page'].value,'1');assert.equal(s.map['[data-reader-error]'].hidden,false);
  s.next();await s.settle(1);assert.equal(s.img.src,'page-2.webp');assert.equal(s.map['[data-reader-error]'].hidden,true);
});
test('stale failure cannot replace a successful newer state',async()=>{
  const s=setup();s.next();s.next();await s.settle(1);await s.settle(0,true);
  assert.equal(s.img.src,'page-3.webp');assert.equal(s.map['[data-reader-error]'].hidden,true);
});
test('reduced motion still navigates without a turning sheet',async()=>{
  const s=setup({reduced:true});s.next();await s.settle();assert.equal(s.img.src,'page-2.webp');assert.equal(s.animations.length,0);
});
test('a reverse turn cancels the old sheet and uses the opposite page edge',async()=>{
  const s=setup();s.next();await s.settle();
  const forward=s.map['.reader-canvas'].children[0];
  assert.equal(forward.style.transformOrigin,'left center');
  s.map['[data-reader-prev]'].fire('click');
  assert.equal(s.animations[0].cancelled,true);assert.equal(forward.removed,true);
  await s.settle(1);
  const reverse=s.map['.reader-canvas'].children[1];
  assert.equal(reverse.style.transformOrigin,'right center');assert.equal(s.img.src,'page-1.webp');
});
test('enabling reduced motion during a turn removes the animation and keeps the selected page',async()=>{
  const s=setup();s.next();await s.settle();s.media.matches=true;s.media.fire('change');
  assert.equal(s.animations[0].cancelled,true);assert.equal(s.map['.reader-canvas'].children[0].removed,true);
  assert.equal(s.img.src,'page-2.webp');assert.equal(s.map['#reader-page'].value,'2');
});
test('deep link loads the intended page without an introductory flip',async()=>{
  const s=setup({hash:'#sayfa-4'});await s.settle();assert.equal(s.img.src,'page-4.webp');
  assert.equal(s.map['[data-reader-next]'].disabled,true);assert.equal(s.animations.length,0);
});
test('arrow keys and horizontal swipes navigate; vertical swipes do not',async()=>{
  const s=setup();const canvas=s.map['.reader-canvas'];let prevented=false;
  canvas.fire('keydown',{key:'ArrowRight',preventDefault(){prevented=true;}});await s.settle();
  assert.equal(prevented,true);assert.equal(s.img.src,'page-2.webp');
  canvas.fire('touchstart',{touches:[{clientX:200,clientY:30}]});canvas.fire('touchend',{changedTouches:[{clientX:190,clientY:200}]});
  assert.equal(s.pending.length,1);
  canvas.fire('touchstart',{touches:[{clientX:200,clientY:30}]});canvas.fire('touchend',{changedTouches:[{clientX:90,clientY:40}]});await s.settle(1);
  assert.equal(s.img.src,'page-3.webp');
});

test('only the neighbouring page is warmed; a click reuses its in-flight download',async()=>{
  const s=setup();assert.equal(s.pending.length,0);
  s.next();await s.settle();s.warm();
  assert.deepEqual(s.pending.map(p=>p.source),['page-2.webp','page-3.webp']);
  s.next();assert.equal(s.pending.length,2);
  await s.settle(1);assert.equal(s.img.src,'page-3.webp');
});
test('a failed background preview is retried on demand without showing an error',async()=>{
  const s=setup();s.next();await s.settle();s.warm();await s.settle(1,true);
  assert.equal(s.map['[data-reader-error]'].hidden,true);
  s.next();assert.equal(s.pending.length,3);await s.settle(2);
  assert.equal(s.img.src,'page-3.webp');
});
test('data saving and slow connections do not prefetch but still navigate',async()=>{
  for(const options of [{saveData:true},{effectiveType:'2g'},{effectiveType:'slow-2g'}]){
    const s=setup(options);s.next();await s.settle();s.warm();
    assert.equal(s.pending.length,1);s.next();await s.settle(1);
    assert.equal(s.img.src,'page-3.webp');
  }
});
test('deep linking never warms unrelated first pages or the full PDF',async()=>{
  const s=setup({hash:'#sayfa-3'});await s.settle();s.warm();
  assert.deepEqual(s.pending.map(p=>p.source),['page-3.webp','page-4.webp']);
});
