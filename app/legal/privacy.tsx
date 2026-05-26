// Politique de confidentialité — TEMPLATE
// IMPORTANT : à faire valider par un juriste avant publication sur les stores.
// Ce template couvre les exigences GDPR (UE), CCPA (Californie) et App Store / Google Play.
import { router } from "expo-router";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const LAST_UPDATE = "26 mai 2026";
const CONTACT_EMAIL = "contact@revosea.com"; // À adapter

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confidentialité</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.updated}>Dernière mise à jour : {LAST_UPDATE}</Text>

        <Section title="1. Qui sommes-nous ?">
          MarineDex est une application développée en partenariat avec
          l&apos;association Revosea. Le responsable du traitement des données
          est Revosea, joignable à l&apos;adresse {CONTACT_EMAIL}.
        </Section>

        <Section title="2. Quelles données collectons-nous ?">
          <Bullet>
            <Strong>Informations de compte</Strong> : pseudo, email (optionnel),
            avatar choisi. Stockés localement et synchronisés avec votre compte
            Revosea si vous l&apos;activez.
          </Bullet>
          <Bullet>
            <Strong>Observations</Strong> : espèce identifiée, date, lieu,
            coordonnées GPS si vous les fournissez, photos que vous ajoutez,
            notes personnelles.
          </Bullet>
          <Bullet>
            <Strong>Voyages</Strong> : nom, pays, dates, photo de couverture,
            notes.
          </Bullet>
          <Bullet>
            <Strong>Données techniques</Strong> : version de l&apos;app, type
            d&apos;appareil. Aucune donnée publicitaire n&apos;est collectée.
          </Bullet>
        </Section>

        <Section title="3. Pourquoi collectons-nous ces données ?">
          <Bullet>Tenir votre carnet de bord d&apos;exploration marine.</Bullet>
          <Bullet>Permettre l&apos;identification d&apos;espèces via notre modèle IA (envoi temporaire de la photo, non conservée côté serveur).</Bullet>
          <Bullet>Synchroniser vos données entre vos appareils (si compte cloud activé).</Bullet>
          <Bullet>Améliorer l&apos;application (statistiques anonymes uniquement).</Bullet>
        </Section>

        <Section title="4. Avec qui partageons-nous vos données ?">
          Vos données personnelles ne sont jamais vendues à des tiers. Nous
          utilisons :
          <Bullet>
            <Strong>Supabase</Strong> (hébergé dans l&apos;Union européenne) pour
            le stockage de votre compte et de vos observations.
          </Bullet>
          <Bullet>
            Notre serveur d&apos;identification IA (privé, hébergé en UE) pour
            analyser temporairement vos photos. Les images ne sont pas
            conservées après analyse.
          </Bullet>
        </Section>

        <Section title="5. Combien de temps gardons-nous vos données ?">
          Vos observations et voyages sont conservés tant que votre compte est
          actif. Vous pouvez les exporter ou les supprimer à tout moment depuis
          la page Réglages → &laquo; Mes données &raquo;.
        </Section>

        <Section title="6. Vos droits (RGPD)">
          Conformément au Règlement Général sur la Protection des Données, vous
          disposez des droits suivants :
          <Bullet>
            <Strong>Accès</Strong> : exporter toutes vos données au format JSON.
          </Bullet>
          <Bullet>
            <Strong>Rectification</Strong> : modifier votre profil et vos
            observations à tout moment.
          </Bullet>
          <Bullet>
            <Strong>Effacement</Strong> : supprimer votre compte et toutes vos
            données via Réglages → Supprimer mon compte.
          </Bullet>
          <Bullet>
            <Strong>Portabilité</Strong> : récupérer vos données dans un format
            structuré.
          </Bullet>
          <Bullet>
            <Strong>Opposition</Strong> : refuser certains traitements.
          </Bullet>
          Pour exercer ces droits, contactez-nous à {CONTACT_EMAIL}.
        </Section>

        <Section title="7. Permissions de l'appareil">
          MarineDex demande l&apos;accès à :
          <Bullet>
            <Strong>L&apos;appareil photo</Strong> : pour scanner les espèces et
            photographier vos observations.
          </Bullet>
          <Bullet>
            <Strong>La photothèque</Strong> : pour sélectionner des photos
            existantes.
          </Bullet>
          <Bullet>
            <Strong>La position GPS</Strong> : pour géolocaliser vos
            observations sur la carte et trouver les aires marines protégées
            proches.
          </Bullet>
          Ces accès sont demandés au moment où vous utilisez les fonctionnalités
          concernées et peuvent être révoqués à tout moment dans les réglages
          de votre appareil.
        </Section>

        <Section title="8. Sécurité">
          Vos données sont chiffrées en transit (HTTPS / TLS) et au repos sur
          nos serveurs. Vos mots de passe sont hashés. Aucun système n&apos;est
          infaillible : en cas de violation, nous nous engageons à vous
          notifier dans les 72 heures.
        </Section>

        <Section title="9. Enfants">
          MarineDex n&apos;est pas destiné aux enfants de moins de 13 ans. Si
          vous êtes un parent et constatez que votre enfant nous a fourni des
          données personnelles, contactez-nous pour suppression.
        </Section>

        <Section title="10. Modifications">
          Cette politique peut être mise à jour. Toute modification sera
          notifiée dans l&apos;application. La date en haut de cette page
          reflète la dernière révision.
        </Section>

        <Section title="11. Nous contacter">
          Pour toute question relative à vos données :{" "}
          <Strong>{CONTACT_EMAIL}</Strong>
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.body}>{children}</Text>
  </View>
);
const Bullet = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.bullet}>{"\n"}• {children}</Text>
);
const Strong = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.strong}>{children}</Text>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f8ff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "white",
    elevation: 2,
  },
  back: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  backTxt: { fontSize: 22, color: "#006994", fontWeight: "bold" },
  headerTitle: { flex: 1, textAlign: "center", fontWeight: "bold", color: "#006994", fontSize: 17 },
  scroll: { padding: 20 },
  updated: { fontSize: 12, color: "#888", fontStyle: "italic", marginBottom: 16 },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#006994", marginBottom: 6 },
  body: { fontSize: 14, color: "#333", lineHeight: 22 },
  bullet: { fontSize: 14, color: "#333", lineHeight: 22 },
  strong: { fontWeight: "bold", color: "#006994" },
});
