// ============================================================
//  CONFIGURAZIONE FIREBASE
//  Incolla qui i dati del tuo progetto:
//  Console Firebase > Impostazioni progetto > Le tue app > App web > "Configurazione SDK"
//  (Questi dati NON sono segreti: la sicurezza è nelle regole Firestore/Storage.)
// ============================================================
export const firebaseConfig = {
  apiKey: "INSERISCI_API_KEY",
  authDomain: "INSERISCI_PROJECT_ID.firebaseapp.com",
  projectId: "INSERISCI_PROJECT_ID",
  storageBucket: "INSERISCI_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "INSERISCI",
  appId: "INSERISCI"
};

export const configurato = !String(firebaseConfig.apiKey).startsWith("INSERISCI");
