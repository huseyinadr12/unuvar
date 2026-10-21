const test=require('node:test'),assert=require('node:assert/strict');
const Q=require('../dist/assets/quote-document.js');
const {jsPDF}=require('../dist/assets/quote-pdf/jspdf-4.2.1.min.js');
const {autoTable}=require('../dist/assets/quote-pdf/autotable-5.0.9.min.js');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const products=new Map([['AS5002',{name:'Artline sarkıt',power:112,page:51,measures:[['Çap (cm)','80']],web_image:'/assets/test.webp'}]]);
test('PDF snapshot preserves Turkish details and quantities without inventing prices',()=>{
  const rows=[{code:'AS5002',quantity:3},{code:'ÖZEL-ÜRÜN',quantity:2}],details={company:'Şule Işık',city:'İstanbul',sector:'Mutfak',note:'Gövde: siyah. 3000 K.'};
  const data=Q.snapshot(rows,products,details,{now:'2026-10-20T22:30:00Z',id:'abc123'});
  rows[0].quantity=50;details.company='Changed';
  assert.equal(data.total,5);assert.equal(data.items[0].quantity,3);assert.equal(data.details.company,'Şule Işık');
  assert.match(data.reference,/20261021/);assert.match(data.items[0].specs,/112 W.*Çap/);
  assert.match(data.items[1].warning,/teyidi/);assert.equal(data.items[1].page,null);assert.equal('price' in data.items[0],false);
});
test('PDF input rejects empty and invalid quantities',()=>{
  for(const rows of [[],[{code:'A',quantity:0}],[{code:'A',quantity:1.5}],Array.from({length:51},()=>({code:'A',quantity:1}))])assert.throws(()=>Q.snapshot(rows,products,{}));
});
test('50 lines and a long note create a readable multipage document',()=>{
  const fonts=Object.fromEntries([['regular','Regular'],['semibold','Semibold']].map(([k,label])=>[k,readFileSync(join(__dirname,'../dist/assets/quote-pdf/Manrope-'+label+'.ttf')).toString('base64')]));
  const data=Q.snapshot(Array.from({length:50},(_,i)=>({code:i===0?'AS5002':'ÖZEL-ÜRÜN-'+i,quantity:i+1})),products,{company:'Şule Işık / İstanbul',note:'Sıcak ışık, siyah gövde ve ölçü teyidi. '.repeat(20)},{id:'TEST01'});
  const doc=Q.build(data,{jsPDF,autoTable,fonts});
  assert.ok(doc.getNumberOfPages()>=5);assert.ok(doc.getNumberOfPages()<=12);
  const bytes=doc.output('arraybuffer');assert.ok(bytes.byteLength>5000);assert.ok(bytes.byteLength<500000);
});
