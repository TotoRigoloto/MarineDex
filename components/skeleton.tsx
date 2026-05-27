// Skeleton loaders : affichés pendant le chargement initial des listes.
// Pulse animé via opacity (Animated, RN core, pas de dépendance).
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";

/** Base : un rectangle qui pulse. */
export const SkeletonBox = ({
  width,
  height,
  borderRadius = 8,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.box,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
};

/** Skeleton d'une carte observation (image + 3 lignes texte). */
export const SkeletonObsCard = () => (
  <View style={styles.obsRow}>
    <SkeletonBox width={70} height={70} borderRadius={10} />
    <View style={styles.obsContent}>
      <SkeletonBox width="60%" height={14} />
      <SkeletonBox width="40%" height={11} style={{ marginTop: 6 }} />
      <SkeletonBox width="80%" height={11} style={{ marginTop: 4 }} />
    </View>
  </View>
);

/** Skeleton d'une carte voyage. */
export const SkeletonTripCard = () => (
  <View style={styles.tripCard}>
    <SkeletonBox width="100%" height={150} borderRadius={0} />
    <View style={styles.tripMeta}>
      <SkeletonBox width={40} height={20} />
      <SkeletonBox width={40} height={20} />
      <SkeletonBox width={120} height={14} />
    </View>
  </View>
);

/** Skeleton d'une carte Pokédex (image + nom + rareté). */
export const SkeletonPokedexCard = () => (
  <View style={styles.pokedexCard}>
    <SkeletonBox width={80} height={80} borderRadius={40} />
    <SkeletonBox
      width={90}
      height={12}
      style={{ marginTop: 10 }}
    />
    <SkeletonBox width={60} height={10} style={{ marginTop: 6 }} />
  </View>
);

/** Liste : N skeletons d'un type donné. */
export const SkeletonList = ({
  count = 3,
  type = "obs",
}: {
  count?: number;
  type?: "obs" | "trip" | "pokedex";
}) => {
  const items = Array.from({ length: count });
  const Comp =
    type === "trip"
      ? SkeletonTripCard
      : type === "pokedex"
        ? SkeletonPokedexCard
        : SkeletonObsCard;
  return (
    <View style={{ padding: 15 }}>
      {items.map((_, i) => (
        <Comp key={i} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  box: { backgroundColor: "#dbe7f0" },
  obsRow: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 10,
    marginBottom: 12,
    elevation: 1,
  },
  obsContent: { flex: 1, marginLeft: 15, justifyContent: "center" },
  tripCard: {
    backgroundColor: "white",
    borderRadius: 18,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
  },
  tripMeta: {
    flexDirection: "row",
    padding: 12,
    gap: 14,
    alignItems: "center",
  },
  pokedexCard: {
    flex: 1,
    backgroundColor: "white",
    margin: 6,
    padding: 10,
    borderRadius: 15,
    alignItems: "center",
    elevation: 1,
  },
});
