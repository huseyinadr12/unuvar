(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.UnuvarB2B=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const KEY='unuvar-b2b-v1',TTL=7*86400000,MAX=50;
  const clean=(v,n=80)=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,n);
  const code=v=>clean(v).toLocaleUpperCase('tr-TR');
  const qty=v=>String(v).trim()!==''&&Number.isSafeInteger(Number(v))&&Number(v)>=1&&Number(v)<=9999?Number(v):null;
  function normalize(rows){
    const map=new Map();
    if(!Array.isArray(rows))return [];
    rows.slice(0,200).forEach(r=>{if(!r||!code(r.code)||qty(r.quantity)===null)return;const key=code(r.code);if(!map.has(key)&&map.size>=MAX)return;map.set(key,Math.min(9999,(map.get(key)||0)+qty(r.quantity)));});
    return [...map].map(([code,quantity])=>({code,quantity}));
  }
  function merge(rows,incoming){
    const map=new Map(normalize(rows).map(r=>[r.code,r.quantity]));
    for(const r of incoming){const key=code(r.code),n=qty(r.quantity);if(!key||n===null)return {error:'Ürün kodu ve 1–9999 arasında tam sayı adet girin.'};if(!map.has(key)&&map.size>=MAX)return {error:'Bir listede en fazla 50 farklı kalem olabilir.'};if((map.get(key)||0)+n>9999)return {error:key+' için toplam adet 9999 sınırını aşıyor.'};map.set(key,(map.get(key)||0)+n);}
    return {items:[...map].map(([code,quantity])=>({code,quantity}))};
  }
  function parse(value){
    const lines=String(value).split(/\r?\n/),items=[];
    for(let i=0;i<lines.length;i++){if(!lines[i].trim())continue;const parts=lines[i].trim().split(/[;,\t]/);if(parts.length!==2||!parts[0].trim()||parts[0].trim().length>80||qty(parts[1])===null)return {error:`${i+1}. satır: “ürün kodu; adet” biçimini ve 1–9999 arası tam sayıyı kullanın.`};items.push({code:code(parts[0]),quantity:qty(parts[1])});}
    return items.length?{items}:{error:'En az bir ürün kodu ve adet yazın.'};
  }
  function restore(raw,now=Date.now()){try{const d=JSON.parse(raw);return d.version===1&&Number.isFinite(d.saved)&&now-d.saved<=TTL&&d.saved<=now+60000?normalize(d.items):[];}catch{return [];}}
  function save(items,now=Date.now()){return JSON.stringify({version:1,saved:now,items:normalize(items)});}
  function message(items,products,details,source){
    if(!items.length)return '';
    const out=['ÜNÜVAR AYDINLATMA — TEKLİF TALEBİ',''];
    for(const [key,label] of [['company','Ad / liste'],['city','Şehir'],['sector','Kullanım alanı']]){if(clean(details[key],120))out.push(label+': '+clean(details[key],120));}
    out.push('');
    items.forEach((r,i)=>{const p=products.get(r.code);out.push(`${i+1}. ${r.code} — ${r.quantity} adet${p?' · '+p.name+(p.power?' · '+p.power+' W':'')+' · Katalog s.'+p.page:' · Kod teyidi gerekli'}`);if(r.code.includes('*'))out.push('   Kaynak katalogda kod tekrarı var; ürün teyidi gerekli.');});
    if(clean(details.note,700))out.push('','Not: '+clean(details.note,700));
    out.push('','Güncel fiyat, stok, ürün seçenekleri ve teslim koşullarını paylaşır mısınız?','Bu liste teklif talebidir; kesinleşmiş sipariş değildir.',source);
    return out.join('\n');
  }
  const csvCell=v=>'"'+(/^[=+\-@\t\r]/.test(String(v))?"'":"")+String(v).replace(/"/g,'""')+'"';
  function csv(items,products){return '\uFEFF'+[['Ürün kodu','Ürün','Adet','Güç (W)','Katalog sayfası','Not'],...items.map(r=>{const p=products.get(r.code);return [r.code,p?.name||'',r.quantity,p?.power||'',p?.page||'',!p||r.code.includes('*')?'Kod teyidi gerekli':''];})].map(r=>r.map(csvCell).join(';')).join('\r\n');}
  return {KEY,TTL,MAX,clean,code,qty,normalize,merge,parse,restore,save,message,csv};
});
