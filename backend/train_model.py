"""
MarineDex -- Entrainement du modele d'identification d'especes marines
=======================================================================

Strategie :
  - Transfer learning MobileNetV2 (ImageNet)
  - Phase 1 : tete seule, base gelee (10 epochs)
  - Phase 2 : fine-tune des 30 dernieres couches (5 epochs)
  - Augmentation sous-marine (teinte bleue, flou, bruit)
  - Metriques par classe + matrice de confusion
  - Export TFLite INT8 automatique (modele embarque offline)

Structure dataset :
    dataset/
        Requin Baleine/
            00001.jpg ...
        Tortue Verte/
            ...

Sorties :
    backend/my_model.keras        (API cloud)
    backend/my_model.tflite       (app mobile offline)
    backend/classes.txt           (noms snake_case, ordre indices)
    backend/training_report/      (courbes, metriques, confusion matrix)

Lancement :
    python backend/train_model.py
    python backend/train_model.py --dataset ./dataset --epochs-head 15 --epochs-fine 8

Prerequis :
    pip install tensorflow pillow numpy matplotlib scikit-learn
"""

import argparse
import os
import sys
from pathlib import Path

import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------
IMG_SIZE            = 224
BATCH_SIZE          = 16
DEFAULT_EPOCHS_HEAD = 10
DEFAULT_EPOCHS_FINE = 5
LR_HEAD             = 1e-3
LR_FINE             = 1e-5
SCRIPT_DIR          = Path(__file__).resolve().parent
PROJECT_DIR         = SCRIPT_DIR.parent


def normalize_class_name(folder_name: str) -> str:
    """'Requin Marteau' -> 'requin_marteau' (snake_case)."""
    return folder_name.strip().lower().replace(" ", "_").replace("-", "_")


# ---------------------------------------------------------------------------
# Augmentation sous-marine
# Photos sous-marines : dominante bleue/verte, faible contraste,
# particules en suspension, eclairage variable selon la profondeur.
# ---------------------------------------------------------------------------

def underwater_augment_fn(image: tf.Tensor) -> tf.Tensor:
    """Augmentation specialisee photos sous-marines. Input : float32 [0,255]."""
    image = tf.image.random_flip_left_right(image)
    image = tf.keras.layers.RandomRotation(0.1)(image)
    image = tf.keras.layers.RandomZoom((-0.15, 0.15))(image)

    # Contraste et luminosite variables (turbidite, profondeur)
    image = tf.image.random_contrast(image, lower=0.6, upper=1.4)
    image = tf.image.random_brightness(image, max_delta=0.3)

    # Dominante bleue/verte : attenuation du canal rouge selon la profondeur
    r, g, b = tf.split(image, 3, axis=-1)
    r = r * tf.random.uniform([], 0.55, 1.0)
    g = g * tf.random.uniform([], 0.80, 1.05)
    image = tf.concat([r, g, b], axis=-1)

    # Bruit gaussien (particules en suspension)
    noise = tf.random.normal(tf.shape(image), mean=0.0, stddev=8.0)
    image = tf.clip_by_value(image + noise, 0.0, 255.0)
    return image


# ---------------------------------------------------------------------------
# Dataset
# ---------------------------------------------------------------------------

def build_datasets(dataset_dir: Path, validation_split: float = 0.2):
    if not dataset_dir.exists():
        sys.exit(f"Dataset introuvable : {dataset_dir}")

    classes = sorted([
        d.name for d in dataset_dir.iterdir()
        if d.is_dir() and not d.name.startswith(".")
    ])
    if len(classes) < 2:
        sys.exit(f"Il faut au moins 2 classes. Trouve : {classes}")

    suffix = "..." if len(classes) > 10 else ""
    print(f"Classes ({len(classes)}) : {classes[:10]}{suffix}")

    common_kwargs = dict(
        validation_split=validation_split,
        seed=42,
        image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_names=classes,
    )
    train_ds_raw = tf.keras.preprocessing.image_dataset_from_directory(
        dataset_dir, subset="training", **common_kwargs
    )
    val_ds_raw = tf.keras.preprocessing.image_dataset_from_directory(
        dataset_dir, subset="validation", **common_kwargs
    )

    AUTO = tf.data.AUTOTUNE
    train_ds = train_ds_raw.map(
        lambda x, y: (preprocess_input(underwater_augment_fn(x)), y),
        num_parallel_calls=AUTO,
    ).prefetch(AUTO)
    val_ds = val_ds_raw.map(
        lambda x, y: (preprocess_input(x), y),
        num_parallel_calls=AUTO,
    ).prefetch(AUTO)

    return train_ds, val_ds, val_ds_raw, classes


# ---------------------------------------------------------------------------
# Modele
# ---------------------------------------------------------------------------

def build_model(num_classes: int) -> tf.keras.Model:
    base = MobileNetV2(input_shape=(IMG_SIZE, IMG_SIZE, 3), include_top=False, weights="imagenet")
    base.trainable = False
    inputs = tf.keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
    x = base(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)
    return models.Model(inputs, outputs)


# ---------------------------------------------------------------------------
# Rapport : courbes d'entrainement
# ---------------------------------------------------------------------------

def save_training_curves(history_head, history_fine, report_dir: Path):
    acc   = history_head.history["accuracy"]     + history_fine.history["accuracy"]
    val   = history_head.history["val_accuracy"] + history_fine.history["val_accuracy"]
    loss  = history_head.history["loss"]         + history_fine.history["loss"]
    vloss = history_head.history["val_loss"]     + history_fine.history["val_loss"]

    epochs = range(1, len(acc) + 1)
    p2 = len(history_head.history["accuracy"]) + 0.5

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    fig.suptitle("MarineDex -- Courbes d'entrainement", fontsize=13)

    ax1.plot(epochs, acc, label="Train")
    ax1.plot(epochs, val, label="Val")
    ax1.axvline(x=p2, color="gray", linestyle="--", alpha=0.5, label="Fine-tune")
    ax1.set_title("Accuracy")
    ax1.set_xlabel("Epoch")
    ax1.legend()

    ax2.plot(epochs, loss, label="Train")
    ax2.plot(epochs, vloss, label="Val")
    ax2.axvline(x=p2, color="gray", linestyle="--", alpha=0.5, label="Fine-tune")
    ax2.set_title("Loss")
    ax2.set_xlabel("Epoch")
    ax2.legend()

    out = report_dir / "training_curves.png"
    plt.tight_layout()
    plt.savefig(out, dpi=150)
    plt.close()
    print(f"Courbes sauvegardees : {out}")


# ---------------------------------------------------------------------------
# Rapport : metriques par classe + matrice de confusion
# ---------------------------------------------------------------------------

def save_per_class_metrics(model, val_ds_raw, classes: list, report_dir: Path):
    try:
        from sklearn.metrics import classification_report, confusion_matrix
    except ImportError:
        print("[warn] scikit-learn manquant -- pip install scikit-learn")
        return

    print("Calcul des metriques par classe...")
    all_true, all_pred = [], []
    for batch_images, batch_labels in val_ds_raw:
        processed = preprocess_input(tf.cast(batch_images, tf.float32))
        preds = model.predict(processed, verbose=0)
        all_pred.extend(np.argmax(preds, axis=1))
        all_true.extend(batch_labels.numpy())

    report = classification_report(
        all_true, all_pred, target_names=classes, digits=3, zero_division=0
    )
    txt_path = report_dir / "per_class_metrics.txt"
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write("MarineDex -- Metriques par classe (validation)\n")
        f.write("=" * 60 + "\n\n")
        f.write(report)
    print(f"Metriques : {txt_path}")
    print(report)

    cm = confusion_matrix(all_true, all_pred)
    n = len(classes)
    fig_size = max(10, n * 0.45)
    fig, ax = plt.subplots(figsize=(fig_size, fig_size))
    im = ax.imshow(cm, interpolation="nearest", cmap=plt.cm.Blues)
    plt.colorbar(im, ax=ax)
    fs = max(5, 9 - n // 10)
    ax.set_xticks(range(n))
    ax.set_yticks(range(n))
    ax.set_xticklabels(classes, rotation=90, fontsize=fs)
    ax.set_yticklabels(classes, fontsize=fs)
    if n <= 30:
        thresh = cm.max() / 2.0
        for i in range(n):
            for j in range(n):
                ax.text(j, i, str(cm[i, j]), ha="center", va="center",
                        color="white" if cm[i, j] > thresh else "black", fontsize=7)
    ax.set_ylabel("Vraie classe")
    ax.set_xlabel("Classe predite")
    ax.set_title("Matrice de confusion -- MarineDex")
    plt.tight_layout()
    cm_path = report_dir / "confusion_matrix.png"
    plt.savefig(cm_path, dpi=150)
    plt.close()
    print(f"Matrice de confusion : {cm_path}")


# ---------------------------------------------------------------------------
# Export TFLite INT8 (modele embarque offline, ~3-4 MB)
# ---------------------------------------------------------------------------

def export_tflite(model, val_ds_raw, tflite_path: Path):
    print("\nExport TFLite INT8...")
    calibration_data = []
    for batch_images, _ in val_ds_raw.take(10):
        for img in batch_images:
            arr = preprocess_input(tf.cast(img, tf.float32))
            calibration_data.append(tf.expand_dims(arr, axis=0).numpy())

    def representative_dataset():
        for sample in calibration_data:
            yield [sample]

    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.representative_dataset = representative_dataset
    converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
    converter.inference_input_type  = tf.float32
    converter.inference_output_type = tf.float32
    try:
        tflite_model = converter.convert()
        tflite_path.write_bytes(tflite_model)
        size_mb = len(tflite_model) / 1_048_576
        print(f"TFLite INT8 : {tflite_path}  ({size_mb:.1f} MB)")
    except Exception as e:
        print(f"[warn] Export TFLite echoue : {e}")
        print("       Le modele .keras reste disponible pour l'API cloud.")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="MarineDex -- entraine le modele IA")
    parser.add_argument("--dataset",     default=str(PROJECT_DIR / "dataset"))
    parser.add_argument("--epochs-head", type=int, default=DEFAULT_EPOCHS_HEAD)
    parser.add_argument("--epochs-fine", type=int, default=DEFAULT_EPOCHS_FINE)
    parser.add_argument("--out",         default=str(SCRIPT_DIR / "my_model.keras"))
    parser.add_argument("--tflite-out",  default=str(SCRIPT_DIR / "my_model.tflite"))
    parser.add_argument("--classes-out", default=str(SCRIPT_DIR / "classes.txt"))
    parser.add_argument("--report-dir",  default=str(SCRIPT_DIR / "training_report"))
    parser.add_argument("--no-tflite",   action="store_true")
    parser.add_argument("--no-report",   action="store_true")
    args = parser.parse_args()

    dataset_dir  = Path(args.dataset).resolve()
    out_path     = Path(args.out).resolve()
    tflite_path  = Path(args.tflite_out).resolve()
    classes_path = Path(args.classes_out).resolve()
    report_dir   = Path(args.report_dir).resolve()

    print(f"MarineDex train_model v2")
    print(f"  dataset  : {dataset_dir}")
    print(f"  keras    : {out_path}")
    print(f"  tflite   : {tflite_path}")
    print(f"  rapport  : {report_dir}")

    train_ds, val_ds, val_ds_raw, classes = build_datasets(dataset_dir)
    num_classes = len(classes)
    model = build_model(num_classes)
    model.summary()

    if not args.no_report:
        report_dir.mkdir(parents=True, exist_ok=True)

    callbacks = [
        EarlyStopping(monitor="val_accuracy", patience=4, restore_best_weights=True),
        ModelCheckpoint(str(out_path), monitor="val_accuracy", save_best_only=True, verbose=1),
        ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2, min_lr=1e-7),
    ]

    # Phase 1 : tete seule
    print("\nPhase 1 : tete seule (base gelee)")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(LR_HEAD),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    history_head = model.fit(train_ds, validation_data=val_ds,
                             epochs=args.epochs_head, callbacks=callbacks)

    # Phase 2 : fine-tune des 30 dernieres couches
    print("\nPhase 2 : fine-tune")
    base = model.layers[1]
    base.trainable = True
    for layer in base.layers[:-30]:
        layer.trainable = False
    model.compile(
        optimizer=tf.keras.optimizers.Adam(LR_FINE),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    history_fine = model.fit(train_ds, validation_data=val_ds,
                             epochs=args.epochs_fine, callbacks=callbacks)

    # Sauvegarde
    if not out_path.exists():
        model.save(out_path)
    with open(classes_path, "w", encoding="utf-8") as f:
        for c in classes:
            f.write(f"{normalize_class_name(c)}\n")
    print(f"\nModele Keras : {out_path}")
    print(f"Classes      : {classes_path}  ({num_classes} classes)")

    if not args.no_report:
        save_training_curves(history_head, history_fine, report_dir)
        save_per_class_metrics(model, val_ds_raw, classes, report_dir)

    if not args.no_tflite:
        export_tflite(model, val_ds_raw, tflite_path)

    print("\nEntrainement termine.")
    print("  API cloud  -> uvicorn backend.main:app --reload")
    print("  App mobile -> copier my_model.tflite et classes.txt dans assets/ml/")


if __name__ == "__main__":
    main()
