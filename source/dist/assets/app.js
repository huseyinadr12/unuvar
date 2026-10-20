(()=>{'use strict';
  const $=s=>document.querySelector(s);
  const menu=$('#mobile-nav'), trigger=$('.menu-trigger');
  function closeMenu(){if(!menu)return;menu.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-label','Menüyü aç');document.body.classList.remove('menu-open');}
  trigger?.addEventListener('click',()=>{const opening=menu.hidden;menu.hidden=!opening;trigger.setAttribute('aria-expanded',String(opening));trigger.setAttribute('aria-label',opening?'Menüyü kapat':'Menüyü aç');document.body.classList.toggle('menu-open',opening);});
  menu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && menu && !menu.hidden){closeMenu();trigger.focus();}});
  window.matchMedia('(min-width:901px)').addEventListener('change',event=>{if(event.matches)closeMenu();});
  let toastTimer;
  function notify(message){const toast=$('.toast');toast.textContent=message;toast.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),3500);}
  document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(button.dataset.copy);notify('Kopyalandı.');}catch{notify('Kopyalanamadı. Bilgiyi seçerek kopyalayabilirsiniz.');}}));
})();

/* Progressive motion: native links stay native; page transitions never delay clicks. */
(() => {
  'use strict';
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let observer;
  const revealAll = () => {
    observer?.disconnect();
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
  };
  if (!preference.matches && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -12px 0px' });
    document.querySelectorAll('.page-heading,.guide-toc,.section-head,.brand-card,.range-card,.space-card,.kelvin,.guide-link,.socket-card,.ip-card,.guide-split>*,.ask-copy,.ask-card,.faq-intro,.faq-list,.location-copy,.map-shell,.about-photo,.value-card,.channel-card,.destination-store,.conversation-intro,.conversation-form,.follow-inner').forEach(el => {
      if (el.getBoundingClientRect().top < innerHeight) return;
      // Cards in a row follow one another; standalone blocks start straight away.
      const index = [...el.parentElement.children].indexOf(el);
      el.style.setProperty('--reveal-delay', `${index % 4 * 90}ms`);
      el.classList.add('reveal');
      observer.observe(el);
    });
  }
  preference.addEventListener('change', event => { if (event.matches) revealAll(); });
  addEventListener('pageshow', event => { if (event.persisted) revealAll(); });
  addEventListener('beforeprint', revealAll);
  document.addEventListener('focusin', event => { event.target.closest('.reveal')?.classList.add('is-visible'); });
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.reading-progress');
  const topButton = document.querySelector('.back-to-top');
  let scheduled = false;
  function updateScroll() {
    scheduled = false;
    const distance = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.transform = `scaleX(${distance > 0 ? Math.min(1, Math.max(0, scrollY / distance)) : 0})`;
    header?.classList.toggle('is-scrolled', scrollY > 20);
    if (topButton) topButton.hidden = scrollY < 700;
  }
  addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(updateScroll); } }, { passive: true });
  addEventListener('resize', updateScroll, { passive: true });
  topButton?.addEventListener('click', () => {
    scrollTo({ top: 0, behavior: preference.matches ? 'instant' : 'smooth' });
    document.querySelector('.logo-link')?.focus({ preventScroll: true });
  });
  updateScroll();
})();

/* Prepare a local draft; the visitor sends it from WhatsApp. No storage or requests. */
(() => {
  'use strict';
  const composer = document.querySelector('[data-contact-composer]');
  if (!composer) return;
  const topic = document.querySelector('#contact-topic');
  const note = document.querySelector('#contact-note');
  const preview = document.querySelector('[data-contact-preview]');
  const link = document.querySelector('.composer-send');
  const topics = ['bir ürün hakkında bilgi almak', 'mağaza ziyareti hakkında görüşmek', 'bir soru sormak'];
  const update = () => {
    const extra = note.value.trim().slice(0, 700);
    const text = `Merhaba Ünüvar Aydınlatma, ${topics[topic.selectedIndex] || topics[0]} istiyorum.${extra ? '\n\n' + extra : ''}`;
    preview.textContent = text;
    link.href = 'https://wa.me/905456105009?text=' + encodeURIComponent(text);
  };
  topic.addEventListener('change', update);
  note.addEventListener('input', update);
  addEventListener('pageshow', update);
  update();
  composer.hidden = false;
})();

/* Shared order rules. Product names always come from the current catalog. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.UnuvarOrder=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const KEY='unuvar-order-v1',TTL=7*24*60*60*1000,MAX_ITEMS=20,MAX_QTY=9999;
  const clean=(value,max=120)=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max);
  function quantity(value){const n=Number(value);return String(value).trim()!==''&&Number.isSafeInteger(n)&&n>=1&&n<=MAX_QTY?n:null;}
  function catalog(records){
    const result=new Map();
    if(!Array.isArray(records))return result;
    records.forEach(p=>{if(!p||typeof p.id!=='string'||!/^[-a-zA-Z0-9_]{1,80}$/.test(p.id)||!clean(p.name)||result.has(p.id))return;
      result.set(p.id,{id:p.id,name:clean(p.name),brand:clean(p.brand,40),code:clean(p.code,40),unit:clean(p.unit||'adet',15)});});
    return result;
  }
  function items(rows,products){
    const result=new Map();
    if(!Array.isArray(rows))return [];
    rows.slice(0,200).forEach(row=>{if(!row||!products.has(row.id)||quantity(row.quantity)===null)return;
      if(!result.has(row.id)&&result.size>=MAX_ITEMS)return;
      result.set(row.id,Math.min(MAX_QTY,(result.get(row.id)||0)+quantity(row.quantity)));});
    return [...result].map(([id,quantity])=>({id,quantity}));
  }
  function restore(raw,products,now=Date.now()){
    try{const data=JSON.parse(raw);if(data?.version!==1||!Number.isFinite(data.updatedAt)||now-data.updatedAt>TTL||data.updatedAt>now+60000)return [];
      return items(data.items,products);}catch{return [];}
  }
  function save(rows,products,now=Date.now()){return JSON.stringify({version:1,updatedAt:now,items:items(rows,products)});}
  function add(rows,id,products){
    const next=items(rows,products),row=next.find(item=>item.id===id);
    if(!products.has(id))return {items:next,error:'Bu ürün katalogda bulunmuyor.'};
    if(row&&row.quantity>=MAX_QTY)return {items:next,error:'Bir kalemde en fazla 9999 adet seçebilirsiniz.'};
    if(!row&&next.length>=MAX_ITEMS)return {items:next,error:'Bir listede en fazla 20 farklı ürün olabilir.'};
    if(row)row.quantity++;else next.push({id,quantity:1});
    return {items:next,error:null};
  }
  function message(rows,products,note='',source=''){
    const selected=items(rows,products);if(!selected.length)return '';
    const lines=['Merhaba, aşağıdaki liste için sipariş talebi oluşturmak istiyorum:',''];
    selected.forEach((row,index)=>{const p=products.get(row.id);lines.push(`${index+1}. ${[p.brand,p.name].filter(Boolean).join(' ')}`);if(p.code)lines.push(`Kod: ${p.code}`);lines.push(`Miktar: ${row.quantity} ${p.unit}`,'');});
    const trimmed=String(note).trim().slice(0,500);if(trimmed)lines.push('Not: '+trimmed,'');
    lines.push('Fiyat, bulunabilirlik ve teslimat bilgilerini teyit eder misiniz?');
    if(source)lines.push('Katalog: '+source);
    return lines.join('\n');
  }
  function link(text,phone){if(!text||!/^\d{10,15}$/.test(phone))return null;const url=`https://wa.me/${phone}?text=${encodeURIComponent(text)}`;return url.length<=7500?url:null;}
  return {KEY,TTL,MAX_ITEMS,MAX_QTY,quantity,catalog,items,restore,save,add,message,link};
});

(()=>{
  'use strict';
  const core=window.UnuvarOrder,dialog=document.querySelector('#order-dialog');
  if(!core||!dialog)return;
  let products;
  try{products=core.catalog(JSON.parse(document.querySelector('#order-data').textContent));}catch{products=core.catalog([]);}
  const list=dialog.querySelector('[data-order-items]'),empty=dialog.querySelector('[data-order-empty]'),filled=dialog.querySelector('[data-order-filled]'),note=dialog.querySelector('#order-note'),preview=dialog.querySelector('#order-message'),send=dialog.querySelector('#order-send'),copy=dialog.querySelector('[data-order-copy]'),status=dialog.querySelector('[data-order-status]'),clear=dialog.querySelector('[data-order-clear]');
  let rows=[],opener=null;
  try{rows=core.restore(localStorage.getItem(core.KEY),products);}catch{}
  function announce(text){status.textContent=text;}
  function persist(){try{if(rows.length)localStorage.setItem(core.KEY,core.save(rows,products));else localStorage.removeItem(core.KEY);}catch{announce('Listeniz bu sekmede tutuluyor; tarayıcı kaydına izin verilmedi.');}}
  function updateMessage(){
    const text=core.message(rows,products,note.value,dialog.dataset.orderSource),url=core.link(text,dialog.dataset.phone);
    preview.value=text;copy.disabled=!text;
    dialog.querySelector('[data-order-long]').hidden=!text||!!url;
    if(url){send.href=url;send.removeAttribute('aria-disabled');}else{send.removeAttribute('href');send.setAttribute('aria-disabled','true');}
  }
  function render(){
    list.replaceChildren();rows=core.items(rows,products);
    const count=rows.reduce((sum,row)=>sum+row.quantity,0);
    document.querySelectorAll('[data-order-open]').forEach(button=>{button.hidden=!products.size;button.setAttribute('aria-label',`Sipariş listesi (${count})`);button.querySelector('[data-order-count]').textContent=count;});
    empty.hidden=rows.length>0;filled.hidden=!rows.length;clear.hidden=!rows.length;
    dialog.querySelector('[data-order-total]').textContent=`${rows.length} ürün kalemi`;
    rows.forEach(row=>{
      const product=products.get(row.id),node=document.querySelector('#order-row').content.firstElementChild.cloneNode(true),input=node.querySelector('input');
      node.dataset.orderId=row.id;node.querySelector('[data-item-name]').textContent=[product.brand,product.name].filter(Boolean).join(' ');
      node.querySelector('[data-item-code]').textContent=product.code?`Kod: ${product.code}`:product.unit;
      input.value=row.quantity;input.setAttribute('aria-label',product.name+' miktarı');
      node.querySelector('[data-order-remove]').setAttribute('aria-label',product.name+' listesinden çıkar');
      node.querySelector('[data-order-minus]').setAttribute('aria-label',product.name+' miktarını azalt');
      node.querySelector('[data-order-plus]').setAttribute('aria-label',product.name+' miktarını artır');
      node.querySelector('[data-order-minus]').disabled=row.quantity<=1;node.querySelector('[data-order-plus]').disabled=row.quantity>=core.MAX_QTY;
      list.append(node);
    });
    updateMessage();
  }
  function open(button){opener=button;render();announce('');if(!dialog.open){dialog.showModal();document.body.classList.add('order-open');}}
  document.querySelectorAll('[data-order-open]').forEach(button=>button.addEventListener('click',()=>open(button)));
  dialog.querySelector('[data-order-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{document.body.classList.remove('order-open');opener?.focus({preventScroll:true});});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-order-add]');if(!button)return;
    const result=core.add(rows,button.dataset.orderAdd,products);rows=result.items;persist();open(button);announce(result.error||'Ürün sipariş listenize eklendi.');
  });
  list.addEventListener('click',event=>{
    const button=event.target.closest('button'),node=button?.closest('[data-order-id]');if(!node)return;
    const row=rows.find(item=>item.id===node.dataset.orderId);if(!row)return;
    const index=rows.indexOf(row),kind=button.hasAttribute('data-order-remove')?'remove':button.hasAttribute('data-order-minus')?'minus':'plus';
    if(kind==='remove')rows.splice(index,1);else row.quantity=Math.max(1,Math.min(core.MAX_QTY,row.quantity+(kind==='minus'?-1:1)));
    persist();render();
    const next=list.children[Math.min(index,list.children.length-1)];
    (next?.querySelector(kind==='remove'?'input':`[data-order-${kind}]:not(:disabled)`)||next?.querySelector('input')||dialog.querySelector('[data-order-close]')).focus();
    announce(kind==='remove'?'Ürün listeden çıkarıldı.':'Miktar güncellendi.');
  });
  list.addEventListener('change',event=>{
    if(!event.target.matches('input'))return;
    const input=event.target,row=rows.find(item=>item.id===input.closest('[data-order-id]').dataset.orderId),value=core.quantity(input.value);
    if(value===null){input.setCustomValidity('1 ile 9999 arasında bir tam sayı girin.');input.reportValidity();input.value=row.quantity;input.setCustomValidity('');announce('Geçerli bir miktar girin; önceki miktar korundu.');return;}
    row.quantity=value;const id=row.id;persist();render();list.querySelector(`[data-order-id="${id}"] input`).focus();announce('Miktar güncellendi.');
  });
  clear.addEventListener('click',()=>{rows=[];note.value='';persist();render();announce('Sipariş listesi temizlendi.');dialog.querySelector('[data-order-close]').focus();});
  note.addEventListener('input',updateMessage);
  send.addEventListener('click',event=>{updateMessage();if(!send.hasAttribute('href'))event.preventDefault();});
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(preview.value);announce('Sipariş özeti kopyalandı.');}catch{preview.focus();preview.select();announce('Metni seçtik; kopyalayıp WhatsApp’a yapıştırabilirsiniz.');}});
  addEventListener('storage',event=>{if(event.key===core.KEY){rows=core.restore(event.newValue,products);render();announce('Sipariş listesi diğer sekmeyle güncellendi.');}});
  render();
})();

/* One preview at a time; native PDF and chapter links work without JavaScript. */
(() => {
  const reader = document.querySelector('[data-reader]');
  if (!reader) return;
  const select = reader.querySelector('#reader-page');
  const img = reader.querySelector('[data-reader-image]');
  const canvas = reader.querySelector('.reader-canvas');
  const prev = reader.querySelector('[data-reader-prev]');
  const next = reader.querySelector('[data-reader-next]');
  const status = reader.querySelector('[data-reader-status]');
  const error = reader.querySelector('[data-reader-error]');
  const large = reader.querySelector('[data-reader-large]');
  const pdf = reader.querySelector('[data-reader-pdf]');
  const pdfUrl = pdf.getAttribute('href').split('#')[0];
  const total = select.options.length;
  let current = 1;

  function showPage(value, updateHash = true) {
    const number = Number(value);
    if (!Number.isInteger(number) || number < 1 || number > total) return;
    current = number;
    const option = select.options[number - 1];
    const label = option.textContent.split(' · ').slice(1).join(' · ');
    select.value = String(number);
    prev.disabled = number === 1;
    next.disabled = number === total;
    error.hidden = true;
    img.hidden = false;
    const source = option.dataset.pageImage;
    if (img.getAttribute('src') !== source) {
      canvas.setAttribute('aria-busy', 'true');
      img.src = source;
    }
    img.alt = `Katalog sayfa ${number}: ${label}`;
    large.href = source;
    pdf.href = `${pdfUrl}#page=${number}`;
    status.textContent = `Sayfa ${number} / ${total} · ${label}`;
    if (updateHash) {
      try { history.replaceState(null, '', `#sayfa-${number}`); } catch (_) {}
    }
  }
  img.addEventListener('load', () => canvas.setAttribute('aria-busy', 'false'));
  img.addEventListener('error', () => {
    canvas.setAttribute('aria-busy', 'false');
    img.hidden = true;
    error.hidden = false;
  });
  prev.addEventListener('click', () => showPage(current - 1));
  next.addEventListener('click', () => showPage(current + 1));
  select.addEventListener('change', () => showPage(select.value));
  document.querySelectorAll('[data-reader-go]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      showPage(link.dataset.readerGo);
      reader.scrollIntoView({ block: 'start', behavior: 'auto' });
      select.focus({ preventScroll: true });
    });
  });
  function readHash() {
    const match = location.hash.match(/^#sayfa-(\d+)$/);
    if (!match || Number(match[1]) < 1 || Number(match[1]) > total) return;
    showPage(Number(match[1]), false);
    reader.scrollIntoView({ block: 'start', behavior: 'auto' });
  }
  reader.querySelector('[data-reader-controls]').hidden = false;
  readHash();
  window.addEventListener('hashchange', readHash);
})();
