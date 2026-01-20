import { Animal, GEOGRAPHY_DB, initialAnimals, Observation } from '@/constants/MarineData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// ⚠️ Ton URL Localtunnel (vérifie qu'elle est toujours active !)
const API_URL = 'https://curvy-rats-divide.loca.lt/predict'; 

export default function HomeScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // États pour la validation
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [tempSpeciesName, setTempSpeciesName] = useState<string>("");
  const [locationInput, setLocationInput] = useState<string>("");
  const [tempPhotoUri, setTempPhotoUri] = useState<string>("");

  // --- FONCTION DEVELOPPEUR : RESET TOTAL ---
  const resetProgress = async () => {
    Alert.alert(
      "Zone Danger (Dev)", 
      "Veux-tu vraiment effacer TOUT le Pokedex ET tout le Journal ?", 
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "TOUT EFFACER", style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('pokedex_save');
              await AsyncStorage.removeItem('user_logs');
              setSelectedImage(null);
              setTempSpeciesName("");
              Alert.alert("Reset Terminé", "L'application est comme neuve ! 🧹");
            } catch (e) {
              Alert.alert("Erreur", "Le reset a échoué.");
            }
          }
        }
      ]
    );
  };

  // --- 1. ENVOI DE L'IMAGE À L'IA ---
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setSelectedImage(imageUri);
      uploadImage(imageUri);
    }
  };

  const uploadImage = async (uri: string) => {
    setLoading(true);
    let formData = new FormData();
    formData.append('file', { uri: uri, name: 'photo.jpg', type: 'image/jpeg' } as any);

    try {
      let response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      let json = await response.json();
      
      if (json.species) {
          setTempSpeciesName(json.species);
          setTempPhotoUri(uri);
          setLocationInput(""); 
          setShowValidationModal(true);
      } else {
        Alert.alert("Zut", "L'IA n'a rien reconnu...");
      }

    } catch (error) {
      Alert.alert("Erreur", "Impossible de joindre le cerveau IA. Vérifie ton URL Localtunnel !");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. SAUVEGARDE FINALE (Corrigée pour la nouvelle BDD) ---
  const saveObservation = async () => {
    setShowValidationModal(false); 
    
    try {
      // A. GESTION DU POKEDEX (Déblocage par NOM)
      const savedPokedex = await AsyncStorage.getItem('pokedex_save');
      let currentAnimals: Animal[] = savedPokedex ? JSON.parse(savedPokedex) : initialAnimals;
      let foundNew = false;

      const updatedAnimals = currentAnimals.map((animal: Animal) => {
        // Comparaison souple (minuscules)
        const appName = animal.name.toLowerCase();
        const aiName = tempSpeciesName.toLowerCase();

        // Si l'IA trouve "Requin" et que l'appli a "Requin Tigre", ou correspondance exacte
        if (appName === aiName || aiName.includes(appName) || appName.includes(aiName)) {
             if (!animal.discovered) {
                 foundNew = true;
             }
             return { ...animal, discovered: true };
        }
        return animal;
      });

      if (foundNew) {
        await AsyncStorage.setItem('pokedex_save', JSON.stringify(updatedAnimals));
        Alert.alert("Bravo !", `Tu as débloqué : ${tempSpeciesName} !`);
      }

      // B. GESTION DU JOURNAL (Adaptée à la nouvelle interface Observation)
      
      // 1. On essaie de deviner l'océan à partir du pays saisi
      let detectedOcean = "Non précisé";
      const cleanLocation = locationInput.trim();
      
      if (cleanLocation) {
        // On cherche si le pays existe dans notre BDD Géographique
        const countryKey = Object.keys(GEOGRAPHY_DB).find(
            k => k.toLowerCase() === cleanLocation.toLowerCase()
        );
        
        if (countryKey) {
            // Si trouvé, on prend le premier océan de la liste par défaut
            detectedOcean = GEOGRAPHY_DB[countryKey][0];
        }
      }

      const newLog: Observation = {
          id: Date.now().toString(),
          speciesName: tempSpeciesName, // C'est ici qu'on utilise le NOM, plus l'ID
          date: new Date().toLocaleDateString(),
          userPhoto: tempPhotoUri,
          location: cleanLocation || "Inconnu",
          ocean: detectedOcean, // Le champ obligatoire est maintenant rempli
          notes: "Identifié via le Scanner IA"
      };

      const savedLogs = await AsyncStorage.getItem('user_logs');
      const currentLogs = savedLogs ? JSON.parse(savedLogs) : [];
      const updatedLogs = [newLog, ...currentLogs];
      
      await AsyncStorage.setItem('user_logs', JSON.stringify(updatedLogs));
      console.log("Observation sauvegardée !");

    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{alignItems: 'center', paddingBottom: 50}}>
        <Text style={styles.headerTitle}>🔎 Scanner</Text>
        <Text style={styles.subTitle}>Prends une photo pour identifier une espèce</Text>

        <TouchableOpacity style={styles.scanButton} onPress={pickImage}>
            <Text style={styles.scanButtonText}>
            {loading ? "Analyse en cours..." : "📷 Lancer l'analyse"}
            </Text>
        </TouchableOpacity>

        {selectedImage && (
            <View style={styles.previewContainer}>
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                {loading && <ActivityIndicator size="large" color="#006994" />}
            </View>
        )}

        <TouchableOpacity style={styles.debugButton} onPress={resetProgress}>
            <Text style={styles.debugText}>🗑️ RESET SAVE (DEV)</Text>
        </TouchableOpacity>

        {/* --- MODAL DE VALIDATION --- */}
        <Modal animationType="slide" transparent={true} visible={showValidationModal}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>✨ Espèce Identifiée !</Text>
                    <Text style={styles.modalSpecies}>IA : {tempSpeciesName}</Text>
                    
                    <Text style={styles.label}>Où as-tu vu cet animal ?</Text>
                    <TextInput 
                        style={styles.input}
                        placeholder="Ex: Costa Rica, La Réunion..."
                        value={locationInput}
                        onChangeText={setLocationInput}
                    />

                    <TouchableOpacity style={styles.saveButton} onPress={saveObservation}>
                        <Text style={styles.saveButtonText}>Valider et Enregistrer</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => setShowValidationModal(false)}>
                        <Text style={styles.cancelLink}>Annuler</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f8ff', paddingTop: 50 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#006994', textAlign: 'center', marginBottom: 5 },
  subTitle: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 30 },
  scanButton: { backgroundColor: '#006994', width: 200, height: 200, borderRadius: 100, justifyContent: 'center', alignItems: 'center', elevation: 10, marginBottom: 30 },
  scanButtonText: { color: 'white', fontWeight: 'bold', fontSize: 20, textAlign: 'center' },
  previewContainer: { alignItems: 'center', width: '100%', paddingHorizontal: 20 },
  previewImage: { width: 200, height: 200, borderRadius: 15, marginBottom: 20 },
  debugButton: { marginTop: 50, padding: 10, backgroundColor: '#ffcccc', borderRadius: 5, borderWidth: 1, borderColor: 'red' },
  debugText: { color: 'red', fontWeight: 'bold', fontSize: 12 },

  // Styles du Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', width: '80%', padding: 25, borderRadius: 20, alignItems: 'center', elevation: 5 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#006994', marginBottom: 10 },
  modalSpecies: { fontSize: 18, color: '#333', marginBottom: 20, fontStyle: 'italic' },
  label: { fontSize: 16, marginBottom: 10, fontWeight: '600' },
  input: { width: '100%', borderBottomWidth: 1, borderColor: '#ccc', padding: 10, fontSize: 16, marginBottom: 20, textAlign: 'center' },
  saveButton: { backgroundColor: '#28a745', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, elevation: 2, marginBottom: 15 },
  saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  cancelLink: { color: 'red', marginTop: 10 }
});