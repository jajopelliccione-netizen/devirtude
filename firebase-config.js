// ============================================================
//  CONFIGURAZIONE FIREBASE
//  Incolla qui i dati del tuo progetto:
//  Console Firebase > Impostazioni progetto > Le tue app > App web > "Configurazione SDK"
//  (Questi dati NON sono segreti: la sicurezza è nelle regole Firestore/Storage.)
// ============================================================
export const firebaseConfig = {
  apiKey: "AIzaSyBqbUWbniNp6LLO_EIaspsiWn_GPmjZxeU",
  authDomain: "devirtude-d1a3b.firebaseapp.com",
  projectId: "devirtude-d1a3b",
  storageBucket: "devirtude-d1a3b.firebasestorage.app",
  messagingSenderId: "786023585384",
  appId: "1:786023585384:web:23092392108b7f85db8ddd"
};

export const configurato = !String(firebaseConfig.apiKey).startsWith("INSERISCI");

// ============================================================
//  FOTO: Cloudinary (gratis, senza carta)
//  1. Registrati su https://cloudinary.com  2. Dashboard: copia il "Cloud name"
//  3. Settings > Upload > Upload presets > Add: "Signing mode" = Unsigned, nome a piacere
// ============================================================
export const cloudinary = {
  cloudName: "ghckrc9u",
  uploadPreset: "devirtude"
};
