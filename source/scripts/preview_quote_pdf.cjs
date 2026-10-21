/* Generate a review artifact with the same renderer that runs on the site. */
const fs=require('node:fs'),path=require('node:path');
const Q=require('../dist/assets/quote-document.js');
const {jsPDF}=require('../dist/assets/quote-pdf/jspdf-4.2.1.min.js');
const {autoTable}=require('../dist/assets/quote-pdf/autotable-5.0.9.min.js');
const sharp=require('sharp');
const root=path.resolve(__dirname,'..'),products=new Map(JSON.parse(fs.readFileSync(path.join(root,'data/quote-products.json'),'utf8')).map(p=>[p.code,p]));
async function main(){
  const fonts=Object.fromEntries([['regular','Regular'],['semibold','Semibold']].map(([k,v])=>[k,fs.readFileSync(path.join(root,'dist/assets/quote-pdf/Manrope-'+v+'.ttf')).toString('base64')]));
  const rows=['AS1101','AS5002','AS5206','AS5402'].map((code,i)=>({code,quantity:[6,2,4,1][i]}));
  const data=Q.snapshot(rows,products,{company:'Örnek müşteri / Yaşam alanı aydınlatması',city:'İstanbul',sector:'Salon / oturma odası',note:'3000 K sıcak beyaz ışık ve siyah gövde tercih edilmektedir. Montaj ölçüleri, ürün seçenekleri ve teslim süresi için bilgi rica ederiz.'},{now:'2026-10-21T10:00:00+03:00',id:'ORNEK01'});
  const images=new Map();
  for(const item of data.items){const {data:buffer,info}=await sharp(path.join(root,'dist',item.image)).resize(220,220,{fit:'inside'}).flatten({background:'#fff'}).jpeg({quality:85}).toBuffer({resolveWithObject:true});images.set(item.image,{data:new Uint8Array(buffer),width:info.width,height:info.height});}
  const resources={jsPDF,autoTable,fonts,logo:new Uint8Array(fs.readFileSync(path.join(root,'dist/assets/quote-pdf/logo.png'))),images};
  const destination=process.argv[2];fs.mkdirSync(path.dirname(destination),{recursive:true});
  const doc=Q.build(data,resources);fs.writeFileSync(destination,Buffer.from(doc.output('arraybuffer')));
  console.log('Sample PDF:',destination,'Pages:',doc.getNumberOfPages());
  if(process.argv[3]){const long=Q.snapshot([...products.keys()].slice(0,49).map((code,i)=>({code,quantity:i+1})).concat({code:'ÖZEL-ÜRÜN-'+('ABC'.repeat(23)),quantity:9999}),products,{company:'Uzun belge kontrolü - Şule Işık',city:'İstanbul',note:'Ölçüler, gövde rengi ve montaj seçenekleri teyit edilecektir. '.repeat(15)},{now:'2026-10-21T10:00:00+03:00',id:'KONTROL'});const full=Q.build(long,resources);fs.mkdirSync(path.dirname(process.argv[3]),{recursive:true});fs.writeFileSync(process.argv[3],Buffer.from(full.output('arraybuffer')));console.log('Long PDF pages:',full.getNumberOfPages());}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
