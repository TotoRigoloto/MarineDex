// Empty State réutilisable : grosse icône + titre + sous-titre + CTA optionnel.
// Bulles animées en arrière-plan pour un côté vivant.
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface Props {
  /** Emoji ou caractère central. */
  emoji: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
  /** Style optionnel pour le container. */
  style?: ViewStyle;
  /** Couleur du CTA (par défaut bleu marine). */
  ctaColor?: string;
}

/** Petite bulle qui flotte (effet aquatique). */
const FloatingBubble = ({
  size,
  left,
  top,
  delay,
}: {
  size: number;
  left: number;
  top: number;
  delay: number;
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(translateY, {
          toValue: -12,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, translateY]);
  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          left,
          top,
          transform: [{ translateY }],
        },
      ]}
    />
  );
};

export default function EmptyState({
  emoji,
  title,
  subtitle,
  ctaLabel,
  onCtaPress,
  style,
  ctaColor = "#006994",
}: Props) {
  return (
    <View style={[styles.container, style]}>
      {/* Bulles d'arrière-plan animées */}
      <FloatingBubble size={14} left={40} top={20} delay={0} />
      <FloatingBubble size={10} left={"30%" as any} top={70} delay={400} />
      <FloatingBubble size={18} left={"70%" as any} top={40} delay={800} />
      <FloatingBubble size={8} left={"85%" as any} top={130} delay={200} />

      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {ctaLabel && onCtaPress && (
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: ctaColor }]}
          onPress={onCtaPress}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaTxt}>{ctaLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    position: "relative",
  },
  bubble: {
    position: "absolute",
    backgroundColor: "rgba(0,105,148,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,105,148,0.15)",
  },
  emoji: { fontSize: 72, marginBottom: 16 },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#006994",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  cta: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 3,
  },
  ctaTxt: { color: "white", fontWeight: "bold", fontSize: 14 },
});
