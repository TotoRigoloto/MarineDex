import io

import numpy as np
from fastapi import FastAPI, File, UploadFile
from PIL import Image
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image

app = FastAPI()

# --- CHARGEMENT DU MODÈLE ---
print("Chargement du cerveau IA...")
try:
    # On charge le fichier créé par train_model.py
    model = load_model("backend/my_model.keras")
    
    # On charge les noms des animaux
    with open("backend/classes.txt", "r") as f:
        class_names = [line.strip() for line in f.readlines()]
    print(f"✅ Modèle chargé ! Je connais : {class_names}")
except Exception as e:
    print(f"❌ Erreur : {e}")
    print("Astuce : As-tu bien lancé 'python train_model.py' ?")
    model = None
    class_names = []

@app.get("/")
def read_root():
    return {"message": "API Marine Pokédex en ligne"}

def prepare_image(image_bytes):
    """Prépare l'image pour qu'elle ait la même taille que lors de l'entraînement"""
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    img = img.resize((224, 224)) # Taille standard MobileNetV2
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = img_array / 255.0 # Normalisation
    return img_array

@app.post("/predict")
async def predict_species(file: UploadFile = File(...)):
    if model is None:
        return {"message": "Erreur: Le modèle IA n'est pas chargé sur le serveur."}

    # 1. Lire et traiter l'image
    image_bytes = await file.read()
    processed_image = prepare_image(image_bytes)
    
    # 2. Demander au modèle
    predictions = model.predict(processed_image)
    
    # 3. Analyser le résultat
    score = predictions[0] # Les probabilités pour chaque animal
    class_index = np.argmax(score) # L'index du score le plus haut
    predicted_class = class_names[class_index] # Le nom de l'animal correspondant
    confidence = round(100 * np.max(score), 2) # Le pourcentage de certitude
    
    print(f"🔍 Analyse : {predicted_class} ({confidence}%)")

    return {
        "species": predicted_class,
        "confidence": f"{confidence}%",
        "message": f"C'est un(e) {predicted_class} ! (Sûr à {confidence}%)"
    }