(() => {
  'use strict';
  const root=document.querySelector('[data-b2b-root]');if(!root)return;
  const C=window.UnuvarB2B,records=JSON.parse(document.getElementById('b2b-records').textContent),products=new Map(records.map(p=>[p.code,p]));
  const $=s=>root.querySelector(s),form=$('[data-b2b-request]'),fields=form.elements,status=$('[data-b2b-status]'),list=$('[data-b2b-lines]');
  let rows=[],undo=null,storage=true;
  try{rows=C.restore(localStorage.getItem(C.KEY));}catch{storage=false;}
  const say=t=>{status.textContent=t;};
  const source=new URL('../urunler/',location.href).href;
  const details=()=>Object.fromEntries(['company','city','sector','note'].map(k=>[k,fields[k].value]));
  const text=()=>C.message(rows,products,details(),source);
  const link=()=> 'https://wa.me/905456105009?text='+encodeURIComponent(text());
  const validQuantities=()=>[...list.querySelectorAll('input')].every(input=>C.qty(input.value)!==null);
  const make=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=value;return n;};
  function persist(){try{localStorage.setItem(C.KEY,C.save(rows));}catch{storage=false;}}
  function preview(){
    $('[data-b2b-preview]').value=text();
    const long=link().length>7500;$('[data-b2b-long]').hidden=!long;
    $('[data-b2b-send]').disabled=!rows.length||long||!validQuantities();
    ['copy','csv','print'].forEach(k=>$('[data-b2b-'+k+']').disabled=!rows.length||!validQuantities());
  }
  function render(){
    list.replaceChildren();
    rows.forEach(r=>{
      const p=products.get(r.code),li=make('li','b2b-line'),top=make('div','b2b-line-top'),name=make('div');
      name.append(make('b','',r.code),make('small','',p?p.name+' · '+p.power+' W':'Kod teyidi gerekli'));
      if(p){const a=make('a','','Katalog s.'+p.page);a.href=source+'#sayfa-'+p.page;name.append(a);}
      const remove=make('button','','Çıkar');remove.type='button';remove.setAttribute('aria-label',r.code+' ürününü çıkar');
      remove.addEventListener('click',()=>{undo=rows.map(x=>({...x}));rows=rows.filter(x=>x.code!==r.code);persist();render();say(r.code+' listeden çıkarıldı. Geri alabilirsiniz.');});top.append(name,remove);
      const label=make('label','b2b-quantity','Adet'),input=make('input');input.type='number';input.min='1';input.max='9999';input.step='1';input.inputMode='numeric';input.value=r.quantity;input.setAttribute('aria-label',r.code+' adet');
      input.addEventListener('input',()=>{const n=C.qty(input.value);if(n===null){say('Adet 1–9999 arasında tam sayı olmalıdır.');['send','copy','csv','print'].forEach(k=>$('[data-b2b-'+k+']').disabled=true);return;}const row=rows.find(x=>x.code===r.code);row.quantity=n;persist();$('[data-b2b-total]').textContent=`${rows.length} kalem · ${rows.reduce((n,r)=>n+r.quantity,0)} adet`;root.querySelectorAll('[data-b2b-add]').forEach(b=>{if(b.dataset.b2bAdd===r.code)b.textContent='Listede '+n+' · +1 ekle';});['copy','csv','print'].forEach(k=>$('[data-b2b-'+k+']').disabled=false);preview();});
      input.addEventListener('change',()=>{const n=C.qty(input.value);if(n===null){input.value=r.quantity;say('Adet 1–9999 arasında tam sayı olmalıdır.');return;}r.quantity=n;persist();render();});
      label.append(input);li.append(top,label);list.append(li);
    });
    root.querySelectorAll('[data-b2b-badge]').forEach(n=>n.textContent=rows.length);
    $('[data-b2b-total]').textContent=rows.length?`${rows.length} kalem · ${rows.reduce((n,r)=>n+r.quantity,0)} adet`:'Henüz ürün eklenmedi.';
    $('[data-b2b-empty]').hidden=!!rows.length;
    ['clear','copy','csv','print'].forEach(k=>$('[data-b2b-'+k+']').disabled=!rows.length);
    $('[data-b2b-undo]').hidden=!undo;
    root.querySelectorAll('[data-b2b-add]').forEach(b=>{const r=rows.find(r=>r.code===b.dataset.b2bAdd);b.textContent=r?'Listede '+r.quantity+' · +1 ekle':'Listeye ekle +';});
    preview();
  }
  function add(items){const next=C.merge(rows,items);if(next.error){say(next.error);return false;}undo=rows.map(r=>({...r}));rows=next.items;persist();render();say('Liste güncellendi.'+(!storage?' Tarayıcı kaydı kapalı; sayfadan ayrılmadan özeti indirin.':''));return true;}
  root.querySelectorAll('[data-b2b-add]').forEach(b=>b.addEventListener('click',()=>add([{code:b.dataset.b2bAdd,quantity:1}])));
  $('[data-b2b-bulk]').addEventListener('submit',e=>{e.preventDefault();const input=document.getElementById('bulk-lines'),parsed=C.parse(input.value);if(parsed.error){say(parsed.error);status.scrollIntoView({block:'center'});return;}if(add(parsed.items))input.value='';});
  $('[data-b2b-clear]').addEventListener('click',()=>{undo=rows.map(r=>({...r}));rows=[];persist();render();say('Liste temizlendi. Geri alabilirsiniz.');});
  $('[data-b2b-undo]').addEventListener('click',()=>{if(!undo)return;rows=undo;undo=null;persist();render();say('Son liste işlemi geri alındı.');});
  const norm=s=>s.toLocaleLowerCase('tr-TR').replace(/ı/g,'i').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  let visibleLimit=12;
  function filter(){const term=norm($('[data-b2b-search]').value.trim()),family=$('[data-b2b-family]').value;let n=0;root.querySelectorAll('[data-b2b-card]').forEach(c=>{const matches=(!family||c.dataset.family===family)&&norm(c.dataset.search).includes(term);if(matches)n++;c.hidden=!matches||n>visibleLimit;});$('[data-b2b-count]').textContent=Math.min(n,visibleLimit)+' / '+n+' ürün';$('[data-b2b-empty-search]').hidden=n!==0;$('[data-b2b-more]').hidden=n<=visibleLimit;}
  const resetFilter=()=>{visibleLimit=12;filter();};
  $('[data-b2b-search]').addEventListener('input',resetFilter);$('[data-b2b-family]').addEventListener('change',resetFilter);
  $('[data-b2b-more]').addEventListener('click',()=>{visibleLimit+=12;filter();});
  form.addEventListener('input',preview);form.addEventListener('change',preview);
  form.addEventListener('submit',e=>{e.preventDefault();if(rows.length&&validQuantities()&&form.reportValidity()&&link().length<=7500)window.open(link(),'_blank','noopener,noreferrer');});
  $('[data-b2b-copy]').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(text());say('Talep özeti kopyalandı.');}catch{const area=$('[data-b2b-preview]');area.closest('details').open=true;area.focus();area.select();say('Otomatik kopyalama kullanılamadı. Seçili metni kopyalayabilirsiniz.');}});
  $('[data-b2b-csv]').addEventListener('click',()=>{const blob=new Blob([C.csv(rows,products)],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=make('a');a.href=url;a.download='unuvar-teklif-listesi.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  $('[data-b2b-print]').addEventListener('click',()=>{document.getElementById('b2b-print-copy').textContent=text();window.print();});
  const incoming=C.code(new URLSearchParams(location.search).get('urun')||'');
  if(incoming&&products.has(incoming)&&!rows.some(r=>r.code===incoming))add([{code:incoming,quantity:1}]);else render();
  const printable=make('pre','b2b-print');printable.id='b2b-print-copy';root.append(printable);
  filter();
})();
