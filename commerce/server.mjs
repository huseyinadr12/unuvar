import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes,randomUUID,createHash,scrypt as derive,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const directory=path.dirname(fileURLToPath(import.meta.url));
const scrypt=promisify(derive),digest=value=>createHash('sha256').update(value).digest('hex');
const tidy=(value,max=200)=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max);
const fail=(status,message)=>Object.assign(new Error(message),{status});
const token=()=>randomBytes(32).toString('hex');
export async function passwordHash(password){const salt=token(),key=await scrypt(password,salt,64);return salt+':'+key.toString('hex');}
async function passwordMatches(password,encoded){const [salt,hash]=encoded.split(':'),key=await scrypt(password,salt,64);return timingSafeEqual(key,Buffer.from(hash,'hex'));}

export async function createStore({dbPath,origin='http://127.0.0.1:8732',allowSetup=false,catalog,admin}={}){
  const siteOrigin=new URL(origin).origin,secure=siteOrigin.startsWith('https:');
  if(dbPath!==':memory:')await mkdir(path.dirname(dbPath),{recursive:true});
  const db=new DatabaseSync(dbPath);db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  db.exec(`CREATE TABLE IF NOT EXISTS products(code TEXT PRIMARY KEY, record TEXT NOT NULL, price INTEGER, stock INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 0, version INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS admins(email TEXT PRIMARY KEY,password TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY,email TEXT NOT NULL,csrf TEXT NOT NULL,expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS requests(id TEXT PRIMARY KEY, key TEXT UNIQUE NOT NULL, fingerprint TEXT NOT NULL, created TEXT NOT NULL, customer TEXT NOT NULL, items TEXT NOT NULL, total INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'new', note TEXT NOT NULL DEFAULT '', version INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY,at TEXT NOT NULL,actor TEXT NOT NULL,action TEXT NOT NULL,entity TEXT NOT NULL);`);
  const source=catalog||JSON.parse(await readFile(path.join(directory,'../source/data/quote-products.json'),'utf8'));
  const seed=db.prepare('INSERT OR IGNORE INTO products(code,record) VALUES (?,?)');
  db.exec('BEGIN');try{for(const product of source)seed.run(product.code,JSON.stringify(product));db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}
  if(admin)db.prepare('INSERT OR IGNORE INTO admins(email,password) VALUES (?,?)').run(admin.email,await passwordHash(admin.password));
  const limits=new Map();
  function limited(key,max){const now=Date.now();for(const [key,value]of limits)if(value.until<now)limits.delete(key);let item=limits.get(key);if(!item){if(limits.size>5000)throw fail(429,'Biraz sonra yeniden deneyin.');limits.set(key,item={until:now+15*60000,count:0});}if(++item.count>max)throw fail(429,'Çok fazla deneme. 15 dakika sonra yeniden deneyin.');}
  const products=where=>db.prepare('SELECT * FROM products '+where+' ORDER BY code').all().map(row=>({...JSON.parse(row.record),priceCents:row.price,stock:row.stock,active:!!row.active,version:row.version}));
  const audit=(actor,action,entity)=>db.prepare('INSERT INTO events(at,actor,action,entity) VALUES (?,?,?,?)').run(new Date().toISOString(),actor,action,entity);
  function json(res,status,value,headers={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(JSON.stringify(value));}
  async function body(req){if(!(req.headers['content-type']||'').startsWith('application/json'))throw fail(415,'JSON içerik gerekli.');let size=0,chunks=[];for await(const part of req){size+=part.length;if(size>48000)throw fail(413,'İstek çok büyük.');chunks.push(part);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw fail(400,'İstek okunamadı.');}}
  function sameOrigin(req){if(req.headers.origin!==siteOrigin)throw fail(403,'İstek kaynağı doğrulanamadı.');}
  function session(req,mutation=false){const raw=/(?:^|;\s*)unuvar_admin=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie||'')?.[1];if(!raw)throw fail(401,'Giriş yapın.');db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now());const value=db.prepare('SELECT * FROM sessions WHERE id=?').get(digest(raw));if(!value)throw fail(401,'Oturum süresi doldu.');if(mutation&&req.headers['x-csrf-token']!==value.csrf)throw fail(403,'İşlem doğrulanamadı. Sayfayı yenileyin.');return value;}
  const cookie=(value,age)=>`unuvar_admin=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${secure?'; Secure':''}`;
  const setupAllowed=req=>allowSetup&&['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)&&new URL(siteOrigin).hostname==='127.0.0.1';
  const server=http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
    try{
      const url=new URL(req.url,siteOrigin),route=url.pathname,method=req.method;
      if(route.startsWith('/api/')){
        res.setHeader('Cache-Control','no-store');
        if(!['GET','HEAD'].includes(method))sameOrigin(req);
        if(route==='/api/store'&&method==='GET')return json(res,200,{products:products('WHERE active=1'),currency:'TRY',paymentAvailable:false,shippingConfirmed:false});
        if(route==='/api/admin/session'&&method==='GET'){
          if(db.prepare('SELECT count(*) AS n FROM admins').get().n===0)return json(res,200,{setupRequired:true,setupAllowed:setupAllowed(req)});
          const value=session(req);return json(res,200,{email:value.email,csrf:value.csrf});
        }
        if(route==='/api/admin/setup'&&method==='POST'){
          if(!setupAllowed(req)||db.prepare('SELECT count(*) AS n FROM admins').get().n)throw fail(403,'İlk kurulum kapalı.');
          limited('setup:'+req.socket.remoteAddress,8);const data=await body(req),email=tidy(data.email,120).toLowerCase();
          if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||typeof data.password!=='string'||data.password.length<14||data.password.length>200)throw fail(400,'Geçerli e-posta ve en az 14 karakterli parola girin.');
          const hash=await passwordHash(data.password);
          if(db.prepare('SELECT count(*) AS n FROM admins').get().n)throw fail(409,'Kurulum zaten tamamlandı.');
          db.prepare('INSERT INTO admins(email,password) VALUES (?,?)').run(email,hash);audit(email,'admin-created','initial');return json(res,201,{created:true});
        }
        if(route==='/api/admin/login'&&method==='POST'){
          limited('login:'+req.socket.remoteAddress,8);const data=await body(req),email=tidy(data.email,120).toLowerCase(),account=db.prepare('SELECT * FROM admins WHERE email=?').get(email);
          if(typeof data.password!=='string'||data.password.length>200||!account||!await passwordMatches(data.password,account.password))throw fail(401,'E-posta veya parola hatalı.');
          limits.delete('login:'+req.socket.remoteAddress);const value=token(),csrf=token();db.prepare('INSERT INTO sessions(id,email,csrf,expires) VALUES (?,?,?,?)').run(digest(value),email,csrf,Date.now()+8*3600000);
          audit(email,'login','session');return json(res,200,{email,csrf},{'Set-Cookie':cookie(value,8*3600)});
        }
        if(route==='/api/admin/logout'&&method==='POST'){const value=session(req,true);db.prepare('DELETE FROM sessions WHERE id=?').run(value.id);return json(res,200,{ok:true},{'Set-Cookie':cookie('',0)});}
        if(route==='/api/admin/products'&&method==='GET'){session(req);return json(res,200,{products:products('')});}
        if(route.startsWith('/api/admin/products/')&&method==='PATCH'){
          const user=session(req,true),code=decodeURIComponent(route.slice('/api/admin/products/'.length)),data=await body(req);
          const row=db.prepare('SELECT * FROM products WHERE code=?').get(code);if(!row)throw fail(404,'Ürün bulunamadı.');
          if(data.version!==row.version)throw fail(409,'Ürün başka bir ekranda değişti. Listeyi yenileyin.');
          const price=data.priceCents,stock=data.stock,active=data.active;
          if(!(price===null||Number.isSafeInteger(price)&&price>=1&&price<=100000000)||!Number.isSafeInteger(stock)||stock<0||stock>999999||typeof active!=='boolean'||active&&price===null)throw fail(400,'Fiyat, stok ve yayın durumunu kontrol edin.');
          const record=JSON.parse(row.record);record.name=tidy(data.name,160);if(!record.name)throw fail(400,'Ürün adı gerekli.');
          db.prepare('UPDATE products SET record=?,price=?,stock=?,active=?,version=version+1 WHERE code=?').run(JSON.stringify(record),price,stock,active?1:0,code);audit(user.email,'product-updated',code);
          return json(res,200,{ok:true});
        }
        if(route==='/api/order-requests'&&method==='POST'){
          limited('request:'+req.socket.remoteAddress,15);const data=await body(req),key=tidy(req.headers['idempotency-key'],80);
          if(!/^[a-zA-Z0-9-]{16,80}$/.test(key))throw fail(400,'Talep anahtarı gerekli.');
          const fingerprint=digest(JSON.stringify(data)),existing=db.prepare('SELECT id,fingerprint FROM requests WHERE key=?').get(key);
          if(existing){if(existing.fingerprint!==fingerprint)throw fail(409,'Talep zaten farklı bilgilerle gönderildi.');return json(res,200,{id:existing.id,status:'request_received',paid:false});}
          const customer={name:tidy(data.customer?.name,120),email:tidy(data.customer?.email,120),phone:tidy(data.customer?.phone,30),city:tidy(data.customer?.city,60),note:tidy(data.customer?.note,700)};
          if(customer.name.length<2||!/^\+?[0-9 ()-]{10,25}$/.test(customer.phone)||!customer.city||customer.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email))throw fail(400,'Ad, telefon, şehir ve e-posta bilgilerini kontrol edin.');
          if(!Array.isArray(data.items)||!data.items.length||data.items.length>50)throw fail(400,'Sepette 1-50 ürün bulunmalı.');
          const seen=new Set(),items=[];let total=0;
          for(const item of data.items){const code=tidy(item.code,80),row=db.prepare('SELECT * FROM products WHERE code=? AND active=1').get(code),qty=item.quantity;
            if(seen.has(code)||!row||row.price===null||!Number.isSafeInteger(qty)||qty<1||qty>9999||qty>row.stock)throw fail(409,'Ürün veya stok değişti. Sepeti yenileyin.');
            if(item.version!==row.version)throw fail(409,'Ürün fiyatı veya bilgileri değişti. Sepeti yenileyip yeniden kontrol edin.');
            seen.add(code);items.push({code,name:JSON.parse(row.record).name,quantity:qty,priceCents:row.price,lineTotalCents:row.price*qty});total+=row.price*qty;}
          if(!Number.isSafeInteger(total))throw fail(400,'Sepet toplamı geçersiz.');
          const id='UNV-'+randomUUID();db.prepare('INSERT INTO requests(id,key,fingerprint,created,customer,items,total) VALUES (?,?,?,?,?,?,?)').run(id,key,fingerprint,new Date().toISOString(),JSON.stringify(customer),JSON.stringify(items),total);
          return json(res,201,{id,status:'request_received',paid:false});
        }
        if(route==='/api/checkout'&&method==='POST')throw fail(503,'Çevrimiçi ödeme henüz etkin değil. Kart bilgisi alınmaz.');
        if(route==='/api/admin/requests'&&method==='GET'){session(req);return json(res,200,{requests:db.prepare('SELECT * FROM requests ORDER BY created DESC LIMIT 200').all().map(({key,fingerprint,...row})=>({...row,customer:JSON.parse(row.customer),items:JSON.parse(row.items)}))});}
        if(route.startsWith('/api/admin/requests/')&&method==='PATCH'){
          const user=session(req,true),id=decodeURIComponent(route.slice('/api/admin/requests/'.length)),data=await body(req),row=db.prepare('SELECT * FROM requests WHERE id=?').get(id);
          if(!row)throw fail(404,'Talep bulunamadı.');if(data.version!==row.version)throw fail(409,'Talep değişti. Yenileyin.');
          if(!['new','reviewing','quoted','closed','cancelled'].includes(data.status))throw fail(400,'Geçersiz talep durumu.');
          db.prepare('UPDATE requests SET status=?,note=?,version=version+1 WHERE id=?').run(data.status,tidy(data.note,1500),id);audit(user.email,'request-updated',id);return json(res,200,{ok:true});
        }
        if(route==='/api/admin/overview'&&method==='GET'){session(req);return json(res,200,{totalProducts:db.prepare('SELECT count(*) AS n FROM products').get().n,published:db.prepare('SELECT count(*) AS n FROM products WHERE active=1').get().n,newRequests:db.prepare("SELECT count(*) AS n FROM requests WHERE status='new'").get().n,paymentAvailable:false,shippingConfirmed:false});}
        throw fail(404,'İşlem bulunamadı.');
      }
      if(!['GET','HEAD'].includes(method))throw fail(405,'Yöntem desteklenmiyor.');
      let file,commerce=false;
      if(route==='/admin/'||route==='/magaza/'){file=path.join(directory,'public',route==='/admin/'?'admin.html':'store.html');commerce=true;}
      else if(route.startsWith('/commerce-assets/')){const rel=decodeURIComponent(route.slice(17));if(!/^[a-z-]+\.(js|css)$/.test(rel))throw fail(404,'Dosya yok.');file=path.join(directory,'public',rel);commerce=true;}
      else{const base=path.resolve(directory,'../source/dist'),relative=decodeURIComponent(route).replace(/^\/+/,''),candidate=path.resolve(base,relative+(route.endsWith('/')?'index.html':''));if(!candidate.startsWith(base+path.sep)||relative.includes('\\'))throw fail(404,'Dosya yok.');file=candidate;}
      if(commerce)res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
      const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf','.pdf':'application/pdf','.txt':'text/plain; charset=utf-8'}[path.extname(file)];if(!mime)throw fail(404,'Dosya yok.');
      const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime,'Cache-Control':commerce?'no-store':'public, max-age=300','Content-Length':bytes.length,'X-Frame-Options':'DENY'});res.end(method==='HEAD'?undefined:bytes);
    }catch(error){json(res,error.status||(error.code==='ENOENT'?404:500),{error:error.status?error.message:'İşlem tamamlanamadı.'});}
  });
  return {server,db,close:()=>{server.close();db.close();}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const port=Number(process.env.PORT||8732),host=process.env.HOST||'127.0.0.1';
  const origin=process.env.SITE_ORIGIN||`http://127.0.0.1:${port}`;
  if(host!=='127.0.0.1'&&(!process.env.SITE_ORIGIN||!origin.startsWith('https://')))throw new Error('Public hosting requires an explicit HTTPS SITE_ORIGIN.');
  const app=await createStore({dbPath:process.env.COMMERCE_DB||path.join(directory,'.local/store.sqlite'),origin,allowSetup:host==='127.0.0.1'&&process.env.LOCAL_SETUP==='1'});
  app.server.listen(port,host,()=>console.log(`Store: ${origin}/magaza/\nAdmin: ${origin}/admin/`));
}
