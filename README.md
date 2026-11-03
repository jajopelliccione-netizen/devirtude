# Roma De Virtute – sito + pannello admin

Sito statico (HTML/CSS/JS, nessuna build) con **Firebase** (database + login) e **Cloudinary** (foto), ospitato su **Cloudflare Pages**.

```
index.html              sito pubblico
privacy.html cookie.html  informative (DA COMPLETARE con i dati legali, vedi sotto)
css/ js/ fonts/ assets/   stile, script, font (self-hosted), immagini ottimizzate
admin/                  pannello admin (partite, foto, messaggi)
firebase-config.js      dati progetto Firebase + Cloudinary
firestore.rules         regole di sicurezza del database
_headers                header di sicurezza (CSP, HSTS…) e cache per Cloudflare
```

## Da completare (legale)
Nei file `privacy.html` e `cookie.html` cerca le scritte gialle `[…]` e sostituiscile con i dati reali della società
(denominazione, sede legale, C.F./P.IVA, email o PEC per la privacy). Fai rileggere le informative a un consulente/legale.

Checklist:
- [ ] Dati del titolare compilati in `privacy.html`
- [ ] Messaggi cancellati dopo 12 mesi (pulsante nel pannello → Messaggi)
- [ ] Se un giorno aggiungi Google Analytics, Meta Pixel, video YouTube incorporati ecc. → serve banner cookie con consenso

## Sicurezza (già fatto)
- Header: CSP restrittiva (niente script inline), HSTS, anti-clickjacking, nosniff, Permissions-Policy.
- Database: tutti leggono partite/foto; i messaggi possono solo essere **creati** (campi validati, consenso obbligatorio);
  solo l'email admin può scrivere o leggere i messaggi. Registrazione di nuovi utenti Firebase disabilitata.
- Nessun HTML dai dati del database viene interpretato (solo `textContent`); gli URL foto sono accettati solo da `res.cloudinary.com`.
- Uscita automatica dal pannello dopo 30 minuti di inattività.

Consigliato in più (manuale):
1. **Cloudflare Access** davanti a `/admin/*` (Zero Trust → Access → Applications, gratis fino a 50 utenti): secondo lucchetto.
2. **Restrizione chiave API**: console.cloud.google.com → API e servizi → Credenziali → chiave "Browser key" → Restrizioni per referrer HTTP: `https://devirtude.pages.dev/*` (e il tuo dominio).
3. **Cloudinary**: Settings → Upload → preset `devirtude` → limita formati (jpg, png, webp) e dimensione massima file.
4. **Firebase App Check** (reCAPTCHA) per bloccare bot sul modulo messaggi.
5. Password admin lunga e unica; mai condividere chiavi/token in chat; ruota quelli già condivisi.

## Aggiornare il sito
Ogni push sul branch di produzione di Cloudflare Pages ripubblica il sito.
Partite, foto e messaggi si gestiscono da `/admin/` (non serve toccare il codice).
