import os

import tensorflow as tf

# Notes : enlever les tensorflow.keras.applications et mettre juste keras.applications pour éviter les conflits de versions
from keras.applications import MobileNetV2
from keras.layers import Dense, GlobalAveragePooling2D
from keras.models import Model
from keras.preprocessing.image import ImageDataGenerator


# --- CONFIGURATION ---
DATASET_DIR = 'dataset'  # Le dossier avec tes images
MODEL_SAVE_PATH = 'backend/my_model.keras' # Où on sauvegarde le cerveau fini
IMG_SIZE = (224, 224)    # Taille standard pour MobileNet
BATCH_SIZE = 32          # Nombre d'images traitées d'un coup
EPOCHS = 5               # Nombre de fois qu'on lit tout le dataset (augmente si résultats mauvais)

# Vérifier si le dossier dataset existe
if not os.path.exists(DATASET_DIR):
    print(f"ERREUR: Le dossier '{DATASET_DIR}' est introuvable !")
    exit()

print("Chargement des images et préparation...")

# Outil pour charger les images et faire un peu de "Data Augmentation" (zoomer/tourner pour varier)
train_datagen = ImageDataGenerator(
    rescale=1./255,       # Normaliser les pixels entre 0 et 1
    rotation_range=20,    # Tourner un peu les images
    horizontal_flip=True, # Retourner horizontalement
    validation_split=0.2  # Garder 20% des images pour se tester
)

# Chargement des données d'entraînement (80%)
train_generator = train_datagen.flow_from_directory(
    DATASET_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training'
)

# Chargement des données de validation (20%)
validation_generator = train_datagen.flow_from_directory(
    DATASET_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation'
)

# Récupérer les noms des classes (ex: ['requin', 'tortue'])
class_names = list(train_generator.class_indices.keys())
print(f"Classes détectées : {class_names}")
# On sauvegarde les noms des classes dans un fichier texte pour que l'App les connaisse
with open("backend/classes.txt", "w") as f:
    f.write("\n".join(class_names))

# --- CRÉATION DU MODÈLE ---
print("Téléchargement du modèle de base (MobileNetV2)...")
# On prend MobileNetV2 sans la "tête" (include_top=False) car on veut mettre notre propre tête
base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=IMG_SIZE + (3,))

# On gèle le modèle de base pour ne pas "casser" ce qu'il sait déjà faire
base_model.trainable = False

# On ajoute notre propre couche de sortie adaptée à nos animaux
x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(1024, activation='relu')(x) # Couche intermédiaire
predictions = Dense(len(class_names), activation='softmax')(x) # Couche finale (autant de neurones que d'animaux)

model = Model(inputs=base_model.input, outputs=predictions)

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

# --- ENTRAÎNEMENT ---
print("Démarrage de l'entraînement... (Patience !)")
model.fit(
    train_generator,
    epochs=EPOCHS,
    validation_data=validation_generator
)

# --- SAUVEGARDE ---
print(f"Sauvegarde du modèle dans {MODEL_SAVE_PATH}...")
model.save(MODEL_SAVE_PATH)
print("Terminé ! Ton IA est prête.")