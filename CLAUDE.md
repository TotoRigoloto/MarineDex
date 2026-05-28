# Instructions pour Claude — Projet MarineDex

## 🎯 Contexte
MarineDex est l'application compagnon de l'association **Revosea** : carnet
d'exploration marine avec identification IA, journal d'observations,
storyboards de voyage, carte interactive, et gamification (badges, streak,
profil partageable).

Stack : Expo + React Native, expo-router (typedRoutes activés), Supabase,
TypeScript strict, AsyncStorage. Backend ML en FastAPI + TensorFlow/Keras.

## 🏗️ Architecture & conventions de code

### Organisation des fichiers
- `app/` — écrans (expo-router file-based routing)
- `app/(tabs)/` — onglets bottom bar
- `app/legal/` — pages légales (privacy, terms, about)
- `app/trip/[id].tsx` — détail voyage dynamique
- `components/` — composants réutilisables (préfixe kebab-case)
- `services/` — logique métier extraite (supabase, auth, sync, haptics,
  stats, weather, mpa, share-card)
- `constants/` — `MarineData.ts` (encyclopédie marine), `Storage.ts` (clés
  AsyncStorage centralisées + avatars)
- `backend/` — serveur ML Python

### Règles de propreté du code
1. **Toujours utiliser `STORAGE_KEYS`** depuis `constants/Storage.ts`. Aucun
   string AsyncStorage en dur dans les composants.
2. **Logique métier hors des composants** : si une fonction fait plus que du
   render/state, elle va dans un fichier `services/*.ts`.
3. **try/catch sur tous les fetch externes** + fallback gracieux (toast,
   alert, ou null silencieux).
4. **`useMemo` pour toute liste filtrée/triée** et `useCallback` quand passé
   en prop ou utilisé dans `useFocusEffect`.
5. **Pas de dépendances inutiles** — privilégier RN core (Share, Animated,
   FlatList) avant d'ajouter une lib.
6. **Composants extraits** : un `StatBox`, `Chip`, `GoalRow` quand on répète
   le même JSX 3 fois ou plus.
7. **Commentaires en français** au-dessus des blocs complexes.

### TypeScript
- Mode strict activé.
- `as any` autorisé seulement pour les routes typées Expo Router (limitation
  connue avec `router.push(\`/trip/${id}\`)`).
- Pas de `@ts-ignore`.

## 🎨 Conventions UI

### Thème
- Couleur principale : `#006994` (bleu marine).
- Accents : `#0288D1` (bleu lagon), `#FFB300` (or — actions primaires sur
  fond sombre), `#FF6F00` (streak actif), `#dc3545` (destructif), `#43A047`
  (succès).
- Fond app : `#f0f8ff`.
- Splash / login : dégradé `#001a2c` → `#006994`.
- **Pas de dark mode** pour l'instant (décision explicite).

### Composants partagés à utiliser
- `EmptyState` pour tous les états vides (avec emoji + sous-titre + CTA).
- `SkeletonList` pour le chargement initial des FlatList.
- `ErrorBoundary` wrap déjà au root, ne pas le recréer ailleurs.
- `H.*` (haptics) sur toutes les actions importantes :
  - `H.success()` sauvegarde réussie, identification IA, signup, déblocage badge
  - `H.error()` erreur réseau, validation
  - `H.warning()` confirmation destructive
  - `H.tapLight()` sélection, ouverture sheet
  - `H.tapMedium()` confirmation neutre
  - `H.tapHeavy()` actions importantes (partage, suppression confirmée)

### Navigation
- Routes typées Expo Router. Pour les routes dynamiques :
  `router.push(\`/trip/${id}\` as any)` (le `as any` est nécessaire).
- Le tab bar est défini dans `app/(tabs)/_layout.tsx` — pour cacher une route
  auto-découverte : `<Tabs.Screen name="X" options={{ href: null }} />`.

## ☁️ Supabase

**Projet** : `giibfmhllophrouifedj` (RevoSea, eu-west-3).

### Tables app (préfixe `md_`)
- `md_profiles`, `md_trips`, `md_observations`, `md_scans`, `md_pokedex`
- Toutes en **RLS owner-only** via `auth.uid() = user_id`
- Trigger `md_handle_new_user` crée le profil à l'inscription

### Tables RÉSERVÉES — NE PAS UTILISER dans l'app
- `bdd_especes_marines` — exclusivement pour le site revosea.com
- `bdd_centres_plongees` — exclusivement pour le site revosea.com
- `bdd_observation` — exclusivement pour le site revosea.com

### Tables AUTORISÉES en lecture
- `bdd_zones_protegees` (aires marines protégées, utilisée pour l'overlay carte)

### Storage
- Bucket `md-photos`, public en lecture, écriture limitée à
  `{user_id}/...` via policies.

## 📱 Production-readiness

### App.json
- Bundle IDs : `com.revosea.marinedex` (iOS + Android)
- Permissions iOS (`infoPlist`) et Android (`permissions[]`) avec
  descriptions FR
- Plugins `expo-image-picker`, `expo-location`, `expo-splash-screen`
  configurés
- Supabase URL/key dans `extra`

### Avant publication store
- Remplir les 13 placeholders `TODO` dans `app/revosea.tsx`
- Faire valider les templates `app/legal/privacy.tsx` et `terms.tsx` par
  un juriste
- Externaliser l'URL backend IA dans `app.json → extra.aiUrl`
- Décider du sort de `app/(tabs)/explore.tsx` (déclarer ou cacher)

### Sécurité
- Boutons DEV (reset complet, debug info) toujours wrappés par `__DEV__`
- Error Boundary global déjà en place
- Permissions demandées juste-à-temps (au moment de l'usage)

## 🤝 Manière de bosser ensemble (préférences perso)

1. **Une tâche à la fois.** Quand tu démarres un gros morceau, tu maintiens
   la to-do list (TaskCreate/TaskUpdate) et tu t'arrêtes à la fin de chaque
   tâche pour me laisser commit + push. Tu attends mon "tu peux continuer"
   avant d'enchaîner.

2. **Récap clair avant chaque pause.** À la fin de chaque tâche, tu fournis
   un récap structuré : fichiers modifiés, ce qui a changé, et pourquoi.
   Format prose + bullets ciblés, pas de noyer dans les détails.

3. **Si je corrige une partie moi-même** (ex: scrollview, imports), tu ne
   touches plus à ce bloc — sauf si je te le demande explicitement.

4. **Tu peux me poser des questions** quand c'est critique (creds, scope,
   format de livrable), via `AskUserQuestion`. Sinon tu décides et tu
   m'expliques.

5. **Quand tu suggères des features**, classe-les par impact/effort (🟢
   facile / 🟠 moyen / 🔴 gros chantier) et indique tes recommandations
   prioritaires.

6. **Vérification finale systématique** avant de clore un gros chantier :
   structure, imports, routes, STORAGE_KEYS, permissions, try/catch.

7. **Code propre > code rapide.** Tu prends le temps de structurer, extraire
   les services, mémoriser, plutôt que de copier-coller.

8. **Pas de blabla inutile.** Tu vas droit au but, tu donnes les diff
   concrets, et tu réserves les explications longues pour quand je les
   demande explicitement.

## 🛠️ Commandes utiles

```bash
# Lancer l'app
npx expo start

# Le backend IA (depuis /backend)
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Entraîner un nouveau modèle
python backend/train_model.py --dataset ./dataset
```