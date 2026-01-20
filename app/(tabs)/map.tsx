import { COUNTRY_COORDINATES, ENCYCLOPEDIA_DATA, Observation } from '@/constants/MarineData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker, PROVIDER_DEFAULT } from 'react-native-maps';

export default function MapScreen() {
  const [logs, setLogs] = useState<Observation[]>([]);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadLogs();
      getUserLocation();
    }, [])
  );

  const loadLogs = async () => {
    try {
      const savedLogs = await AsyncStorage.getItem('user_logs');
      if (savedLogs) setLogs(JSON.parse(savedLogs));
    } catch (e) { console.error(e); }
  };

  const getUserLocation = async () => {
    // 1. Demander la permission
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission refusée", "La carte ne pourra pas centrer sur ta position.");
      return;
    }

    // 2. Récupérer la position
    let location = await Location.getCurrentPositionAsync({});
    setUserLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        showsUserLocation={true} // Affiche le point bleu "Je suis ici"
        initialRegion={{
            // Vue par défaut (Europe/Afrique) si pas de GPS
            latitude: 20, 
            longitude: 10,
            latitudeDelta: 60,
            longitudeDelta: 60,
        }}
      >
        {logs.map((log) => {
            // 1. Déterminer la position du marqueur
            let coords = null;

            if (log.latitude && log.longitude) {
                // A. On a le GPS exact (futur)
                coords = { latitude: log.latitude, longitude: log.longitude };
            } else if (COUNTRY_COORDINATES[log.location]) {
                // B. RECHERCHE INTELLIGENTE PAR OCÉAN 🧠
                const countryData = COUNTRY_COORDINATES[log.location];
                
                // On essaie de trouver les coordonnées spécifiques à l'océan noté
                let specificPoint = countryData[log.ocean];
                
                // Si on ne trouve pas l'océan exact (ou s'il est "Non précisé"), 
                // on prend le premier océan disponible pour ce pays par défaut.
                if (!specificPoint) {
                    const availableOceans = Object.values(countryData);
                    if (availableOceans.length > 0) {
                        specificPoint = availableOceans[0];
                    }
                }

                if (specificPoint) {
                    // On ajoute toujours un petit décalage aléatoire pour éviter que les points
                    // ne se superposent parfaitement si on a vu 10 animaux au même endroit.
                    coords = {
                        latitude: specificPoint.latitude + (Math.random() - 0.5) * 0.5,
                        longitude: specificPoint.longitude + (Math.random() - 0.5) * 0.5
                    };
                }
            }

            if (!coords) return null; // Pays introuvable ? On ignore.

            // 2. Trouver l'image à afficher (reste inchangé)
            const encycloInfo = ENCYCLOPEDIA_DATA[log.speciesName];
            const imageSource = log.userPhoto ? { uri: log.userPhoto } : (encycloInfo ? encycloInfo.image : null);

            return (
                <Marker
                    key={log.id}
                    coordinate={coords}
                    title={log.speciesName}
                    description={`${log.date} - ${log.location}`}
                >
                    <View style={styles.markerContainer}>
                        <View style={styles.markerBubble}>
                            {imageSource && (
                                <Image source={imageSource} style={styles.markerImage} />
                            )}
                        </View>
                        <View style={styles.markerArrow} />
                    </View>

                    <Callout>
                        <View style={{padding: 5, alignItems:'center'}}>
                            <Text style={{fontWeight:'bold'}}>{log.speciesName}</Text>
                            <Text>{log.location} ({log.ocean})</Text>
                        </View>
                    </Callout>
                </Marker>
            );
        })}
      </MapView>

      {/* Titre flottant par dessus la carte */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>🌍 Carte des Explorations</Text>
        <Text style={styles.subTitle}>{logs.length} observations placées</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  
  headerContainer: {
      position: 'absolute',
      top: 50,
      left: 20,
      right: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: 15,
      borderRadius: 20,
      elevation: 5,
      alignItems: 'center',
      shadowColor: '#000', shadowOffset:{width:0, height:2}, shadowOpacity:0.2
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#006994' },
  subTitle: { fontSize: 12, color: '#666' },

  // Styles du Marqueur Custom
  markerContainer: { alignItems: 'center' },
  markerBubble: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'white',
      borderWidth: 2,
      borderColor: '#006994',
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4
  },
  markerImage: { width: '100%', height: '100%' },
  markerArrow: {
      width: 0, height: 0,
      backgroundColor: 'transparent',
      borderStyle: 'solid',
      borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 8,
      borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#006994',
      marginTop: -1
  }
});