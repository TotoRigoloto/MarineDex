"""
Backend FastAPI MarineDex — v2

Endpoints :
  - GET  /              : ping
  - GET  /health        : statut + classes connues
  - POST /predict       : reçoit une image multipart, renvoie top-3 + confiance

Format de réponse /predict :
  {
    "species": "Requin Marteau",        # meilleur résultat
    "confidence": 0.87,                 # 0.0 - 1.0
    "alternatives": [
      {"species": "Requin Marteau", "confidence": 0.87},
      {"species": "Requin Tigre",   "confidence": 0.08},
      {"species": "Requin Blanc",   "confidence": 0.03}
    ]
  }

Lancement local :
    uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
"""

import io
import os
from typing import Dict, List

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image as keras_image

# --- CONSTANTS ---
MODEL_PATH = os.path.join(os.path.dirname(__file__), "my_model.keras")
CLASSES_PATH = os.path.join(os.path.dirname(__file__), "classes.txt")
IMG_SIZE = 224  # MobileNetV2 standard
TOP_K = 3       # nombre de prédictions retournées

# --- APP ---
app = FastAPI(
    title="MarineDex IA",
    description="Service d'identification d'espèces marines",
    version="2.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restreindre à votre domaine en prod
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- LOADING ---
def pretty_class_name(raw: str) -> str:
    """Convertit `requin_marteau` → `Requin Marteau`."""
    return raw.replace("_", " ").title()


print("[MarineDex] Chargement du modèle…")
model = None
class_names: List[str] = []
pretty_names: List[str] = []

try:
    model = load_model(MODEL_PATH)
    with open(CLASSES_PATH, "r", encoding="utf-8") as f:
        class_names = [line.strip() for line in f.readlines() if line.strip()]
    pretty_names = [pretty_class_name(c) for c in class_names]
    print(f"[MarineDex] ✅ Modèle chargé · {len(class_names)} classes : {pretty_names}")
except Exception as e:
    print(f"[MarineDex] ❌ Impossible de charger le modèle : {e}")
    print("           Astuce : lance 'python backend/train_model.py' pour entraîner.")


# --- ROUTES ---
@app.get("/")
def root():
    return {"message": "MarineDex AI · online", "version": "2.0.0"}


@app.get("/health")
def health() -> Dict:
    return {
        "ok": model is not None,
        "classes": pretty_names,
        "model_path": MODEL_PATH,
    }


def prepare_image(image_bytes: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((IMG_SIZE, IMG_SIZE))
    arr = keras_image.img_to_array(img)
    arr = np.expand_dims(arr, axis=0)
    # Le préprocessing dépend du modèle. Pour MobileNetV2 c'est /127.5 - 1
    # mais on accepte aussi la version /255.0 du modèle initial.
    arr = arr / 255.0
    return arr


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None or not class_names:
        raise HTTPException(503, "Modèle non chargé. Réessaye plus tard.")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Fichier non image.")

    raw = await file.read()
    if not raw:
        raise HTTPException(400, "Image vide.")

    try:
        processed = prepare_image(raw)
    except Exception as e:
        raise HTTPException(400, f"Image invalide : {e}")

    preds = model.predict(processed, verbose=0)[0]  # shape (n_classes,)
    # Top-K indices triés par confiance décroissante
    top_idx = np.argsort(preds)[::-1][:TOP_K]
    alternatives = [
        {
            "species": pretty_names[int(i)],
            "confidence": round(float(preds[int(i)]), 4),
        }
        for i in top_idx
    ]
    best = alternatives[0]

    return {
        "species": best["species"],
        "confidence": best["confidence"],
        "alternatives": alternatives,
    }
