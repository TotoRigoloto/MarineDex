# Brief Chat 4 — Gamification adaptative + avatars composables

## Contexte
MarineDex est une app Expo/React Native + Supabase pour l'association Revosea.
Le CLAUDE.md à la racine du projet contient toutes les conventions (lis-le en premier).
Ce chat couvre la refonte du système de gamification et la création d'avatars personnalisables.

## État actuel
- `app/(tabs)/profile.tsx` : streaks (semaines consécutives), objectifs hebdo/mensuels, badges, XP/grades
- `services/stats.ts` : `computeStreak()` (semaines consécutives avec obs), `weeklyGoals()`, `monthlyGoals()`
- `constants/Storage.ts` : avatars = presets emoji + couleur de fond (12 presets)
- Le streak actuel = "nombre de semaines consécutives avec au moins une observation"

## Problèmes identifiés
1. **Streaks trop exigeants** : tout le monde ne plonge pas chaque semaine. Un citadin qui va à la mer 2x/an perd son streak en permanence → frustrant, pas motivant.
2. **Objectifs uniformes** : les goals hebdo/mensuels sont les mêmes pour un plongeur pro et un touriste occasionnel.
3. **Risque d'incitation au tourisme de masse** : pousser les gens à plonger plus souvent va à l'encontre de la mission écolo de Revosea.
4. **Avatars basiques** : juste un emoji + couleur, pas de personnalisation réelle.

## Tâches à réaliser

### 1. Modes utilisateur adaptatifs
**Concept** : l'utilisateur choisit son "rythme marin" à l'onboarding (modifiable dans settings).

Modes proposés :
- 🏙️ **Citadin voyageur** — "Je vais à la mer quelques fois par an"
  - Streak basé sur les voyages (pas les semaines)
  - Objectifs trimestriels plutôt qu'hebdo
  - Badges orientés découverte/diversité
- 🏖️ **Côtier occasionnel** — "J'habite près de la mer, j'y vais de temps en temps"
  - Streak mensuel (1 obs/mois suffit)
  - Objectifs mensuels modérés
  - Mix badges quantité + diversité
- 🌊 **Marin régulier** — "Je plonge/snorkele souvent"
  - Streak hebdomadaire (le système actuel)
  - Objectifs hebdo + mensuels
  - Badges avancés, défis de quantité

**Alternative évolutive** (plus ambitieuse mais meilleure UX) :
- Pas de choix explicite : l'app détecte le rythme de l'utilisateur sur ses 3 premiers mois
- Commence avec le mode "Citadin" (le plus doux)
- Si elle détecte des plongées régulières → propose de passer au mode suivant
- "On dirait que tu es un vrai marin ! Veux-tu des objectifs plus ambitieux ?"

**Recommandation** : commencer par le choix explicite (plus simple), prévoir l'évolutif en v2.

Stocker le mode dans `STORAGE_KEYS.USER_MODE` et adapter `computeStreak()` + `weeklyGoals()` + `monthlyGoals()` dans `services/stats.ts`.

### 2. Streaks via "Le savais-thon" 🐟
**Concept** : maintenir son streak sans forcément aller dans l'eau, en apprenant sur la vie marine.

- Chaque jour, une carte "Le savais-thon" (fun fact marin) est disponible
- Lire/valider le savais-thon du jour compte comme activité pour le streak (selon le mode)
- Source des fun facts : ajouter un tableau `FUN_FACTS` dans `MarineData.ts` ou un fichier dédié `constants/FunFacts.ts`
- Afficher sur l'écran d'accueil (index.tsx) ou dans une section dédiée du profil
- Un fact par jour (basé sur la date, pas aléatoire → tout le monde voit le même)
- Bouton "J'ai appris !" qui valide le fact et nourrit le streak

### 3. Avatars composables (style Pokémon GO)
**Concept** : un avatar personnalisable par calques SVG superposés.

**Architecture recommandée** :
- Système de calques SVG (de bas en haut) :
  1. Corps (couleur de peau : 6-8 teintes)
  2. Cheveux (style + couleur : 10 styles × 6 couleurs)
  3. Visage (yeux + expression : 5-6 options)
  4. Tenue (maillot, combi shorty, combi intégrale, rashguard : 8-10 options × couleurs)
  5. Accessoires (masque, tuba, palmes, casquette, chapeau : 6-8 options)
- Chaque calque = un fichier SVG ou un composant React Native SVG
- La combinaison est stockée comme un objet JSON dans AsyncStorage

**Implémentation** :
- Dépendance : `react-native-svg` (probablement déjà installé, vérifier)
- Créer `components/avatar-builder.tsx` : l'éditeur avec carrousel par catégorie
- Créer `components/avatar-display.tsx` : le rendu composé (utilisé partout : profil, partage, badges)
- Stocker dans `STORAGE_KEYS.AVATAR_CONFIG` : `{ skin: "tone3", hair: "short_brown", face: "happy", outfit: "wetsuit_blue", accessory: "mask" }`
- Garder les anciens `AVATAR_PRESETS` comme fallback / migration

**Comment faire les SVG** :
- Option A : les dessiner à la main (Figma → export SVG → composants). Contrôle total, cohérence visuelle.
- Option B : utiliser une lib comme `react-native-avatar-builder` (si elle existe et est maintenue).
- **Recommandation** : Option A avec des SVG simples style flat/cartoon. Je peux générer les paths SVG de base, mais il faudra un passage Figma pour le polish.
- Les SVG peuvent être générés comme composants React avec des props pour les couleurs.

**Ce que Claude peut faire** :
- Créer l'architecture complète (composants, types, storage)
- Générer des SVG basiques fonctionnels (silhouettes simples)
- Implémenter l'éditeur d'avatar avec prévisualisation
- Pour un rendu "beau", il faudra ensuite remplacer les SVG par des assets dessinés par un graphiste ou via Figma

### 4. Déblocage d'items d'avatar par badges/XP
- Certains accessoires sont débloqués par la progression :
  - Masque de plongée → badge "Première Bulle"
  - Combi intégrale → grade "Dive Master"
  - Casquette Revosea → 5 voyages
- Afficher un cadenas sur les items non débloqués dans l'éditeur

## Contraintes
- Le système de modes doit être rétro-compatible (les streaks existants ne sont pas perdus)
- Les avatars SVG doivent être légers (<10KB par calque) pour ne pas alourdir l'app
- Pas de dépendance lourde pour les avatars — `react-native-svg` suffit
- Bien séparer la logique (services/stats.ts, services/avatar.ts) des composants
- Respecter CLAUDE.md : STORAGE_KEYS, services/, haptics, etc.

## Questions à trancher avec le user
- Mode explicite (choix utilisateur) ou évolutif (détection auto) ?
- Combien de fun facts "Le savais-thon" au lancement ? (30 pour un mois, 100 pour couvrir 3 mois ?)
- Budget graphisme pour les SVG d'avatars ? (Claude peut faire le squelette technique, mais le rendu final dépend des assets)
