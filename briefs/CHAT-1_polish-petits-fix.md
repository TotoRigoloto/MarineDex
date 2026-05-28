# Brief Chat 1 — Polish & petits fix

## Contexte

MarineDex est une app Expo/React Native + Supabase pour l'association Revosea.
Le CLAUDE.md à la racine du projet contient toutes les conventions (lis-le en premier).
Ce chat couvre les corrections rapides et petits ajouts qui ne nécessitent pas de refonte.

## Tâches à réaliser (dans cet ordre)

### 1. Cacher l'onglet Explore

- Fichier : `app/(tabs)/_layout.tsx`
- L'onglet `explore` n'est pas déclaré dans le layout actuel (il n'apparaît pas dans les `<Tabs.Screen>`), mais le fichier `app/(tabs)/explore.tsx` existe toujours.
- **Vérifier** que explore est bien caché (ajouter `<Tabs.Screen name="explore" options={{ href: null }} />` s'il est auto-découvert par expo-router).

### 2. Déplacer la Charte du Plongeur dans revosea.tsx

- Le contenu de `explore.tsx` contient la "Charte du Plongeur" (listes TO_DO / TO_AVOID + section "Saviez-vous").
- Intégrer ce contenu dans `app/revosea.tsx` comme une nouvelle section, entre les actions et les stats (ou en fin de page).
- Garder le même rendu visuel (cartes verte/rouge, emojis).

### 3. Mail de confirmation Supabase (lien localhost)

- Quand un nouvel utilisateur s'inscrit, le mail de confirmation contient un lien `localhost:3000`.
- Ce n'est pas côté code app — c'est dans les **paramètres Supabase** (Dashboard > Authentication > URL Configuration > Site URL).
- **Action** : me prévenir qu'il faut changer ça côté Supabase Dashboard (je le ferai moi-même), et proposer un message de bienvenue sympa pour le template email (Supabase > Auth > Email Templates).
- Proposer aussi un écran "email confirmé" ou un deep link de retour dans l'app.

### 4. Message localisation carte plus joli

- Fichier : `app/(tabs)/map.tsx`
- Quand on demande la permission de localisation, le message est brut. Proposer un message plus engageant et en français, expliquant pourquoi on a besoin de la position (pour centrer la carte sur les observations à proximité).

### 5. Filtre carte → redirection pokédex

- Fichier : `app/(tabs)/map.tsx`
- Quand on clique sur un filtre famille (ex: "Cétacé") dans la carte, ça devrait pouvoir aussi rediriger vers le pokédex filtré sur cette famille.
- Proposer un bouton "Voir dans le Pokédex" dans le bottom sheet ou le filtre, qui fait `router.push('/pokedex?family=Cétacé')`.
- Côté pokédex (`app/(tabs)/pokedex.tsx`) : lire le paramètre `family` via `useLocalSearchParams` et pré-remplir le `familyFilter`.

### 6. Bloc niveau de plongée dans le profil

- Fichier : `app/(tabs)/profile.tsx`
- Ajouter un bloc "Niveau de plongée" avec choix entre :
  - PADI : Open Water, Advanced, Rescue, Divemaster, Instructor
  - FFESSM : N1, N2, N3, N4, Initiateur, MF1, MF2
  - Autre / Snorkeling / Apnée
- Stocker dans AsyncStorage via une nouvelle clé dans `STORAGE_KEYS` (ex: `DIVE_LEVEL`).
- Afficher sur le profil avec une carte type badge.

### 7. Lien dans le partage de profil

- Fichier : `services/stats.ts` (fonction `buildShareText`)
- Ajouter un lien vers le site Revosea ou l'app dans le texte de partage.
- Format : "Découvre MarineDex par @Revosea : https://revosea.com"

### 8. Vérifier l'email contact@revosea.com

- Fichier : `app/revosea.tsx` — le champ `email` est déjà à `contact@revosea.com` ✅
- Juste confirmer que c'est bien utilisé partout (settings, legal, etc.).

### 9. Fiabiliser la synchronisation Supabase (tables vides)

**Problème** : les tables `md_trips`, `md_observations`, `md_pokedex` sont vides en prod. Seule `md_profiles` est alimentée (trigger `md_handle_new_user`).

**Diagnostic** :

- `syncAll()` dans `services/sync.ts` sait push trips + observations, mais n'est appelé que **manuellement** depuis le bouton "Synchroniser" de `settings.tsx`. Aucun appel automatique.
- `md_scans` est alimenté en best-effort dans `index.tsx` (scanner IA) — fonctionne si connecté.
- `md_pokedex` n'a **aucun code de sync**. Le pokédex local (espèces découvertes) n'est jamais poussé vers Supabase.

**Actions** :

1. **Sync automatique** : appeler `syncAll()` aux moments clés :
   - Au login (après auth réussie, dans `services/auth.ts` ou `app/_layout.tsx`)
   - Après chaque création/modification de voyage ou observation (dans `logbook.tsx`)
   - Au retour dans l'app (`AppState` change → active)
   - Garder le bouton manuel dans Settings comme fallback
2. **Sync pokédex** : ajouter dans `syncAll()` un push/pull de la table `md_pokedex` (les espèces découvertes par l'utilisateur). Mapper les champs : `user_id`, `species_name`, `discovered`, `discovered_at`.
3. **Vérifier les RLS policies** : s'assurer que les policies `md_trips`, `md_observations`, `md_pokedex` autorisent bien l'INSERT/UPDATE pour `auth.uid() = user_id`. Si les tables sont vides malgré le code, c'est probablement un problème RLS.
4. **Logs de debug** : si la sync échoue silencieusement (try/catch qui avale les erreurs), ajouter un toast ou un indicateur visuel ("Dernière sync : il y a 5 min" / "⚠️ Sync échouée").

## Contraintes

- Respecter les conventions du CLAUDE.md (STORAGE_KEYS, services/, haptics, etc.)
- Pas de nouvelles dépendances
- Chaque tâche = un commit logique (me laisser commit entre chaque)
