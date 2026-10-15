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
