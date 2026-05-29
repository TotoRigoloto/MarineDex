// Génération d'UUID v4 compatible React Native (Hermes).
// crypto.randomUUID() n'existe pas dans Hermes, on utilise Math.random().
// Qualité suffisante pour des IDs locaux — pas de use-case crypto-sécurisé.

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
