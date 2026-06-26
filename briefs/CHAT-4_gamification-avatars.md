# Bilan Chat 4 — Gamification adaptative + avatars composables

> Document de handoff pour le prochain chat. Lis `CLAUDE.md` à la racine en premier — il contient toutes les conventions (stack, structure, règles de code).

---

## Fichiers touchés en Chat 4

| Fichier | Statut | Résumé |
|---|---|---|
| `services/stats.ts` | ✏️ Refonte | Modes adaptatifs, streak multi-mode, objectifs par section |
| `constants/FunFacts.ts` | 🆕 Créé | 100 fun facts, `getDailyFact()`, `todayKey()` |
| `constants/AvatarData.ts` | 🆕 Créé | Types, options, conditions de lock, `isUnlocked()` |
| `components/avatar-display.tsx` | 🆕 Créé | Rendu SVG 7 calques |
| `components/avatar-builder.tsx` | 🆕 Créé | Éditeur plein écran 5 onglets, preview live |
| `constants/Storage.ts` | ✏️ Modifié | +`USER_MODE`, +`SAVAISTHON_DATES`, +`AVATAR_CONFIG` |
| `app/(tabs)/index.tsx` | ✏️ Modifié | Carte "Le savais-thon" |
| `app/(tabs)/profile.tsx` | ✏️ Modifié | Avatar SVG, chip mode, streak adaptée, goal sections |
| `app/login.tsx` | ✏️ Modifié | Step "mode" dans l'onboarding |
| `package.json` | ✏️ Modifié | `react-native-svg` déclaré explicitement |

---

## Tâche 1 — Modes utilisateur adaptatifs ✅

**Brief** : 3 modes (citadin / côtier / régulier) avec streak et objectifs adaptés. Choix explicite recommandé, auto-détection en v2.

**Ce qui a été fait :**
- `UserMode = "city" | "coastal" | "regular"` dans `services/stats.ts` avec `USER_MODE_LABELS` et `USER_MODE_DESCRIPTIONS`
- `computeStreak()` refondu : city = voyages cumulés (non consécutifs), coastal = mois consécutifs, regular = semaines consécutives (comportement original préservé → rétro-compatible, défaut "regular" si clé absente)
- `computeGoals()` → `GoalSection[]` : city = trimestriel, coastal = mensuel, regular = hebdo + mensuel
- Mode stocké dans `STORAGE_KEYS.USER_MODE`
- Chip cliquable dans le header du profil → modal de sélection
- Step "mode" ajoutée dans `app/login.tsx` : apparaît après signup (avec session) et après "continueOffline", pas après signin (l'utilisateur existant garde son mode stocké)

**Non fait (intentionnel) :** détection automatique du rythme sur 3 mois — reportée en v2.

---

## Tâche 2 — Le savais-thon 🐟 ✅

**Brief** : fun fact marin quotidien, déterministe (même fact pour tous), compte pour le streak, 100 facts au lancement.

**Ce qui a été fait :**
- `constants/FunFacts.ts` : 100 faits marins en français, `getDailyFact()` = `FUN_FACTS[dayOfYear % 100]`, `todayKey()` → `YYYY-MM-DD`
- `STORAGE_KEYS.SAVAISTHON_DATES` : `string[]` des dates validées
- Carte interactive dans `app/(tabs)/index.tsx` : emoji + texte + bouton "J'ai appris !", bordure bleue → verte après validation, `H.success()` au clic
- `savaisthonDates` passé à `computeStreak()` comme 4e paramètre : compte pour coastal (mois) et regular (semaines), **ignoré pour city** (dont la streak est voyage-based)

---

## Tâche 3 — Avatars composables ✅

**Brief** : système de calques SVG style Pokémon GO, éditeur par catégorie, stockage JSON, `react-native-svg`.

**Ce qui a été fait :**
- `constants/AvatarData.ts` : types `AvatarConfig`, `LockCondition`, `AvatarOption`, `ColorOption` ; toutes les options (peau ×6, style cheveux ×6, couleur cheveux ×6, visage ×5, tenue ×5, couleur tenue ×8, accessoire ×5) ; helpers `getSkinColor/getHairColor/getOutfitColor/isUnlocked`
- `DEFAULT_AVATAR_CONFIG` : config par défaut
- `components/avatar-display.tsx` : 7 couches SVG (corps, tenue, cheveux-arrière, tête+oreilles, visage, cheveux-avant, accessoire), ViewBox 100×100, 5 expressions de visage, 5 styles de tenue avec variantes de col
- `components/avatar-builder.tsx` : modal plein écran, 5 onglets, preview live 140px, `ColorPicker` (pastilles) + `OptionPicker` (chips), bouton reset
- `STORAGE_KEYS.AVATAR_CONFIG` (JSON) ; anciens `AVATAR_PRESETS` conservés dans `Storage.ts`
- Profil : avatar SVG remplace l'emoji, tap → ouvre builder

**Limitation connue :** les SVG sont un squelette technique fonctionnel (shapes simples). Le rendu final nécessite un passage graphiste (Figma → paths propres). L'architecture est prête pour le swap sans toucher aux interfaces.

---

## Tâche 4 — Déblocage d'items par badges/XP ✅

**Brief** : masque → badge "Première Bulle", combi intégrale → Dive Master (3 000 XP), casquette Revosea → 5 voyages. Cadenas visible sur les items non débloqués.

**Ce qui a été fait :**
- `isUnlocked(lock, userXp, userTrips, unlockedBadgeIds)` centralisé dans `AvatarData.ts`
- Locks : `{ type: "badge", value: "first_dive" }` (masque) | `{ type: "xp", value: 3000 }` (combi intégrale) | `{ type: "trips", value: 5 }` (casquette Revosea)
- UI : opacité 0.5 + 🔒 + hint orange italic (`lockedBy.label`), `H.warning()` au tap
- `unlockedBadgeIds` = `useMemo` dans `profile.tsx` extrait de `badgesWithProgress.filter(b => b.unlocked).map(b => b.id)`
- `AvatarBuilder` reçoit `userXp`, `tripCount={trips.length}`, `unlockedBadgeIds` — câblage vérifié correct

**Pour tester les locks :**
- Masque → 1 observation (badge "Première Bulle" se débloque)
- Casquette → 5 voyages créés
- Combi intégrale → ~30 obs (1 500 XP) + 5 voyages (1 000 XP) + quelques espèces découvertes

---

## Roadmap — au-delà du Chat 4

Ce qui n'a pas été traité et qui mérite d'être adressé à terme. Classé par impact/effort.

### 🟢 Facile / quick wins

- **Savaisthon dans les stats de profil** : ajouter le nombre de savaisthons validés dans les `StatBox` ou comme stat séparée
- **Step dive level à l'onboarding** : `DIVE_LEVEL` existe et se saisit dans le profil, mais n'est pas demandé à l'onboarding — step optionnelle facile à ajouter à `login.tsx` après "mode"
- **explore.tsx** : l'onglet existe mais est masqué via `href: null` dans `_layout.tsx` — décider de le construire ou le supprimer (mentionné dans CLAUDE.md)
- **`buildShareText` multi-mode** : le texte de partage utilise `streakCount` + `streakUnit` mais le message n'est pas vraiment adapté aux 3 modes — petit polish éditorial
- **Snorkel et lunettes de nage non verrouillés** : les 2 accessoires intermédiaires sont accessibles dès le départ. Peut rester ainsi ou recevoir de petits locks (ex : 1 observation).

### 🟠 Moyen

- **Animation de badge débloqué** : aucun feedback visuel quand un badge passe à l'état "unlocked" pour la première fois. Ajouter une modal de célébration déclenchée au moment où `badgesWithProgress` change → `H.success()` + texte festif
- **Share card visuelle avec avatar SVG** : `buildShareText` est du texte pur. `react-native-view-shot` est déjà dans `package.json` — générer une image PNG de la card profil (avatar SVG inclus) à partager via `Share.share`
- **Mode auto-évolutif (v2)** : l'app détecte le rythme sur 3 mois et propose de changer de mode. L'architecture est prête (`computeStreak` paramétrique, mode en storage) ; il manque la logique de détection + la modal de proposition
- **Savaisthon visible depuis le profil** : aujourd'hui uniquement sur l'onglet Scanner. Le dupliquer ou le lier depuis le profil améliorerait la découvrabilité pour les non-photographes
- **Streak freeze / jours de grâce** : permettre de geler sa streak (1 freeze/mois par exemple) pendant des vacances — important pour la rétention, surtout en mode "regular"
- **Polish SVG avatars** : remplacer les shapes basiques actuels par des assets Figma propres. L'architecture ne change pas — seuls les internals des composants `avatar-display.tsx` (les `Path`/`Ellipse` etc.) sont à swapper

### 🔴 Gros chantier

- **Publication store** : 13 TODOs dans `app/revosea.tsx`, validation juridique `privacy.tsx` + `terms.tsx`, externaliser `aiUrl` dans `app.json → extra`, décider du sort de `explore.tsx` (CLAUDE.md liste tout en détail)
- **Notifications push** : rappel quotidien savaisthon, alerte streak en danger (J-1 avant rupture). Nécessite `expo-notifications` + backend (Supabase Edge Function ou service tiers)
- **Sync avatar vers Supabase** : `AvatarConfig` est actuellement locale (AsyncStorage uniquement). L'ajouter dans `md_profiles` pour la retrouver sur un nouvel appareil — migration à prévoir pour les utilisateurs existants
- **Challenges saisonniers** : badges liés à des périodes spéciales (Journée Mondiale des Océans le 8 juin, été, etc.) — extension naturelle du système `BadgeDef`
- **Leaderboard / aspect social** : comparaison entre membres Revosea — nécessite table Supabase publique, profils opt-in, gestion vie privée
- **Tests automatisés** : zéro test dans l'app. Priorité minimale : Jest sur `services/stats.ts` (computeStreak, computeGoals) avant publication store

---

## TODOs CLAUDE.md — état actuel

| Item | Statut |
|---|---|
| 13 placeholders dans `app/revosea.tsx` | ❌ |
| Validation légale `privacy.tsx` + `terms.tsx` | ❌ |
| Externaliser `aiUrl` dans `app.json → extra` | ❌ |
| Décider du sort de `explore.tsx` | ❌ |
| Polish graphiste des SVG d'avatar | ⚠️ Squelette en place, assets à faire |
| Mode auto-évolutif (v2) | ⚠️ Architecture prête, logique non écrite |
