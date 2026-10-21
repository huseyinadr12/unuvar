const $=s=>document.querySelector(s),node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const money=v=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(v/100),key='unuvar-shop-cart-v1';
let products=[],cart=[],pending,submitting=false;
try{const saved=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(saved))cart=saved.filter(r=>r&&typeof r.code==='string'&&Number.isInteger(r.quantity)&&r.quantity>0&&r.quantity<=9999).slice(0,50);}catch{}
const save=()=>{try{localStorage.setItem(key,JSON.stringify(cart));}catch{}};
function render(){const search=$('#search').value.toLocaleLowerCase('tr-TR'),shown=products.filter(p=>(p.code+' '+p.name).toLocaleLowerCase('tr-TR').includes(search));$('#count').textContent=shown.length+' ürün';$('#products').replaceChildren();if(!shown.length){$('#products').append(node('div',products.length?'Aramanıza uygun ürün bulunamadı.':'Mağaza koleksiyonu hazırlanıyor. Ürünlerimizi dijital katalogdan inceleyebilirsiniz.','empty'));return;}for(const p of shown){const card=node('article',undefined,'shop-card'),image=node('img');image.src=p.web_image;image.alt=p.name;image.loading='lazy';const content=node('div',undefined,'shop-card-content'),button=node('button',p.stock?'Sepete ekle +':'Stokta yok','secondary');button.disabled=!p.stock;button.addEventListener('click',()=>add(p));content.append(node('small',p.group),node('h2',p.name),node('p',p.code+(p.power?' / '+p.power+' W':''),'muted'),node('b',money(p.priceCents),'price'),button);card.append(image,content);$('#products').append(card);}}
function add(p){const row=cart.find(r=>r.code===p.code);if(row){if(row.quantity>=Math.min(9999,p.stock)){ $('#store-status').textContent='Stok adedinden fazla ekleyemezsiniz.';return;}row.quantity++;}else{if(cart.length>=50)return;cart.push({code:p.code,quantity:1});}save();$('#cart-status').textContent='';renderCart();$('#store-status').textContent=p.code+' sepete eklendi.';}
function updateCartSummary(){
  let total=0,valid=cart.length>0;
  for(const row of cart){const product=products.find(p=>p.code===row.code);if(!product||row.quantity>product.stock)valid=false;else total+=product.priceCents*row.quantity;}
  const fields=[...document.querySelectorAll('#cart-items input')];
  valid=valid&&fields.every(field=>field.validity.valid);
  $('#cart-total').textContent=valid||!cart.length?money(total):'Adetleri kontrol edin';
  $('#open-cart').textContent='Sepetim ('+cart.reduce((n,row)=>n+row.quantity,0)+')';
  $('#send-request').disabled=!valid||submitting;
  return valid;
}
function renderCart(){
  const list=$('#cart-items');list.replaceChildren();
  for(const row of cart){
    const product=products.find(p=>p.code===row.code),line=node('div',undefined,'cart-line'),info=node('div'),quantity=node('input'),remove=node('button','Çıkar','text-button');
    info.append(node('b',product?.name||row.code),node('p',row.code+(product?' / '+money(product.priceCents):' / Ürün artık yayında değil'),'muted'));
    quantity.type='number';quantity.required=true;quantity.min='1';quantity.step='1';quantity.max=product?Math.min(product.stock,9999):0;quantity.value=row.quantity;quantity.setAttribute('aria-label',row.code+' adet');
    const changeQuantity=()=>{
      if(quantity.validity.valid){row.quantity=Number(quantity.value);save();$('#cart-status').textContent='';}
      else $('#cart-status').textContent='Adet ve stok bilgisini kontrol edin.';
      updateCartSummary();
    };
    quantity.addEventListener('input',changeQuantity);quantity.addEventListener('change',changeQuantity);
    remove.type='button';remove.setAttribute('aria-label',row.code+' çıkar');remove.addEventListener('click',()=>{cart=cart.filter(x=>x.code!==row.code);save();$('#cart-status').textContent='';renderCart();});
    line.append(info,quantity,remove);list.append(line);
  }
  if(!cart.length)list.append(node('div','Sepetiniz henüz boş.','empty'));
  updateCartSummary();
}
$('#open-cart').addEventListener('click',()=>{renderCart();$('#cart-dialog').showModal();});$('#close-cart').addEventListener('click',()=>$('#cart-dialog').close());$('#search').addEventListener('input',render);
$('#request-form').addEventListener('submit',async event=>{event.preventDefault();if(submitting||!updateCartSummary())return;const f=event.currentTarget,items=cart.map(r=>({...r,version:products.find(p=>p.code===r.code)?.version})),customer=Object.fromEntries(['name','phone','email','city','note'].map(k=>[k,f.elements[k].value])),body=JSON.stringify({items,customer});if(!pending||pending.body!==body)pending={body,key:crypto.randomUUID()};submitting=true;renderCart();$('#cart-status').textContent='Talebiniz kaydediliyor…';try{const response=await fetch('/api/order-requests',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':pending.key},body:pending.body}),result=await response.json();if(!response.ok)throw new Error(result.error);cart=[];save();pending=null;f.reset();$('#cart-status').textContent='Talebiniz alındı. Kayıt: '+result.id+'. Ödeme alınmadı; mağazamız sizinle iletişime geçecektir.';}catch(error){$('#cart-status').textContent=error.message||'Talep gönderilemedi. Yeniden deneyin.';}finally{submitting=false;renderCart();}});
try{const response=await fetch('/api/store');if(!response.ok)throw new Error();products=(await response.json()).products;render();renderCart();}catch{$('#store-status').textContent='Mağaza bilgileri yüklenemedi. Daha sonra yeniden deneyin.';}
