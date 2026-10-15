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
    document.querySelectorAll('[data-order-open]').forEach(button=>{button.hidden=false;button.setAttribute('aria-label',`Sipariş listesi (${count})`);button.querySelector('[data-order-count]').textContent=count;});
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
