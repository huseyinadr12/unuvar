/* Shared PDF renderer: receives a frozen request and never submits customer data. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.UnuvarQuoteDocument=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const ink=[30,38,38], muted=[100,109,106], gold=[241,204,64], pale=[247,247,241];
  const clean=(v,max=700)=>String(v??'').normalize('NFC').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max);
  function snapshot(rows,products,details,{now=new Date(),id=''}={}){
    if(!Array.isArray(rows)||!rows.length||rows.length>50)throw new Error('Listeye 1-50 ürün ekleyin.');
    const items=rows.map(row=>{
      const quantity=Number(row.quantity),code=clean(row.code,80),p=products.get(code);
      if(!code||!Number.isSafeInteger(quantity)||quantity<1||quantity>9999)throw new Error('Ürün adetlerini kontrol edin.');
      const specs=p?[p.power?clean(p.power)+' W':'',...(p.measures||[]).map(([k,v])=>clean(k)+': '+clean(v))].filter(Boolean).join('  /  '):'';
      return {code,quantity,name:clean(p?.name||'Katalog kodu teyit edilecek',160),specs,
        warning:clean(p?.warning||(!p?'Ürün ve kod teyidi gerekli.':''),240),page:p?.page||null,image:p?.web_image||null};
    });
    const date=new Date(now);
    if(!Number.isFinite(date.getTime()))throw new Error('Belge tarihi geçersiz.');
    const dateKey=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date).replaceAll('-','');
    return {items,details:Object.fromEntries(['company','city','sector','note'].map(k=>[k,clean(details[k],k==='note'?700:120)])),
      reference:'UNV-'+dateKey+'-'+clean(id,8).replace(/[^a-z0-9]/gi,'').toUpperCase().padEnd(6,'0'),
      date:date.toLocaleDateString('tr-TR',{timeZone:'Europe/Istanbul',day:'2-digit',month:'long',year:'numeric'}),
      total:items.reduce((sum,item)=>sum+item.quantity,0)};
  }
  function build(data,{jsPDF,autoTable,fonts,logo,images=new Map()}){
    const doc=new jsPDF({unit:'mm',format:'a4',compress:true,putOnlyUsedFonts:true});
    doc.addFileToVFS('Manrope-Regular.ttf',fonts.regular);
    doc.addFont('Manrope-Regular.ttf','Manrope','normal');
    doc.addFileToVFS('Manrope-Semibold.ttf',fonts.semibold);
    doc.addFont('Manrope-Semibold.ttf','Manrope','bold');
    doc.setProperties({title:'Ünüvar Aydınlatma - Teklif Talebi '+data.reference,author:'Ünüvar Aydınlatma',subject:'Ürün seçim ve teklif talep listesi',creator:'Ünüvar Aydınlatma'});
    const text=(value,x,y,size=9,bold=false,color=ink,options={})=>{doc.setFont('Manrope',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(...color);doc.text(String(value),x,y,options);};
    const lines=(value,width,size=9,bold=false)=>{doc.setFont('Manrope',bold?'bold':'normal');doc.setFontSize(size);return doc.splitTextToSize(value,width);};
    const drawLines=(parts,x,y,size=9,bold=false,color=ink)=>{parts.forEach((line,i)=>text(line,x,y+i*4.5,size,bold,color));return parts.length*4.5;};
    let y=44;
    text('TALEP SAHİBİ',16,y,7.5,true,muted);text('TALEP BİLGİLERİ',112,y,7.5,true,muted);y+=7;
    const customer=lines(data.details.company||'Belirtilmedi',86,11,true);
    drawLines(customer,16,y,11,true);
    const info=lines([data.details.city?'Teslimat: '+data.details.city:'Teslimat şehri belirtilmedi',data.details.sector?'Alan: '+data.details.sector:'Kullanım alanı belirtilmedi'].join('\n'),82,9);
    drawLines(info,112,y,9,false,muted);
    y+=Math.max(customer.length,info.length)*4.5+7;
    doc.setFillColor(...pale);doc.roundedRect(16,y,178,17,1,1,'F');
    text('SEÇİM ÖZETİ',21,y+5.5,7,true,muted);
    text(data.items.length+' farklı ürün',21,y+12,10,true);
    text(data.total.toLocaleString('tr-TR')+' adet',103,y+12,10,true);
    text('Fiyat ve stok teyidi bekliyor',189,y+12,8,false,muted,{align:'right'});
    y+=24;
    text('Ürün seçim listeniz',16,y,13,true);y+=5;
    const body=data.items.map((item,i)=>[String(i+1),'',item.code,[item.name,item.specs,item.warning].filter(Boolean).join('\n'),item.quantity.toLocaleString('tr-TR'),item.page?'s. '+item.page:'Teyit']);
    autoTable(doc,{
      startY:y,margin:{left:16,right:16,top:44,bottom:26},tableWidth:178,
      head:[['#','Görsel','Ürün kodu','Ürün / teknik özellik','Adet','Katalog']],body,
      theme:'plain',showHead:'everyPage',rowPageBreak:'avoid',
      styles:{font:'Manrope',fontStyle:'normal',fontSize:8.1,textColor:ink,cellPadding:3,lineWidth:0.15,lineColor:[228,231,223],overflow:'linebreak',valign:'middle'},
      headStyles:{fillColor:ink,textColor:[255,255,255],fontStyle:'bold',fontSize:7.2,minCellHeight:10},
      alternateRowStyles:{fillColor:[249,249,246]},bodyStyles:{minCellHeight:21},
      columnStyles:{0:{cellWidth:8,halign:'center',cellPadding:1.5},1:{cellWidth:21,cellPadding:2},2:{cellWidth:28,fontStyle:'bold'},3:{cellWidth:90},4:{cellWidth:15,halign:'right',fontStyle:'bold'},5:{cellWidth:16,halign:'center',fontSize:7.4}},
      didDrawCell:cell=>{
        if(cell.section!=='body'||cell.column.index!==1)return;
        const image=images.get(data.items[cell.row.index]?.image);
        if(image){const box=17,scale=Math.min(box/image.width,box/image.height),w=image.width*scale,h=image.height*scale;doc.addImage(image.data,'JPEG',cell.cell.x+(21-w)/2,cell.cell.y+(cell.cell.height-h)/2,w,h,undefined,'FAST');}
        else text('-',cell.cell.x+10.5,cell.cell.y+cell.cell.height/2+1,9,false,muted,{align:'center'});
      }
    });
    y=doc.lastAutoTable.finalY+9;
    const ensure=height=>{if(y+height>266){doc.addPage();y=47;}};
    ensure(18);
    text('Toplam '+data.items.length+' kalem',16,y,9,true);
    text(data.total.toLocaleString('tr-TR')+' adet',194,y,11,true,ink,{align:'right'});
    doc.setDrawColor(...gold);doc.setLineWidth(.7);doc.line(16,y+4,194,y+4);y+=14;
    if(data.details.note){
      const note=lines(data.details.note,168,9);ensure(14+note.length*4.5);
      doc.setFillColor(...pale);doc.roundedRect(16,y,178,14+note.length*4.5,1,1,'F');
      text('TERCİHLER VE TESLİMAT NOTU',21,y+6.5,7.5,true,muted);
      drawLines(note,21,y+13,9);y+=21+note.length*4.5;
    }
    const closing=lines('Bu belge fiyat teklifi veya kesinleşmiş sipariş değildir. Güncel fiyat, stok, ürün seçenekleri ve teslim koşulları mağazamızın teyidiyle netleşir. Listenizi WhatsApp üzerinden paylaşarak teklif isteyebilirsiniz.',174,8.5);
    ensure(8+closing.length*4.5);
    text('Talebinizden sonraki adım',16,y,10,true);
    drawLines(closing,16,y+6,8.5,false,muted);
    const count=doc.getNumberOfPages();
    for(let page=1;page<=count;page++){
      doc.setPage(page);
      if(logo)doc.addImage(logo,'PNG',16,12,39,17.7,undefined,'FAST');
      else text('Ünüvar Aydınlatma',16,23,16,true);
      text('TEKLİF TALEBİ',194,19,14,true,ink,{align:'right'});
      text(data.reference+'  |  '+data.date,194,27,7.4,false,muted,{align:'right'});
      doc.setFillColor(...gold);doc.rect(16,35,178,1.2,'F');
      if(page>1)text('Ürün seçim listesi / devam',16,41,7,false,muted);
      doc.setDrawColor(221,224,217);doc.setLineWidth(.2);doc.line(16,274,194,274);
      text('ÜNÜVAR AYDINLATMA',16,280,7.7,true);
      text('0545 610 50 09  |  Karaköy / İstanbul',194,280,7.3,false,muted,{align:'right'});
      text('Emekyemez Mah. Tutsak Sok. No:8, Beyoğlu / İstanbul',16,285,6.9,false,muted);
      text(page+' / '+count,194,285,7.5,true,muted,{align:'right'});
      doc.link(16,276,44,6,{url:'https://huseyinadr12.github.io/unuvar/'});
    }
    return doc;
  }
  return {snapshot,build};
});
