import { IconSymbol } from "@/components/ui/icon-symbol.ios";
import { Ionicons } from "@expo/vector-icons"; // On utilise les icônes Ionicons
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: { position: "absolute" },
          default: {},
        }),
      }}
    >
      {/* 1. SCANNER (Page d'accueil) */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Scanner",
          tabBarIcon: ({ color }) => (
            <Ionicons name="camera" size={28} color={color} />
          ),
        }}
      />

      {/* 2. POKEDEX (La liste) */}
      <Tabs.Screen
        name="pokedex"
        options={{
          title: "Pokédex",
          tabBarIcon: ({ color }) => (
            <Ionicons name="book" size={28} color={color} />
          ),
        }}
      />

      {/* 3. LOGBOOK (Journal de bord - Vide pour l'instant) */}
      <Tabs.Screen
        name="logbook"
        options={{
          title: "Journal",
          tabBarIcon: ({ color }) => (
            <Ionicons name="journal" size={28} color={color} />
          ),
        }}
      />

      {/* 4. MAP (Carte - Vide pour l'instant) */}
      <Tabs.Screen
        name="map"
        options={{
          title: "Carte",
          tabBarIcon: ({ color }) => (
            <Ionicons name="globe" size={28} color={color} />
          ),
        }}
      />

      {/* 4. MAP (Carte - Vide pour l'instant) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
      {/* Explore masqué — contenu migré dans revosea.tsx */}
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
