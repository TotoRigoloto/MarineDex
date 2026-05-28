# Brief Chat 2 — Voyages multi-pays, plongées & carte Strava

## Contexte
MarineDex est une app Expo/React Native + Supabase pour l'association Revosea.
Le CLAUDE.md à la racine du projet contient toutes les conventions (lis-le en premier).
Ce chat couvre l'enrichissement du système de voyages et l'introduction du concept de "plongée" comme couche intermédiaire entre voyage et observation.

## État actuel
- `app/(tabs)/logbook.tsx` : gestion voyages + observations, un voyage = un pays + un océan
- `app/trip/[id].tsx` : détail voyage avec onglets (overview/timeline/galerie) + mini-carte + export PNG
- `components/shareable-trip-card.tsx` : carte de partage statique
- `constants/MarineData.ts` : types `Trip` et `Observation`, `COUNTRY_COORDINATES` (pays → océans → coords), `GEOGRAPHY_DB` (pays → liste d'océans)
- **Problème UX actuel** : à chaque nouvelle observation, il faut re-saisir la date, le lieu, la profondeur, la durée, la météo… même si on fait 5 observations sur la même plongée du matin. C'est répétitif et pénible.

## Tâches à réaliser

### 0. Nouveau concept : la Plongée (Dive)
**C'est LE changement structurel de ce chat.** On introduit une entité intermédiaire entre Voyage et Observation.

**Hiérarchie actuelle** : Voyage → Observation (1 voyage contient N observations)
**Nouvelle hiérarchie** : Voyage → Plongée → Observation

**Qu'est-ce qu'une Plongée ?**
Une session dans l'eau (plongée bouteille, snorkeling, apnée, balade sur la plage). Elle regroupe les paramètres communs à toutes les observations faites pendant cette session :
- Date
- Moment de la journée (matin, après-midi, coucher de soleil, nuit)
- Lieu (pays, océan, coordonnées GPS)
- Conditions : profondeur max, durée, visibilité, température, météo (auto-pull)
- Rattachement à un voyage (optionnel)

**Type `Dive` à créer dans `MarineData.ts`** :
```typescript
interface Dive {
  id: string;
  tripId?: string;        // optionnel — une plongée peut être hors voyage
  date: string;           // DD/MM/YYYY
  timeOfDay: 'morning' | 'afternoon' | 'sunset' | 'night';
  country: string;
  ocean: string;
  latitude?: number;
  longitude?: number;
  depthMax?: number;      // mètres
  durationMin?: number;   // minutes
  visibilityM?: number;
  waterTempC?: number;
  weather?: string;       // emoji météo auto-pull
  notes?: string;
  createdAt: number;
}
```

**L'observation devient plus légère** :
```typescript
interface Observation {
  id: string;
  diveId?: string;        // NOUVEAU — rattachement à une plongée
  tripId?: string;        // gardé pour rétro-compat et pour les obs hors plongée
  speciesName: string;
  userPhoto?: string;
  notes?: string;
  // Les champs date, location, ocean, depth, etc. sont hérités de la Dive
  // Gardés en fallback pour les observations sans plongée (rétro-compat)
  date: string;
  location: string;
  ocean: string;
  latitude?: number;
  longitude?: number;
}
```

**Flux UX — la flexibilité totale** :
Le principe : peu importe d'où l'utilisateur vient, tout communique.

- **Depuis un voyage** : "Nouvelle plongée" ou "Nouvelle observation" directement
  - "Nouvelle plongée" → crée la Dive (date, moment, conditions) → puis "Ajouter une observation" à cette plongée
  - "Nouvelle observation" → propose de la rattacher à une plongée existante du voyage ou d'en créer une
- **Depuis l'onglet Observations** (hors voyage) : "Nouvelle observation"
  - Propose : rattacher à un voyage ? → si oui, rattacher à une plongée de ce voyage ? → sinon, créer une plongée rapide ou saisie libre
- **Depuis le scanner IA** : après identification → "Rattacher à une plongée ?" → sélecteur rapide (plongées récentes en 1 clic)
- **En 1 clic** : les plongées récentes (dernières 48h) apparaissent comme suggestions rapides partout

**Migration** :
- Les observations existantes (sans `diveId`) continuent de fonctionner
- Option : proposer un regroupement automatique ("Ces 3 observations du 15/03 en Égypte ont l'air d'être la même plongée, regrouper ?")

**Sync Supabase** :
- Nouvelle table `md_dives` à créer côté Supabase (même pattern RLS que les autres tables `md_`)
- Ajouter la sync des plongées dans `syncAll()` dans `services/sync.ts`
- Ajouter `STORAGE_KEYS.DIVES` dans `constants/Storage.ts`

### 1. Voyage multi-pays
**Problème** : actuellement un `Trip` a un seul `country: string` et un seul `ocean: string`.
**Objectif** : permettre qu'un voyage couvre plusieurs pays (ex: Vietnam + Thaïlande).

- Modifier le type `Trip` dans `MarineData.ts` :
  - Garder `country` pour rétro-compat, ajouter `countries?: string[]`
  - Même logique pour `ocean` → `oceans?: string[]`
  - Le code doit toujours fonctionner avec les anciens voyages (fallback sur `country`/`ocean`)
- Dans le formulaire de création de voyage (`logbook.tsx`) : permettre la sélection de plusieurs pays (chips sélectionnables, pas un dropdown unique)
- Migration douce : au chargement, si un trip a `country` mais pas `countries`, créer `countries: [country]`

### 2. Observation → choix du pays dans un voyage multi-pays
**Problème** : quand on ajoute une observation à un voyage, on ne sait pas dans quel pays du voyage on était.
**Objectif** : si le voyage a plusieurs pays, proposer un sélecteur "Dans quel pays ?" avant le choix de l'océan.

- Dans le formulaire d'observation (logbook.tsx), si l'observation est rattachée à un trip multi-pays :
  - Étape 1 : choisir le pays (parmi les pays du voyage)
  - Étape 2 : l'océan est guidé automatiquement par `GEOGRAPHY_DB[pays]` (comme c'est déjà fait dans le formulaire d'observation "normale")
- Les données dans `GEOGRAPHY_DB` et `COUNTRY_COORDINATES` sont déjà complètes, les utiliser.

### 3. Carte type Strava (trajet entre spots)
**Objectif** : dans `trip/[id].tsx`, ajouter un mode carte qui retrace le voyage visuellement.

- Afficher une `Polyline` reliant tous les spots d'observation dans l'ordre chronologique
- Markers aux étapes avec le numéro du jour ou la date
- Si multi-pays : tracer le trajet entre les coordonnées des différents pays (utiliser `COUNTRY_COORDINATES`)
- Zoom auto pour que toute la polyline soit visible (`fitToCoordinates`)
- Style : ligne pointillée bleue (#006994), markers ronds numérotés
- Cet affichage existe déjà partiellement dans `map.tsx` (polyline focusTrip) — s'en inspirer

### 4. Partage enrichi avec carte de voyage
- Dans `shareable-trip-card.tsx` : ajouter une option de rendu avec la mini-carte du trajet
- Le composant `ShareableTripCard` fait déjà un `captureRef` pour générer le PNG — intégrer la carte dans ce rendu
- Attention : `MapView` dans un `captureRef` peut poser problème sur certains devices. Prévoir un fallback (liste textuelle des étapes si la carte ne se capture pas).

## Contraintes
- Rétro-compatibilité totale avec les voyages existants (un seul pays) et les observations existantes (sans diveId)
- Utiliser `COUNTRY_COORDINATES` comme source de vérité pour les coords
- Océan guidé = même logique que le formulaire d'observation classique (GEOGRAPHY_DB)
- La Dive est optionnelle : un utilisateur peut toujours créer une observation "libre" sans plongée
- Respecter CLAUDE.md : STORAGE_KEYS, services/, haptics, try/catch, etc.

## Questions à trancher avec le user
- Faut-il créer la table `md_dives` côté Supabase maintenant ou tu préfères le faire toi-même ? (fournir le SQL de création)
- Le moment de la journée : 4 choix (matin/après-midi/coucher de soleil/nuit) suffisent ?
- Veut-on afficher les plongées dans le trip detail (`trip/[id].tsx`) comme un onglet séparé ? (ex: Overview / Plongées / Timeline / Galerie)
