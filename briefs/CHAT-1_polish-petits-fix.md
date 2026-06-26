# Chat 1 — Polish & petits fix — RÉSULTAT

## Contexte

Ce chat a traité 9 corrections/ajouts rapides sur MarineDex (Expo/RN + Supabase).
Toutes les tâches ont été réalisées et commitées. Voici le statut de chaque point.

---

### 1. Cacher l'onglet Explore — ✅ FAIT

**Fichier modifié :** `app/(tabs)/_layout.tsx`

Ajout de `<Tabs.Screen name="explore" options={{ href: null }} />` avant la fermeture du `<Tabs>`. Le fichier `explore.tsx` existe toujours mais n'apparaît plus dans la tab bar.

**Note :** `explore.tsx` n'a pas été supprimé — il peut l'être dans un futur nettoyage, son contenu a été migré (voir point 2).

---

### 2. Déplacer la Charte du Plongeur dans revosea.tsx — ✅ FAIT

**Fichier modifié :** `app/revosea.tsx`

- Ajout des constantes `CHARTE_TO_DO`, `CHARTE_TO_AVOID`, `CHARTE_ARTICLES` en haut du fichier.
- Nouvelle section "Charte du Plongeur" insérée entre les Actions et l'Équipe : deux cartes verte/rouge (grille 2 colonnes, icônes cerclées, overlay 🚫 sur les items à éviter).
- Section "Comprendre pour mieux protéger" avec les articles GuardianMap + bouton vers le site.
- Styles dédiés (`charte*`, `article*`, `websiteBtn*`) ajoutés.

**Note :** les URLs des articles GuardianMap pointent vers `https://guardianmap.com/blog` (placeholder générique hérité de `explore.tsx`). À remplacer par les URLs exactes quand disponibles.

---

### 3. Mail de confirmation Supabase (lien localhost) — ✅ CONSEILS DONNÉS (pas de code modifié)

Pas de modification code — c'est de la config Supabase Dashboard.

**Ce qui a été fourni :**
- Instruction de changer **Site URL** dans Authentication > URL Configuration (remplacer `localhost:3000` par le scheme de l'app ou `https://revosea.com`).
- Template email de bienvenue proposé (sujet : "Bienvenue dans MarineDex 🐬", corps avec `{{ .ConfirmationURL }}`).
- Deux options pour l'écran "email confirmé" : page web simple (🟢 facile) ou deep link Expo complet (🟠 moyen). Aucune n'a été implémentée.

**Reste à faire :**
- Appliquer le template dans Supabase Dashboard > Auth > Email Templates.
- Changer le Site URL.
- Optionnel : implémenter le deep link de retour (`marinedex://auth/callback`) pour une meilleure UX post-confirmation.

---

### 4. Message localisation carte plus joli — ✅ FAIT

**Fichier modifié :** `app/(tabs)/map.tsx`

- Ajout d'un **pré-prompt Alert** convivial avant le dialogue système, uniquement si la permission n'a jamais été demandée (`undetermined`). Message en français expliquant pourquoi (centrer la carte, MPA à proximité) + rassurance vie privée.
- **Message de refus** informatif si la permission est refusée (renvoie vers les réglages).
- Import `Alert` ajouté.

---

### 5. Filtre carte → redirection pokédex — ✅ FAIT

**Fichiers modifiés :** `app/(tabs)/map.tsx`

- Ajout d'un bouton "📖 Voir les {famille}s dans le Pokédex" dans le modal filtres de la carte, visible uniquement quand un filtre famille est actif.
- Navigation vers `/pokedex?family=...` avec `encodeURIComponent`.
- Styles `pokedexLink` / `pokedexLinkTxt` ajoutés.

**Côté pokédex** (`app/(tabs)/pokedex.tsx`) : aucune modification nécessaire — le deep-link `family` était déjà câblé via `useLocalSearchParams` + `useEffect` qui pré-remplit `familyFilter` et ouvre le sheet automatiquement.

---

### 6. Bloc niveau de plongée dans le profil — ✅ FAIT

**Fichiers modifiés :** `constants/Storage.ts`, `app/(tabs)/profile.tsx`

- Nouvelle clé `STORAGE_KEYS.DIVE_LEVEL` ("user_dive_level").
- Constante `DIVE_LEVELS` : PADI (5 niveaux), FFESSM (7 niveaux), Autre (Snorkeling, Apnée, SSI, CMAS, Autre).
- Carte badge entre les stats et le streak : affiche le niveau actuel avec icône 🤿, ou "Non renseigné" + CTA "Choisir".
- Modal picker organisé par organisme, avec highlight du niveau actif et option "Retirer le niveau".
- Format stocké : `"PADI — Advanced"`, `"FFESSM — N2"`, etc.
- Haptics : `H.success()` au choix, `H.tapLight()` au retrait.

**Note :** le niveau de plongée n'est pas encore synchro avec Supabase (pas de colonne correspondante dans `md_profiles`). À ajouter si besoin.

---

### 7. Lien dans le partage de profil — ✅ FAIT

**Fichier modifié :** `services/stats.ts`

Dernière ligne de `buildShareText` changée de `"Rejoins-moi sur MarineDex 🤿"` à `"Découvre MarineDex par @Revosea : https://revosea.com"`.

---

### 8. Vérifier l'email contact@revosea.com — ✅ VÉRIFIÉ (aucune modification)

Audit complet des occurrences :
- `app/revosea.tsx` → `contact@revosea.com` ✅
- `app/legal/terms.tsx` → `CONTACT_EMAIL = "contact@revosea.com"` ✅
- `app/legal/privacy.tsx` → `CONTACT_EMAIL = "contact@revosea.com"` ✅
- `app/legal/about.tsx` → lien vers `revosea.com` ✅
- `app/settings.tsx` → affiche l'email de l'utilisateur (normal) ✅

Cohérent partout, rien à modifier.

---

### 9. Fiabiliser la synchronisation Supabase — ✅ FAIT

C'était la tâche la plus lourde. 4 sous-actions traitées :

#### 9a. Sync automatique — ✅

**Fichiers modifiés :** `app/_layout.tsx`, `app/(tabs)/logbook.tsx`, `app/(tabs)/index.tsx`

- **`_layout.tsx`** : nouveau hook `useAutoSync()` — sync au montage (= après login) + au retour dans l'app (`AppState` background → active). Imports ajoutés : `AppState`, `AppStateStatus`, `useRef`, `syncAll`.
- **`logbook.tsx`** : `syncAll()` appelé fire-and-forget après sauvegarde d'observation et après sauvegarde de voyage.
- **`index.tsx`** : `syncAll()` appelé fire-and-forget après un scan IA réussi (pokédex + obs).
- Le bouton manuel dans Settings reste en place comme fallback.

#### 9b. Sync pokédex — ✅

**Fichier modifié :** `services/sync.ts`

- Import de `Animal` + `initialAnimals`.
- Type `DbPokedexEntry` ajouté, aligné sur le schéma réel de la table (`user_id`, `species_name`, `first_observed_at` — pas de colonne `discovered` booléenne).
- `syncAll()` lit maintenant `STORAGE_KEYS.POKEDEX` dans le multiGet.
- Push : upsert des espèces découvertes dans `md_pokedex` (conflit sur `user_id,species_name`, `ignoreDuplicates: true` pour ne pas écraser `first_observed_at`).
- Pull : récupère les espèces cloud et marque comme découvertes celles qui manquent en local.
- Persistance du pokédex mergé + `LAST_SYNC_AT` écrit automatiquement à chaque sync réussie.
- `SyncResult` enrichi avec `pushedPokedex` / `pulledPokedex`.

#### 9c. Vérification RLS — ✅ VÉRIFIÉ MANUELLEMENT

- `md_trips` : 4 policies (SELECT, INSERT, UPDATE, DELETE) owner-only ✅
- `md_observations` : 4 policies (SELECT, INSERT, UPDATE, DELETE) owner-only ✅
- `md_dives` : 1 policy ALL owner-only ✅
- `md_pokedex` : policy ALL ajoutée manuellement dans le Dashboard (`auth.uid() = user_id`) ✅
- Contrainte UNIQUE `(user_id, species_name)` ajoutée sur `md_pokedex` pour que l'upsert fonctionne ✅

**Conclusion RLS** : les tables étaient vides en prod non pas à cause de policies manquantes, mais parce que `syncAll()` n'était jamais appelé automatiquement.

#### 9d. Indicateur visuel sync — ✅ PARTIEL

**Fichier modifié :** `app/settings.tsx`

- Le message Alert de sync manuelle inclut maintenant les compteurs pokédex.
- `LAST_SYNC_AT` est écrit automatiquement par `syncAll()` (plus besoin de le faire manuellement dans settings).
- Pas de toast/banner permanent type "Dernière sync : il y a 5 min" ajouté — juste les logs console en cas d'échec auto-sync. À enrichir si besoin (🟢 facile).

---

## Fichiers modifiés — récapitulatif

| Fichier | Tâches |
|---|---|
| `app/(tabs)/_layout.tsx` | 1 |
| `app/revosea.tsx` | 2 |
| `app/(tabs)/map.tsx` | 4, 5 |
| `app/(tabs)/pokedex.tsx` | _(déjà câblé, rien modifié)_ |
| `app/(tabs)/profile.tsx` | 6 |
| `app/(tabs)/logbook.tsx` | 9a |
| `app/(tabs)/index.tsx` | 9a |
| `app/_layout.tsx` | 9a |
| `app/settings.tsx` | 9d |
| `constants/Storage.ts` | 6 |
| `services/stats.ts` | 7 |
| `services/sync.ts` | 9b |

## Points restants / à surveiller pour la suite

1. **Supprimer `explore.tsx`** quand on est sûr que le contenu migré dans `revosea.tsx` convient.
2. **Template email Supabase** + **Site URL** : config Dashboard à appliquer (point 3).
3. **Deep link retour après confirmation email** : pas implémenté.
4. **URLs articles GuardianMap** : placeholders à remplacer par les vraies URLs.
5. **Sync du niveau de plongée** (`DIVE_LEVEL`) vers Supabase : pas de colonne dans `md_profiles` pour l'instant.
6. **Indicateur visuel de sync** (banner/toast) : seulement des logs console pour l'instant, pas de feedback UI permanent.
7. **Les 13 TODO dans `revosea.tsx`** (slogan, description, actions, stats, équipe, lien MarineDex×Revosea) restent à remplir.
8. **`privacy.tsx` et `terms.tsx`** : templates à faire valider par un juriste (mentionné dans CLAUDE.md).
9. **URL backend IA** : toujours en dur, à externaliser dans `app.json → extra.aiUrl`.
