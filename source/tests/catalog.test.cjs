const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const code=readFileSync(require('node:path').join(__dirname,'../dist/assets/catalog.js'),'utf8');

function setup({reduced=false,hash=''}={}){
  const pending=[],animations=[],links=[];
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
    document:{querySelector:s=>s==='[data-reader]'?reader:enquiry,querySelectorAll:()=>links},
    Image:class{decode(){return new Promise((resolve,reject)=>pending.push({source:this.src,resolve,reject}));}},
    URL,location,history:{replaceState:(_,__,h)=>location.hash=h},matchMedia:()=>media,window:new Element()
  };
  vm.runInNewContext(code,context);
  const flush=async()=>{await new Promise(resolve=>setImmediate(resolve));};
  const settle=async(index=0,fail=false)=>{pending[index][fail?'reject':'resolve']();await flush();};
  return {map,img,enquiry,location,pending,animations,media,settle,flush,next:()=>map['[data-reader-next]'].fire('click')};
}

test('old page stays visible until the incoming page decodes; links move together',async()=>{
  const s=setup();s.next();assert.equal(s.img.src,'page-1.webp');assert.equal(s.map['.reader-canvas'].attrs['aria-busy'],'true');
  await s.settle();assert.equal(s.img.src,'page-2.webp');assert.equal(s.location.hash,'#sayfa-2');
  assert.equal(s.map['[data-reader-pdf]'].href,'/catalog.pdf#page=2');assert.match(s.enquiry.href,/sayfa=2/);
  assert.equal(s.animations.length,1);assert.match(s.animations[0].frames[2].transform,/-96/);
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
