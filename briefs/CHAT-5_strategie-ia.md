# Brief Chat 5 — Stratégie IA (identification d'espèces marines)

## Contexte
MarineDex est une app Expo/React Native + Supabase pour l'association Revosea.
Le CLAUDE.md à la racine du projet contient toutes les conventions (lis-le en premier).
Ce chat couvre la stratégie complète de l'IA d'identification d'espèces marines : dataset, entraînement, déploiement, et conditions d'utilisation.

## État actuel du backend IA
- `backend/main.py` : API FastAPI avec endpoint `/predict` (reçoit une image, renvoie top-3 + confiance)
- `backend/train_model.py` : script d'entraînement MobileNetV2 transfer learning (2 phases : tête gelée puis fine-tune)
- Modèle : MobileNetV2 pré-entraîné ImageNet, fine-tuné sur un dataset custom
- Input : images 224×224, sortie softmax sur N classes
- L'URL dans l'app pointe sur un tunnel `loca.lt` (développement) : `https://silly-squids-clap.loca.lt/predict`
- Pas de modèle entraîné actuellement déployé
- Bucket Supabase `species-assets` contient des photos d'espèces (utilisable pour le dataset ?)

## Questions stratégiques à explorer

### 1. Le Dataset
- **Combien d'espèces** ? L'encyclopédie dans `MarineData.ts` contient ~47 espèces. C'est un bon périmètre de départ.
- **Combien d'images par espèce** ? Pour MobileNetV2 avec transfer learning et data augmentation, minimum 50-100 images/espèce pour un résultat correct. Idéal : 200+.
- **Sources de données** :
  - iNaturalist (API ouverte, licence CC, ~millions de photos marines identifiées)
  - FishBase / WoRMS (taxonomie, pas forcément les images)
  - GBIF (Global Biodiversity Information Facility)
  - Photos du bucket `species-assets` (mais probablement pas assez nombreuses)
  - Les photos des utilisateurs de MarineDex (à terme, avec consentement)
- **Qualité** : les photos sous-marines ont des conditions très variables (turbidité, éclairage, angle). L'augmentation doit simuler ces conditions.

### 2. Entraînement
- Le script actuel est fonctionnel mais basique. Améliorations possibles :
  - Augmentation spécifique sous-marine (teinte bleu/vert, flou, faible contraste)
  - Validation croisée k-fold sur petit dataset
  - Métriques par classe (pas juste accuracy globale — certaines espèces sont plus dures)
  - Matrice de confusion pour identifier les confusions fréquentes
- **Coût** : entraînement sur GPU. Options : Google Colab (gratuit), Kaggle Notebooks, ou un service cloud.
- **Fréquence** : ré-entraîner quand on ajoute des espèces ou du dataset.

### 3. Déploiement : API cloud vs embarqué

#### Option A : API cloud uniquement
- **Comment** : déployer le modèle sur un serveur (Railway, Render, AWS Lambda, Google Cloud Run)
- **Avantages** : modèle toujours à jour, pas de taille d'app, peut utiliser un modèle plus gros/précis
- **Inconvénients** : nécessite internet → inutilisable en plongée, coût serveur, latence
- **Coût** : ~5-15€/mois pour un petit serveur, gratuit sur Render/Railway en free tier (cold start lent)

#### Option B : modèle embarqué (TFLite dans l'app)
- **Comment** : convertir le modèle en TensorFlow Lite, l'embarquer dans l'app, inférence locale
- **Avantages** : fonctionne offline (plage, bateau), pas de coût serveur, instantané
- **Inconvénients** : taille du modèle (~5-15 MB pour MobileNetV2 quantifié), mise à jour = nouvelle version de l'app
- **Implémentation RN** : `@tensorflow/tfjs-react-native` ou `react-native-tflite`
- **Taille** : MobileNetV2 quantifié INT8 ≈ 3-4 MB. Acceptable dans un bundle app.

#### Option C : hybride (recommandé)
- **Modèle léger embarqué** (TFLite) pour l'usage offline : identification basique, top-3 avec confiance
- **API cloud** pour l'usage online : modèle plus gros, meilleure précision, espèces rares
- **Logique** : 
  1. Essayer l'API cloud d'abord (si réseau disponible)
  2. Fallback sur le modèle local si pas de réseau
  3. Afficher un indicateur : "🌐 Identification cloud" vs "📱 Identification locale"
- **Mise à jour** : le modèle local peut être mis à jour en arrière-plan (téléchargement du .tflite depuis Supabase Storage quand connecté)

### 4. Conditions d'utilisation de l'IA

**Use cases réels** :
- 🏊 **En plongée/snorkeling** : PAS de réseau. L'utilisateur prend une photo, l'identification se fait plus tard (quand il sort de l'eau) ou en local si modèle embarqué.
- 🏖️ **Sur la plage** : réseau 4G probable. Photo d'une tortue sur le sable → identification immédiate via API.
- 🚢 **Sur un bateau** : réseau variable. Le modèle local est utile ici.
- 🏠 **Chez soi** : tri des photos de vacances → identification en batch via API.

**UX à prévoir** :
- Si pas de réseau et pas de modèle local : "📷 Photo enregistrée ! L'identification se fera quand tu seras connecté."
- File d'attente d'identification : les photos prises offline sont identifiées automatiquement au retour du réseau.
- L'utilisateur peut toujours identifier manuellement (choix dans le pokédex) → l'IA est un assistant, pas une obligation.

### 5. Plan d'action suggéré

1. **Court terme** : déployer l'API sur Railway/Render avec le modèle actuel, remplacer l'URL loca.lt
2. **Moyen terme** : construire un vrai dataset (scraping iNaturalist), ré-entraîner, améliorer la précision
3. **Long terme** : modèle TFLite embarqué + mise à jour OTA + file d'attente offline

## Ce que Claude peut faire dans ce chat
- Aider à structurer le pipeline de collecte de données (script de scraping iNaturalist)
- Améliorer le script d'entraînement (augmentation sous-marine, métriques, confusion matrix)
- Configurer le déploiement cloud (Dockerfile, config Railway/Render)
- Implémenter le système hybride API + fallback local dans l'app
- Créer le service `services/ai-identification.ts` avec la logique online/offline

## Questions à trancher
- Budget serveur pour l'API cloud ? (0€ = free tier avec limitations, 10€/mois = confortable)
- Priorité : précision du modèle (plus de dataset) ou disponibilité offline (TFLite) ?
- Droit d'utilisation des photos iNaturalist pour entraînement ? (CC-BY en général, vérifier)
- L'IA doit-elle fonctionner sur les photos de la galerie (pas prises par l'app) ?
