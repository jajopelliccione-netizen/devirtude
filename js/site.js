import { firebaseConfig, configurato } from '../firebase-config.js';

const $ = id => document.getElementById(id);
const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';

/* ---------- Menu ---------- */
const menu = $('menu'), burger = $('burger');
burger.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});
menu.addEventListener('click', e => { if (e.target.closest('a')) { menu.classList.remove('open'); burger.setAttribute('aria-expanded', false); } });
$('anno').textContent = new Date().getFullYear();

/* ---------- Video: si carica solo quando serve ---------- */
const video = $('video');
new IntersectionObserver((es, o) => {
  if (!es[0].isIntersecting) return;
  o.disconnect();
  video.src = video.dataset.src;
  video.preload = 'metadata';
  video.play().catch(() => {});
}, { rootMargin: '200px' }).observe(video);

/* ---------- Galleria (riserva statica) ---------- */
const gal = $('gal');
const POST = 'https://www.instagram.com/p/DZ2QYAVCLNv/';
function tile(href, src, alt) {
  const a = document.createElement('a');
  a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
  const img = new Image(); img.alt = alt; img.loading = 'lazy'; img.decoding = 'async'; img.src = src;
  img.onerror = () => a.remove();
  a.append(img); return a;
}
for (let i = 1; i <= 2; i++) gal.append(tile(POST, `assets/instagram/foto-${i}.webp`, 'Festeggiamenti Roma De Virtute'));

/* ---------- Partite ---------- */
function rigaPartita(p, fatta) {
  const [, m, d] = p.data.split('-');
  const casa = p.tipo === 'casa';
  const riga = document.createElement('div'); riga.className = 'm' + (fatta ? ' fatta' : '');
  const dd = document.createElement('span'); dd.className = 'd'; dd.textContent = `${d} / ${m}`;
  const c = document.createElement('div');
  const h = document.createElement('h3'); h.textContent = casa ? `Roma De Virtute vs ${p.avversario}` : `${p.avversario} vs Roma De Virtute`;
  const pp = document.createElement('p'); pp.textContent = [p.squadra, p.ora ? 'ore ' + p.ora : '', p.luogo].filter(Boolean).join(' · ');
  c.append(h, pp);
  const t = document.createElement('span');
  if (fatta && p.risultato) { t.className = 'ris'; t.textContent = p.risultato; } else { t.className = 'tag'; t.textContent = casa ? 'Casa' : 'Trasferta'; }
  riga.append(dd, c, t); return riga;
}
async function caricaPartite(db, fs) {
  const snap = await fs.getDocs(fs.query(fs.collection(db, 'partite'), fs.orderBy('data', 'asc')));
  const tutte = snap.docs.map(d => d.data()).filter(p => /^\d{4}-\d{2}-\d{2}$/.test(p.data));
  const oggi = new Date().toISOString().slice(0, 10);
  const prossime = tutte.filter(p => p.data >= oggi).slice(0, 6);
  const passate = tutte.filter(p => p.data < oggi && p.risultato).reverse().slice(0, 4);
  const box = $('partite'); box.replaceChildren();
  prossime.forEach(p => box.append(rigaPartita(p, false)));
  if (passate.length) {
    const h = document.createElement('h3'); h.className = 'sub'; h.textContent = 'Ultimi risultati'; box.append(h);
    passate.forEach(p => box.append(rigaPartita(p, true)));
  }
  $('notaPartite').hidden = prossime.length > 0;
}

/* ---------- Foto dal pannello (solo URL Cloudinary) ---------- */
async function caricaFoto(db, fs) {
  const snap = await fs.getDocs(fs.query(fs.collection(db, 'foto'), fs.orderBy('creato', 'desc'), fs.limit(12)));
  const urls = snap.docs.map(d => d.data().url).filter(u => typeof u === 'string' && u.startsWith('https://res.cloudinary.com/'));
  if (!urls.length) return;
  gal.replaceChildren();
  urls.forEach(u => gal.append(tile('https://www.instagram.com/devirtuteroma/', u.replace('/upload/', '/upload/c_limit,w_900,q_auto,f_auto/'), 'Foto Roma De Virtute')));
}

/* ---------- Firebase: si carica solo quando ci si avvicina alle sezioni dinamiche ---------- */
let dbPromise = null;
function firebase() {
  if (!configurato) return Promise.resolve(null);
  dbPromise ??= Promise.all([import(FB + 'firebase-app.js'), import(FB + 'firebase-firestore.js')])
    .then(([app, fs]) => ({ db: fs.getFirestore(app.initializeApp(firebaseConfig)), fs }))
    .catch(() => null);
  return dbPromise;
}
let avviato = false;
const io = new IntersectionObserver(es => {
  if (avviato || !es.some(e => e.isIntersecting)) return;
  avviato = true; io.disconnect();
  firebase().then(f => { if (f) { caricaPartite(f.db, f.fs).catch(() => {}); caricaFoto(f.db, f.fs).catch(() => {}); } });
}, { rootMargin: '700px' });
['calendario', 'foto', 'entra'].forEach(id => io.observe($(id)));

/* ---------- Modulo messaggi ---------- */
const form = $('formMsg'), esito = $('esitoMsg');
const dice = (t, ok) => { esito.className = 'esito ' + (ok ? 'ok' : 'err'); esito.textContent = t; };
form.addEventListener('submit', async e => {
  e.preventDefault();
  const f = new FormData(form);
  if (f.get('web')) return;                                   // trappola anti-bot
  const nome = f.get('nome').trim(), email = f.get('email').trim(), tel = f.get('telefono').trim(), msg = f.get('messaggio').trim();
  if (!nome || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !msg) return dice('Compila nome, email valida e messaggio.', false);
  if (!form.consenso.checked) return dice('Per inviare devi accettare l’informativa privacy.', false);
  let ultimo = 0; try { ultimo = +localStorage.getItem('ultimoMsg') || 0; } catch {}
  if (Date.now() - ultimo < 60000) return dice('Hai appena inviato un messaggio: riprova tra un minuto.', false);
  const btn = form.querySelector('button'); btn.disabled = true;
  try {
    const f2 = await firebase();
    if (!f2) throw new Error('offline');
    const dati = { nome, email, messaggio: msg, consenso: true, letto: false, creato: f2.fs.serverTimestamp() };
    if (tel) dati.telefono = tel;
    await f2.fs.addDoc(f2.fs.collection(f2.db, 'messaggi'), dati);
    try { localStorage.setItem('ultimoMsg', Date.now()); } catch {}
    form.reset(); dice('Messaggio inviato! Ti risponderemo presto. 🐯', true);
  } catch { dice('Invio non riuscito. Riprova o scrivici su Instagram.', false); }
  btn.disabled = false;
});
