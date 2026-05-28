# Brief Chat 3 — Pokédex repensé + images Supabase

## Contexte
MarineDex est une app Expo/React Native + Supabase pour l'association Revosea.
Le CLAUDE.md à la racine du projet contient toutes les conventions (lis-le en premier).
Ce chat couvre le redesign UX du pokédex et la migration des images vers Supabase avec cache offline.

## État actuel du Pokédex
- Fichier : `app/(tabs)/pokedex.tsx` (~550 lignes)
- Filtres actuels (tous visibles en permanence, empilés verticalement) :
  1. Barre de recherche
  2. Statut : Tout / Trouvés / À voir (3 boutons)
  3. Tri : A-Z / Rareté / Famille / Trouvés d'abord (scroll horizontal)
  4. Familles : Toutes / Requin / Tortue / etc. (scroll horizontal)
  5. Océans : Monde / Atlantique / Pacifique / etc. (scroll horizontal)
- **Problème** : 5 rangées de filtres prennent ~180px avant de voir le premier animal. C'est trop.

## Tâches à réaliser

### 1. Refonte UX des filtres (inspiration Pokémon GO)
**Objectif** : filtres compacts, la liste d'espèces doit dominer l'écran.

**Proposition recommandée** (à discuter avec le user) :
- **Garder visible** : barre de recherche + barre de tri compacte (icônes seules, pas de texte)
- **Bouton flottant "Filtres"** (FAB en bas à droite) qui ouvre un bottom sheet avec :
  - Statut (Tout / Trouvés / À voir)
  - Famille (chips sélectionnables)
  - Océan (chips sélectionnables)
  - Bouton "Appliquer" + "Réinitialiser"
  - Badge sur le FAB indiquant le nombre de filtres actifs
- S'inspirer de Pokémon GO : cards arrondies, silhouette grisée pour les non-découverts, animations subtiles
- Penser au composant `react-native-gesture-handler` BottomSheet ou un simple `Modal` animé depuis le bas

**Points UX à améliorer** :
- Cards plus visuelles : image plus grande, nom centré sous l'image
- Silhouette noire/grisée pour les non-découverts (comme Pokémon GO) plutôt que juste une opacité réduite
- Compteur filtré visible : "12 / 47 espèces" au lieu de juste le total

### 2. Images depuis Supabase Storage (avec cache offline)
**Contexte** : les images sont actuellement en `require("../assets/images/animals/xxx.png")` dans `MarineData.ts`.
Un bucket Supabase `species-assets` existe avec toutes les photos :
`https://giibfmhllophrouifedj.supabase.co/storage/v1/object/public/species-assets/anemone_magnifique.png`

**Stratégie hybride online/offline** :
- **Garder les images locales** comme fallback (elles sont déjà bundlées dans l'app)
- **Charger les images Supabase** quand le réseau est disponible (meilleure qualité, mises à jour sans rebuild)
- **Cache local** : utiliser `expo-file-system` pour cacher les images téléchargées sur le device
- Le type `Animal` aurait : `image` (require local) + `remoteImageUrl` (URL Supabase)
- Le composant d'image fait : `remoteImageUrl` en priorité → cache local → fallback `image` bundlée

**Implémentation suggérée** :
- Créer un service `services/image-cache.ts` :
  - `getCachedImage(speciesKey: string): string | null` — retourne le path local si caché
  - `cacheImage(speciesKey: string, url: string): Promise<string>` — télécharge et retourne le path
  - `getImageSource(animal: Animal): ImageSource` — logique de résolution (cache > remote > local)
- Créer un composant `components/species-image.tsx` qui encapsule cette logique
- Pattern de nommage Supabase : `species-assets/{snake_case_name}.png`

**Use case mer/plage** :
- En plongée : pas de réseau → les images locales bundlées s'affichent (pas de chargement)
- Sur la plage avec 4G : les images Supabase (potentiellement plus belles/à jour) se chargent et se cachent
- Retour en plongée : les images cachées sont utilisées
- C'est la meilleure approche car ça ne pénalise jamais l'utilisateur offline

### 3. Lien carte → pokédex filtré
- Quand on arrive sur le pokédex avec un paramètre `?family=Cétacé` (depuis la carte), pré-appliquer le filtre famille.
- Utiliser `useLocalSearchParams` pour lire le paramètre.
- Si le nouveau système de filtres utilise un bottom sheet, ouvrir directement le sheet avec le filtre pré-appliqué.

## Contraintes
- Pas de nouvelle lib lourde (pas de `@gorhom/bottom-sheet` sauf si déjà installé — vérifier le package.json). Un `Modal` animé suffit.
- Les images locales restent dans le bundle comme fallback — ne pas les supprimer
- `expo-file-system` est probablement déjà installé (vérifier), sinon c'est une dépendance légère et justifiée
- Respecter CLAUDE.md : STORAGE_KEYS, services/, haptics, composants extraits, etc.
