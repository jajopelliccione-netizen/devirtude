# Roma De Virtute – sito + pannello admin

Sito statico (HTML) con **Firebase** (database, login, foto) e hosting su **Cloudflare Pages**.

```
index.html          sito pubblico
admin/index.html    pannello admin (partite, foto, messaggi)
firebase-config.js  dati del tuo progetto Firebase  <-- DA COMPILARE
firestore.rules     regole di sicurezza database    <-- DA COMPILARE (email admin)
assets/             logo e foto di riserva
```

## 1. Crea il progetto Firebase
1. Vai su https://console.firebase.google.com → **Aggiungi progetto**.
2. **Build → Authentication → Inizia → Email/Password → Abilita.**
3. Sempre in Authentication → **Utenti → Aggiungi utente**: inserisci l'email e la password con cui entrerai nel pannello.
4. **Build → Firestore Database → Crea database** (modalità produzione, regione `eur3`/`europe-west`).
5. *(Le foto NON usano Firebase Storage: usano Cloudinary, vedi sotto.)*
6. **Impostazioni progetto (ingranaggio) → Le tue app → `</>` Web** → registra l'app e copia la `firebaseConfig`.

## 2. Compila i file
- Incolla i valori in `firebase-config.js`.
- In `firestore.rules` sostituisci `SOSTITUISCI_CON_EMAIL_ADMIN@esempio.it` con la **stessa email** dell'utente creato al punto 1.3 (puoi mettere più email separate da virgola).
- Pubblica le regole: nella console copia/incolla `firestore.rules` in *Firestore → Regole* e premi **Pubblica**.

## 2b. Foto con Cloudinary (gratis, senza carta)
1. Registrati su https://cloudinary.com (piano Free).
2. Dalla Dashboard copia il **Cloud name**.
3. **Settings → Upload → Upload presets → Add upload preset**: *Signing mode* = **Unsigned**, salva e copia il nome del preset.
4. Incolla cloud name e nome preset in `firebase-config.js` (sezione `cloudinary`).
Nota: eliminando una foto dal pannello sparisce dal sito; il file resta nel tuo spazio Cloudinary (puoi cancellarlo da lì).

## 3. Pubblica su Cloudflare Pages
1. Carica questa cartella su GitHub (già fatto) → https://dash.cloudflare.com → **Workers & Pages → Create → Pages → Connect to Git**.
2. Scegli il repository e il branch. **Build command:** vuoto. **Output directory:** `/` (la radice).
3. Deploy. Ogni push aggiorna il sito.
4. In Firebase → Authentication → **Impostazioni → Domini autorizzati** aggiungi il dominio di Cloudflare (`xxx.pages.dev` e il tuo dominio personalizzato).
5. (Consigliato) in Cloudflare Zero Trust puoi proteggere anche `/admin/*` con Access come secondo livello di sicurezza.

## Come si usa il pannello
Vai su `https://IL-TUO-SITO/admin/` ed entra con email e password.
- **Partite**: aggiungi, modifica, elimina. Appaiono nel *Calendario* del sito; con il risultato finiscono in "Ultimi risultati".
- **Foto**: carica una o più foto (vengono ridimensionate); compaiono nella galleria. Se non ce ne sono, il sito mostra quelle in `assets/instagram/`.
- **Messaggi**: ricevi quelli inviati dal modulo "Scrivici un messaggio"; puoi rispondere, segnarli come letti o eliminarli.

## Sicurezza
- Chiunque può **leggere** partite e foto e **inviare** messaggi (con limiti di lunghezza e campo anti‑spam).
- Solo l'email admin può scrivere/eliminare e leggere i messaggi: le regole sono applicate dai server Firebase, non dal sito.
- La `firebaseConfig` non è un segreto.
