/* Heavy PDF assets are loaded only after the visitor chooses PDF indir. */
(() => {
  'use strict';
  const assets={
    library:'/assets/quote-pdf/jspdf-4.2.1.min.js',table:'/assets/quote-pdf/autotable-5.0.9.min.js',
    regular:'/assets/quote-pdf/Manrope-Regular.ttf',semibold:'/assets/quote-pdf/Manrope-Semibold.ttf',logo:'/assets/quote-pdf/logo.png'
  };
  let dependencies;
  const binary=bytes=>{let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);};
  async function bytes(url){const response=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error('PDF dosyaları yüklenemedi.');return new Uint8Array(await response.arrayBuffer());}
  function script(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');const timeout=setTimeout(()=>{s.remove();reject(new Error('PDF bileşeni zaman aşımına uğradı.'));},15000);s.src=src;s.onload=()=>{clearTimeout(timeout);resolve();};s.onerror=()=>{clearTimeout(timeout);s.remove();reject(new Error('PDF bileşeni yüklenemedi.'));};document.head.append(s);});}
  async function load(){
    if(!dependencies)dependencies=(async()=>{
      if(!window.jspdf)await script(assets.library);
      if(!window.jspdf.jsPDF.API.autoTable)await script(assets.table);
      const [regular,semibold,logo]=await Promise.all([bytes(assets.regular),bytes(assets.semibold),bytes(assets.logo)]);
      return {jsPDF:window.jspdf.jsPDF,autoTable:(doc,options)=>doc.autoTable(options),fonts:{regular:binary(regular),semibold:binary(semibold)},logo};
    })().catch(error=>{dependencies=null;throw error;});
    return dependencies;
  }
  function thumbnail(src){return new Promise(resolve=>{
    const img=new Image(),timer=setTimeout(()=>{img.src='';resolve(null);},6000);
    img.onload=()=>{clearTimeout(timer);try{const canvas=document.createElement('canvas'),scale=Math.min(1,220/Math.max(img.naturalWidth,img.naturalHeight));canvas.width=Math.round(img.naturalWidth*scale);canvas.height=Math.round(img.naturalHeight*scale);const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(img,0,0,canvas.width,canvas.height);resolve({data:canvas.toDataURL('image/jpeg',.85),width:canvas.width,height:canvas.height});}catch{resolve(null);}};
    img.onerror=()=>{clearTimeout(timer);resolve(null);};img.src=src;
  });}
  window.UnuvarQuoteDownload=async data=>{
    const resources=await load(),images=new Map(),queue=[...new Set(data.items.map(item=>item.image).filter(Boolean))];
    await Promise.all(Array.from({length:Math.min(4,queue.length)},async()=>{while(queue.length){const src=queue.shift(),image=await thumbnail(src);if(image)images.set(src,image);}}));
    const doc=window.UnuvarQuoteDocument.build(data,{...resources,images});
    const url=URL.createObjectURL(doc.output('blob')),a=document.createElement('a');
    a.href=url;a.download='unuvar-teklif-talebi-'+data.reference.toLowerCase()+'.pdf';a.hidden=true;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  };
})();
