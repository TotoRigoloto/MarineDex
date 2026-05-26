"""
MarineDex — Entraînement du modèle d'identification d'espèces marines
======================================================================

Stratégie :
  - Transfer learning sur MobileNetV2 (pré-entraîné ImageNet)
  - Phase 1 : on gèle la base, on entraîne juste la tête (rapide, 10 epochs)
  - Phase 2 : on dégèle les dernières couches pour fine-tune (5 epochs)
  - Augmentation forte pour limiter l'overfitting sur petits datasets
  - Early stopping + sauvegarde du meilleur modèle (val_accuracy)

Structure dataset attendue :
    dataset/
        Requin Marteau/
            img1.jpg
            img2.jpg
            ...
        Tortue Verte/
            ...
        Poisson Clown/
            ...

Sortie :
    backend/my_model.keras   (modèle Keras)
    backend/classes.txt      (noms de classes, snake_case, dans l'ordre des indices)

Lancement :
    python backend/train_model.py
    python backend/train_model.py --dataset ./mon_dataset --epochs 20

Pré-requis :
    pip install tensorflow pillow numpy
"""

import argparse
import os
import sys
from pathlib import Path

import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

# --- DEFAULTS ---
IMG_SIZE = 224
BATCH_SIZE = 16
DEFAULT_EPOCHS_HEAD = 10
DEFAULT_EPOCHS_FINE = 5
LR_HEAD = 1e-3
LR_FINE = 1e-5  # très bas pour ne pas casser les features pré-entraînées
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent


def normalize_class_name(folder_name: str) -> str:
    """Dossier "Requin Marteau" → label snake_case "requin_marteau"."""
    return folder_name.strip().lower().replace(" ", "_").replace("-", "_")


def build_datasets(dataset_dir: Path, validation_split: float = 0.2):
    if not dataset_dir.exists():
        sys.exit(f"❌ Dataset introuvable : {dataset_dir}")

    classes = sorted(
        [d.name for d in dataset_dir.iterdir() if d.is_dir() and not d.name.startswith(".")]
    )
    if len(classes) < 2:
        sys.exit(
            f"❌ Il faut au moins 2 classes dans {dataset_dir}. Trouvé : {classes}"
        )
    print(f"📦 Classes détectées ({len(classes)}) : {classes}")

    train_ds = tf.keras.preprocessing.image_dataset_from_directory(
        dataset_dir,
        validation_split=validation_split,
        subset="training",
        seed=42,
        image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_names=classes,
    )
    val_ds = tf.keras.preprocessing.image_dataset_from_directory(
        dataset_dir,
        validation_split=validation_split,
        subset="validation",
        seed=42,
        image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_names=classes,
    )

    # Augmentation forte (sur dataset de < 100 images, c'est crucial)
    augment = tf.keras.Sequential(
        [
            layers.RandomFlip("horizontal"),
            layers.RandomRotation(0.15),
            layers.RandomZoom(0.15),
            layers.RandomContrast(0.15),
            layers.RandomBrightness(0.15),
        ],
        name="augmentation",
    )

    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.map(
        lambda x, y: (augment(preprocess_input(x), training=True), y),
        num_parallel_calls=AUTOTUNE,
    ).prefetch(AUTOTUNE)
    val_ds = val_ds.map(
        lambda x, y: (preprocess_input(x), y),
        num_parallel_calls=AUTOTUNE,
    ).prefetch(AUTOTUNE)

    return train_ds, val_ds, classes


def build_model(num_classes: int) -> tf.keras.Model:
    base = MobileNetV2(
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )
    base.trainable = False  # phase 1 : on entraîne juste la tête

    inputs = tf.keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
    x = base(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(128, activation="relu")(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)
    return models.Model(inputs, outputs)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--dataset",
        default=str(PROJECT_DIR / "dataset"),
        help="Dossier racine du dataset (sous-dossiers = classes)",
    )
    parser.add_argument(
        "--epochs-head",
        type=int,
        default=DEFAULT_EPOCHS_HEAD,
        help="Epochs phase 1 (tête seule)",
    )
    parser.add_argument(
        "--epochs-fine",
        type=int,
        default=DEFAULT_EPOCHS_FINE,
        help="Epochs phase 2 (fine-tune)",
    )
    parser.add_argument(
        "--out",
        default=str(SCRIPT_DIR / "my_model.keras"),
        help="Chemin de sortie du modèle .keras",
    )
    parser.add_argument(
        "--classes-out",
        default=str(SCRIPT_DIR / "classes.txt"),
        help="Chemin de sortie du fichier classes.txt",
    )
    args = parser.parse_args()

    dataset_dir = Path(args.dataset).resolve()
    out_path = Path(args.out).resolve()
    classes_path = Path(args.classes_out).resolve()

    print(f"🚀 MarineDex train_model")
    print(f"   dataset    : {dataset_dir}")
    print(f"   modèle out : {out_path}")
    print(f"   classes    : {classes_path}")

    train_ds, val_ds, classes = build_datasets(dataset_dir)
    num_classes = len(classes)
    model = build_model(num_classes)
    print(model.summary())

    # ====== PHASE 1 : tête seule ======
    model.compile(
        optimizer=tf.keras.optimizers.Adam(LR_HEAD),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    callbacks = [
        EarlyStopping(monitor="val_accuracy", patience=4, restore_best_weights=True),
        ModelCheckpoint(
            str(out_path),
            monitor="val_accuracy",
            save_best_only=True,
            verbose=1,
        ),
        ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2, min_lr=1e-6),
    ]
    print("\n🏋️  Phase 1 : entraînement de la tête (base gelée)")
    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs_head,
        callbacks=callbacks,
    )

    # ====== PHASE 2 : fine-tune des dernières couches ======
    print("\n🔧 Phase 2 : fine-tuning (dernières couches)")
    base = model.layers[1]  # le modèle MobileNetV2
    base.trainable = True
    # On ne dégèle que les ~30 dernières couches pour ne pas tout casser
    for layer in base.layers[:-30]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(LR_FINE),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs_fine,
        callbacks=callbacks,
    )

    # ====== SAUVEGARDE ======
    # ModelCheckpoint a déjà sauvegardé le meilleur modèle au format .keras
    if not out_path.exists():
        model.save(out_path)

    with open(classes_path, "w", encoding="utf-8") as f:
        for c in classes:
            f.write(f"{normalize_class_name(c)}\n")

    print(f"\n✅ Modèle sauvegardé : {out_path}")
    print(f"✅ Classes sauvegardées : {classes_path}")
    print(f"   ({num_classes} classes : {classes})")
    print("\nLance maintenant : uvicorn backend.main:app --reload")


if __name__ == "__main__":
    main()
