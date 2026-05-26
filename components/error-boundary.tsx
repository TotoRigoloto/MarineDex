// Error Boundary global : catch les crashs React (white screen of death)
// et affiche un écran de fallback "propre" + bouton pour recharger.
// Branchable plus tard sur Sentry / Crashlytics pour le suivi prod.
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // En production on enverrait vers Sentry, Bugsnag, Crashlytics…
    // Pour l'instant on log juste dans la console.
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: undefined });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.emoji}>🐠</Text>
          <Text style={styles.title}>Oups, quelque chose a coulé</Text>
          <Text style={styles.subtitle}>
            Une erreur inattendue s&apos;est produite. Pas de panique, tes
            données sont sauvegardées.
          </Text>

          {__DEV__ && this.state.error && (
            <View style={styles.devBox}>
              <Text style={styles.devTitle}>DEV — Détails de l&apos;erreur</Text>
              <Text style={styles.devText} selectable>
                {this.state.error.message}
              </Text>
              <Text style={styles.devText} selectable>
                {this.state.error.stack?.slice(0, 800)}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.button} onPress={this.reset}>
            <Text style={styles.buttonText}>🔄 Réessayer</Text>
          </TouchableOpacity>

          <Text style={styles.legal}>
            Si le problème persiste, contactez-nous via la page Réglages.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#001a2c" },
  scroll: { padding: 30, paddingTop: 80, alignItems: "center" },
  emoji: { fontSize: 80, marginBottom: 20 },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  devBox: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#FFB300",
  },
  devTitle: { color: "#FFB300", fontWeight: "bold", marginBottom: 6 },
  devText: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "monospace" },
  button: {
    backgroundColor: "#FFB300",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 4,
  },
  buttonText: { color: "#01304a", fontWeight: "bold", fontSize: 16 },
  legal: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 24,
    textAlign: "center",
  },
});
