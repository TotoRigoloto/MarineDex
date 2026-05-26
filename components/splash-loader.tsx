// Splash / loader animé : bulles qui montent, logo qui pulse.
// Affiché pendant la vérification d'authentification et les chargements longs.
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from "react-native";

const { width, height } = Dimensions.get("window");

// Une "bulle" qui monte indéfiniment
const Bubble = ({
  size,
  left,
  delay,
  duration,
}: {
  size: number;
  left: number;
  delay: number;
  duration: number;
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -height - 100,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.6,
              duration: duration * 0.2,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: duration * 0.8,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, duration, opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          left,
          bottom: -size,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    />
  );
};

export default function SplashLoader({ subtitle }: { subtitle?: string }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  // Génère 15 bulles à positions et tailles aléatoires
  const bubbles = Array.from({ length: 15 }).map((_, i) => ({
    size: 8 + Math.random() * 28,
    left: Math.random() * width,
    delay: Math.random() * 4000,
    duration: 4000 + Math.random() * 5000,
  }));

  return (
    <View style={styles.container}>
      {/* Fond dégradé simulé par 3 couches superposées (sans dépendance externe) */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#001a2c" }]} />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "#004d70", opacity: 0.7, top: height * 0.2 },
        ]}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "#006994", opacity: 0.5, top: height * 0.5 },
        ]}
      />

      {/* Bulles animées */}
      {bubbles.map((b, i) => (
        <Bubble key={i} {...b} />
      ))}

      {/* Logo + titre */}
      <View style={styles.center}>
        <Animated.View
          style={[styles.logoCircle, { transform: [{ scale: pulse }] }]}
        >
          <Text style={styles.logoEmoji}>🌊</Text>
        </Animated.View>
        <Text style={styles.appName}>MarineDex</Text>
        <Text style={styles.tagline}>
          Explorez. Identifiez. Protégez.
        </Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#001a2c",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  bubble: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  center: { alignItems: "center", zIndex: 10 },
  logoCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    marginBottom: 20,
  },
  logoEmoji: { fontSize: 70 },
  appName: {
    fontSize: 38,
    fontWeight: "bold",
    color: "white",
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 8,
    fontStyle: "italic",
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: 30,
  },
});
