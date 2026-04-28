import {
  COUNTRY_COORDINATES,
  ENCYCLOPEDIA_DATA,
  Observation,
} from "@/constants/MarineData";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import MapView, { Callout, Marker } from "react-native-maps";

// On définit un type pour nos points sur la carte
interface MapPoint {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  species: string;
  date: string;
  imageSource: any; // Ajout pour gérer l'image (URI ou require)
}

export default function MapScreen() {
  const [points, setPoints] = useState<MapPoint[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadPoints();
    }, []),
  );

  const loadPoints = async () => {
    try {
      const savedLogs = await AsyncStorage.getItem("user_logs");
      if (savedLogs) {
        const logs: Observation[] = JSON.parse(savedLogs);

        const mapPoints = logs.map((log) => {
          let lat = log.latitude;
          let lon = log.longitude;

          // LOGIQUE DE REPLI (FALLBACK)
          // Si on n'a pas de coordonnées GPS précises, on utilise le pays ET l'océan
          if (!lat || !lon) {
            const cleanLoc = log.location.trim();
            // On cherche le pays dans COUNTRY_COORDINATES
            const countryEntry = COUNTRY_COORDINATES[cleanLoc];

            if (countryEntry) {
              // On essaie de trouver les coords pour l'océan spécifié, sinon on prend le premier dispo
              const oceanCoords =
                countryEntry[log.ocean] || Object.values(countryEntry)[0];

              if (oceanCoords) {
                // Simulation de décalage aléatoire
                const randomOffsetLat = (Math.random() - 0.5) * 0.5;
                const randomOffsetLon = (Math.random() - 0.5) * 0.5;
                lat = oceanCoords.latitude + randomOffsetLat;
                lon = oceanCoords.longitude + randomOffsetLon;
              }
            }

            // Si toujours rien (Pays inconnu), on met une valeur par défaut (Sahara/Océan)
            if (!lat) lat = 20;
            if (!lon) lon = 0;
          }

          // GESTION DE L'IMAGE
          // Priorité : Photo utilisateur > Image Encyclopédie > Rien
          let imgSource = null;
          if (log.userPhoto) {
            imgSource = { uri: log.userPhoto };
          } else if (ENCYCLOPEDIA_DATA[log.speciesName]) {
            imgSource = ENCYCLOPEDIA_DATA[log.speciesName].image;
          }

          return {
            id: log.id,
            title: log.speciesName,
            latitude: lat,
            longitude: lon,
            species: log.speciesName,
            date: log.date,
            imageSource: imgSource,
          };
        });

        setPoints(mapPoints);
      }
    } catch (e) {
      console.error("Erreur chargement carte:", e);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 20,
          longitude: 0,
          latitudeDelta: 100,
          longitudeDelta: 100,
        }}
      >
        {points.map((point) => (
          <Marker
            key={point.id}
            coordinate={{
              latitude: point.latitude,
              longitude: point.longitude,
            }}
            // On n'utilise plus pinColor, on rend une vue personnalisée à l'intérieur
          >
            <View style={styles.markerContainer}>
              {point.imageSource ? (
                <Image source={point.imageSource} style={styles.markerImage} />
              ) : (
                <View style={styles.defaultMarker} />
              )}
              {/* Petit triangle pour faire l'effet 'Pin' */}
              <View style={styles.arrow} />
            </View>

            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{point.species}</Text>
                <Text>📅 {point.date}</Text>
                <Text style={styles.calloutCoords}>
                  Lat: {point.latitude.toFixed(3)} | Lon:{" "}
                  {point.longitude.toFixed(3)}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  // Nouveaux styles pour les marqueurs photos
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
  },
  markerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "white",
    backgroundColor: "#006994",
  },
  defaultMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ff5a5f",
    borderWidth: 2,
    borderColor: "white",
  },
  arrow: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 0,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "white", // Pointe blanche sous la photo
    marginTop: -2,
  },
  callout: {
    padding: 10,
    minWidth: 150,
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
    color: "#006994",
  },
  calloutCoords: {
    fontSize: 10,
    color: "#888",
    marginTop: 5,
    fontStyle: "italic",
  },
});
