
import { firebaseConfig, configurato, cloudinary } from '../firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, collection, addDoc, setDoc, doc, deleteDoc, updateDoc, onSnapshot, query, orderBy, getDocs, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const $ = id => document.getElementById(id);
const say = (el, t, ok) => { el.textContent = t; el.className = 'msg ' + (ok ? 'ok' : 'err'); };
function el(tag, props = {}, ...kids){
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  kids.flat().forEach(c => e.append(c));
  return e;
}

if (!configurato) {
  $('lMsg').textContent = 'Firebase non è ancora configurato: compila il file firebase-config.js (vedi README).';
  $('formLogin').querySelector('button').disabled = true;
  throw new Error('Firebase non configurato');
}

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
const db = getFirestore(app);
const cloudOk = cloudinary && !String(cloudinary.cloudName).startsWith('INSERISCI');

/* ---------- LOGIN ---------- */
$('formLogin').addEventListener('submit', async e => {
  e.preventDefault();
  $('lMsg').textContent = '';
  try { await signInWithEmailAndPassword(auth, $('lEmail').value.trim(), $('lPass').value); }
  catch { $('lMsg').textContent = 'Email o password non corretti.'; }
});
$('esci').addEventListener('click', () => signOut(auth));

let unsubs = [];
onAuthStateChanged(auth, user => {
  unsubs.forEach(u => u()); unsubs = [];
  if (user) {
    $('login').classList.add('hidden'); $('app').classList.remove('hidden');
    $('utente').textContent = user.email;
    avvia();
  } else {
    $('app').classList.add('hidden'); $('login').classList.remove('hidden');
    $('lPass').value = '';
  }
});

/* Uscita automatica dopo 30 minuti di inattività */
let idle; const reset = () => { clearTimeout(idle); idle = setTimeout(() => signOut(auth), 30 * 60 * 1000); };
['click', 'keydown', 'pointerdown'].forEach(ev => addEventListener(ev, reset)); reset();

/* ---------- TAB ---------- */
document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === b));
  ['partite', 'foto', 'messaggi'].forEach(t => $('t-' + t).classList.toggle('hidden', t !== b.dataset.tab));
}));

function avvia(){
  /* ---------- PARTITE ---------- */
  unsubs.push(onSnapshot(query(collection(db, 'partite'), orderBy('data', 'asc')), snap => {
    const box = $('listaPartite'); box.replaceChildren();
    if (snap.empty) { box.append(el('p', { class: 'empty' }, 'Nessuna partita inserita.')); return; }
    const oggi = new Date().toISOString().slice(0, 10);
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // prima le prossime, poi le passate (più recenti in alto)
    const prossime = docs.filter(p => p.data >= oggi);
    const passate = docs.filter(p => p.data < oggi).reverse();
    [...prossime, ...passate].forEach(p => box.append(rigaPartita(p, p.data < oggi)));
  }, err => say($('pMsg'), 'Errore lettura partite: ' + err.code, false)));

  /* ---------- FOTO ---------- */
  unsubs.push(onSnapshot(query(collection(db, 'foto'), orderBy('creato', 'desc')), snap => {
    const box = $('listaFoto'); box.replaceChildren();
    if (snap.empty) { box.append(el('p', { class: 'empty' }, 'Nessuna foto caricata.')); return; }
    snap.docs.forEach(d => box.append(cardFoto(d.id, d.data())));
  }, err => say($('fMsg'), 'Errore lettura foto: ' + err.code, false)));

  /* ---------- MESSAGGI ---------- */
  unsubs.push(onSnapshot(query(collection(db, 'messaggi'), orderBy('creato', 'desc')), snap => {
    const box = $('listaMessaggi'); box.replaceChildren();
    const nuovi = snap.docs.filter(d => !d.data().letto).length;
    $('nuovi').textContent = nuovi; $('nuovi').classList.toggle('hidden', !nuovi);
    if (snap.empty) { box.append(el('p', { class: 'empty' }, 'Nessun messaggio.')); return; }
    snap.docs.forEach(d => box.append(cardMessaggio(d.id, d.data())));
  }, err => box0('listaMessaggi', 'Errore lettura messaggi: ' + err.code)));
}
function box0(id, t){ $(id).replaceChildren(el('p', { class: 'empty' }, t)); }

/* ---------- Partite: UI ---------- */
const fmtData = iso => { const [y, m, d] = iso.split('-'); return { g: d + '/' + m, a: y }; };
function rigaPartita(p, passata){
  const f = fmtData(p.data);
  const casa = p.tipo === 'casa';
  const titolo = casa ? `Roma De Virtute vs ${p.avversario}` : `${p.avversario} vs Roma De Virtute`;
  return el('div', { class: 'item' + (passata ? ' passata' : '') },
    el('div', { class: 'd' }, f.g, el('small', {}, f.a)),
    el('div', {},
      el('h3', {}, titolo, el('span', { class: 'pill' }, casa ? 'Casa' : 'Trasferta'), p.risultato ? el('span', { class: 'pill res' }, p.risultato) : ''),
      el('p', {}, [p.squadra, p.ora, p.luogo].filter(Boolean).join(' · '))),
    el('div', { class: 'actions' },
      el('button', { class: 'btn line sm', onclick: () => modificaPartita(p) }, 'Modifica'),
      el('button', { class: 'btn danger sm', onclick: async () => { if (confirm('Eliminare questa partita?')) await deleteDoc(doc(db, 'partite', p.id)); } }, 'Elimina')));
}
let inModifica = null;
function resetForm(){
  inModifica = null; $('formPartita').reset();
  $('titoloForm').textContent = 'Aggiungi partita'; $('salvaPartita').textContent = 'Salva partita';
  $('annullaMod').classList.add('hidden');
}
function modificaPartita(p){
  inModifica = p.id;
  $('pData').value = p.data; $('pOra').value = p.ora || ''; $('pSq').value = p.squadra || 'Serie B';
  $('pAvv').value = p.avversario; $('pTipo').value = p.tipo || 'casa'; $('pLuogo').value = p.luogo || ''; $('pRis').value = p.risultato || '';
  $('titoloForm').textContent = 'Modifica partita'; $('salvaPartita').textContent = 'Aggiorna partita';
  $('annullaMod').classList.remove('hidden'); scrollTo({ top: 0, behavior: 'smooth' });
}
$('annullaMod').addEventListener('click', resetForm);
$('formPartita').addEventListener('submit', async e => {
  e.preventDefault();
  const dati = {
    data: $('pData').value, ora: $('pOra').value, squadra: $('pSq').value,
    avversario: $('pAvv').value.trim(), tipo: $('pTipo').value,
    luogo: $('pLuogo').value.trim(), risultato: $('pRis').value.trim()
  };
  $('salvaPartita').disabled = true;
  try {
    if (inModifica) await setDoc(doc(db, 'partite', inModifica), dati);
    else await addDoc(collection(db, 'partite'), { ...dati, creato: serverTimestamp() });
    say($('pMsg'), inModifica ? 'Partita aggiornata ✔' : 'Partita aggiunta ✔', true);
    resetForm();
  } catch (err) { say($('pMsg'), 'Errore: ' + err.code, false); }
  $('salvaPartita').disabled = false;
});

/* ---------- Foto: UI ---------- */
const urlSicuro = u => typeof u === 'string' && u.startsWith('https://res.cloudinary.com/');
function comprimi(file, max = 1600, q = .85){
  return new Promise((ok, ko) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      c.toBlob(b => b ? ok(b) : ko(new Error('compressione')), 'image/jpeg', q);
    };
    img.onerror = () => ko(new Error('immagine non valida')); img.src = url;
  });
}
function inviaCloudinary(blob, onProg){
  return new Promise((ok, ko) => {
    const fd = new FormData();
    fd.append('file', blob); fd.append('upload_preset', cloudinary.uploadPreset); fd.append('folder', 'devirtude');
    const x = new XMLHttpRequest();
    x.open('POST', `https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/image/upload`);
    x.upload.onprogress = e => e.lengthComputable && onProg(e.loaded / e.total);
    x.onload = () => { try { const j = JSON.parse(x.responseText); x.status === 200 ? ok(j) : ko(new Error(j.error?.message || 'errore ' + x.status)); } catch { ko(new Error('risposta non valida')); } };
    x.onerror = () => ko(new Error('rete')); x.send(fd);
  });
}
$('caricaFoto').addEventListener('click', async () => {
  if (!cloudOk) return say($('fMsg'), 'Cloudinary non è configurato: compila "cloudinary" in firebase-config.js (vedi README).', false);
  const files = [...$('fFile').files];
  if (!files.length) return say($('fMsg'), 'Scegli almeno una foto.', false);
  const btn = $('caricaFoto'); btn.disabled = true; $('prog').classList.remove('hidden');
  let fatte = 0;
  try {
    for (const f of files) {
      const blob = await comprimi(f);
      const r = await inviaCloudinary(blob, v => { $('prog').firstChild.style.width = ((fatte + v) / files.length * 100) + '%'; });
      await addDoc(collection(db, 'foto'), { url: r.secure_url, publicId: r.public_id, creato: serverTimestamp() });
      fatte++;
    }
    say($('fMsg'), `${fatte} foto caricate ✔`, true); $('fFile').value = '';
  } catch (err) { say($('fMsg'), 'Errore upload: ' + err.message, false); }
  btn.disabled = false; setTimeout(() => { $('prog').classList.add('hidden'); $('prog').firstChild.style.width = 0; }, 800);
});
function cardFoto(id, f){
  return el('div', { class: 'foto' },
    el('img', { src: urlSicuro(f.url) ? f.url.replace('/upload/', '/upload/c_fill,w_400,h_400,q_auto,f_auto/') : '', alt: '', loading: 'lazy' }),
    el('div', {}, el('span', {}, f.creato ? f.creato.toDate().toLocaleDateString('it-IT') : ''),
      el('button', { class: 'btn danger sm', onclick: async () => {
        if (!confirm('Eliminare questa foto?')) return;
        await deleteDoc(doc(db, 'foto', id));
      } }, 'Elimina')));
}

/* ---------- Messaggi: UI ---------- */
/* Cancella i messaggi più vecchi di 12 mesi (conservazione limitata, GDPR) */
$('pulisciVecchi').addEventListener('click', async () => {
  if (!confirm('Eliminare definitivamente tutti i messaggi ricevuti più di 12 mesi fa?')) return;
  const limite = Date.now() - 365 * 24 * 3600 * 1000;
  const snap = await getDocs(collection(db, 'messaggi'));
  const vecchi = snap.docs.filter(d => { const c = d.data().creato; return c && c.toMillis() < limite; });
  await Promise.all(vecchi.map(d => deleteDoc(d.ref)));
  alert(vecchi.length + ' messaggi eliminati.');
});

function cardMessaggio(id, m){
  const quando = m.creato ? m.creato.toDate().toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' }) : '…';
  const contatti = el('div', { class: 'contatti' }, 'Email: ', el('a', { href: 'mailto:' + m.email }, m.email));
  if (m.telefono) contatti.append(' · Tel: ', el('a', { href: 'tel:' + m.telefono }, m.telefono));
  return el('div', { class: 'mess' + (m.letto ? '' : ' nuovo') },
    el('header', {}, el('b', {}, m.nome, m.letto ? '' : el('span', { class: 'pill' }, 'Nuovo')), el('time', {}, quando)),
    contatti,
    el('p', { class: 'testo' }, m.messaggio),
    el('div', { class: 'actions left' },
      el('a', { class: 'btn sm', href: 'mailto:' + m.email + '?subject=' + encodeURIComponent('Re: Roma De Virtute') }, 'Rispondi'),
      el('button', { class: 'btn line sm', onclick: () => updateDoc(doc(db, 'messaggi', id), { letto: !m.letto }) }, m.letto ? 'Segna da leggere' : 'Segna come letto'),
      el('button', { class: 'btn danger sm', onclick: async () => { if (confirm('Eliminare il messaggio?')) await deleteDoc(doc(db, 'messaggi', id)); } }, 'Elimina')));
}
