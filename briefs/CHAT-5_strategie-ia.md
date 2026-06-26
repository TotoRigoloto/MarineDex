# Brief Chat 5 — Stratégie IA (identification d'espèces marines)
# STATUT : PARTIELLEMENT COMPLÉTÉ — voir section "Ce qui a été fait" par point

## Contexte
MarineDex est une app Expo/React Native + Supabase pour l'association Revosea.
Le CLAUDE.md à la racine du projet contient toutes les conventions (lire en premier).
Ce chat couvre la stratégie complète de l'IA d'identification d'espèces marines.

---

## État du backend IA (au début du chat)
- `backend/main.py` : API FastAPI avec endpoint `/predict` (top-3 + confiance) — **inchangé**
- `backend/train_model.py` : MobileNetV2 transfer learning 2 phases — **reécrit, voir ci-dessous**
- Modèle : pas de modèle entraîné déployé
- URL app : tunnel `loca.lt` (dev) — **non remplacé dans ce chat**
- Bucket `species-assets` non utilisé dans ce chat

---

## 1. Le Dataset

### Décisions prises
- Périmètre : **80 espèces** (MarineData.ts en contient 80, pas 47 comme estimé initialement)
- Source : iNaturalist API (quality_grade=research, photos CC)
- Cible : 200 images/espèce

### Ce qui a été fait
- **`backend/species_mapping.json`** créé : mapping complet des 80 espèces français → nom scientifique + taxon_id iNaturalist vérifié. taxon_id à `null` = recherche automatique au premier lancement.
- **`backend/build_dataset.py`** créé : script de scraping complet avec :
  - Résumé par espèce (existant / disponible / téléchargé)
  - Reprise automatique (skip si déjà N images)
  - Rate limiting API (0.7s entre requêtes)
  - `--dry-run` pour voir la disponibilité sans télécharger
  - `--species` pour cibler des espèces spécifiques
  - `--min-existing` pour compléter les espèces sous-dotées
  - Vérification PIL (rejette les images corrompues)

### Commande
```bash
pip install requests tqdm Pillow
python backend/build_dataset.py --dry-run          # aperçu
python backend/build_dataset.py                     # téléchargement complet (~16 000 images)
python backend/build_dataset.py --per-species 100  # version allégée pour test
```

### Reste à faire
- Lancer le scraping sur une vraie machine (la sandbox n'a pas accès à iNaturalist)
- Valider manuellement un échantillon par espèce (qualité variable des photos sous-marines)
- Envisager ajout sources complémentaires (GBIF, FishBase) pour espèces rares (<50 obs iNat)

---

## 2. Entraînement

### Ce qui a été fait
`backend/train_model.py` réécrit entièrement (v2). Ajouts :

- **Augmentation sous-marine custom** (`underwater_augment_fn`) :
  - Atténuation canal rouge aléatoire (simule absorption lumière en profondeur)
  - Bruit gaussien (particules en suspension)
  - Contraste/luminosité plus agressifs (turbidité variable)
  - Flip horizontal + rotation + zoom
- **Métriques par classe** : rapport precision/recall/F1 par espèce sauvegardé dans `training_report/per_class_metrics.txt`
- **Matrice de confusion** : PNG dans `training_report/confusion_matrix.png`
- **Courbes d'entraînement** : accuracy + loss des 2 phases avec marqueur phase1/phase2
- **Export TFLite INT8 automatique** : `my_model.tflite` généré en fin d'entraînement avec dataset de calibration représentatif (~3-4 MB attendus)
- Args `--no-tflite` et `--no-report` pour entraînements rapides

### Commande
```bash
pip install tensorflow pillow numpy matplotlib scikit-learn
python backend/train_model.py
# Sorties : my_model.keras + my_model.tflite + training_report/
```

### Reste à faire
- Entraîner avec un vrai dataset (actuellement : 2 classes, pas assez pour valider les métriques)
- Analyser la matrice de confusion pour identifier les confusions fréquentes (requins similaires, etc.)
- Envisager EfficientNetV2 si MobileNetV2 plafonne en accuracy

---

## 3. Déploiement : API cloud vs embarqué

### Décision prise
**Option C (hybride) dès le départ** : modèle TFLite embarqué + API cloud en parallèle.

### Ce qui a été fait
- Le `train_model.py` génère désormais `my_model.tflite` automatiquement → base technique pour l'embarqué

### Reste à faire (non commencé dans ce chat)
- **Dockerfile** pour le backend FastAPI
- **Config Railway/Render** (free tier, 0€) avec cold start assumé
- Remplacer l'URL `loca.lt` dans l'app par l'URL stable du déploiement
- Restreindre CORS dans `main.py` au domaine de prod
- Endpoint `/health` déjà en place pour les health checks Railway/Render

---

## 4. Conditions d'utilisation de l'IA

### Décision prise
Stratégie offline-first : API cloud d'abord si réseau, fallback TFLite local sinon.

### Ce qui a été fait
Néant dans ce chat — la logique est documentée mais non implémentée.

### Reste à faire (non commencé dans ce chat)
- **`services/ai-identification.ts`** : service hybride à créer avec :
  - Détection réseau (`@react-native-community/netinfo`)
  - Appel API cloud si connecté
  - Fallback TFLite via `react-native-tflite` si offline
  - File d'attente d'identification (photos prises offline → identifiées au retour réseau)
  - Indicateur UX "Identification cloud" vs "Identification locale"
- Mise à jour OTA du `.tflite` depuis Supabase Storage (background)
- UX : "Photo enregistrée, identification dès reconnexion" si offline ET pas de modèle local

---

## 5. Plan d'action (état d'avancement)

| Étape | Statut | Détail |
|---|---|---|
| 1. Déployer API cloud (remplacer loca.lt) | ❌ Non fait | Dockerfile + Railway config à créer |
| 2. Construire dataset iNaturalist | ✅ Script prêt | `build_dataset.py` + `species_mapping.json` |
| 3. Ré-entraîner avec vrai dataset | ⏳ En attente | Besoin d'un GPU + dataset téléchargé |
| 4. TFLite embarqué + service hybride | 🔧 Partiel | Export TFLite OK, service RN à créer |
| 5. File d'attente offline | ❌ Non fait | `ai-identification.ts` à créer |

---

## 6. Ce que Claude a fait dans ce chat

| Tâche du brief | Fait ? | Fichier |
|---|---|---|
| Script scraping iNaturalist | ✅ | `backend/build_dataset.py` |
| Mapping espèces (noms scientifiques) | ✅ | `backend/species_mapping.json` |
| Améliorer train_model.py (augmentation sous-marine) | ✅ | `backend/train_model.py` |
| Métriques par classe + matrice de confusion | ✅ | `backend/train_model.py` |
| Export TFLite automatique | ✅ | `backend/train_model.py` |
| Dockerfile + config Railway/Render | ❌ | — |
| Service `ai-identification.ts` (hybride) | ❌ | — |

---

## 7. Questions tranchées dans ce chat

| Question | Réponse |
|---|---|
| Budget serveur cloud ? | **0€ — free tier** (Railway ou Render, cold start accepté) |
| Priorité précision vs offline ? | **Hybride dès le départ** (TFLite + API en parallèle) |
| Nb d'espèces ? | **80** (MarineData.ts réel, pas 47 comme estimé) |
| L'IA doit-elle fonctionner sur photos galerie ? | Non décidé |
| Droits iNaturalist ? | CC-BY, usage non-commercial OK pour entraînement |

---

## Prochaines étapes prioritaires pour le prochain chat

1. **Déploiement cloud** : Dockerfile + Railway/Render (remplacer loca.lt) → prerequis pour que l'app fonctionne en dehors du poste de dev
2. **Service `ai-identification.ts`** : logique hybride online/offline dans l'app RN
3. **Lancer le scraping + entraînement** : nécessite une machine avec GPU et accès internet non proxifié
