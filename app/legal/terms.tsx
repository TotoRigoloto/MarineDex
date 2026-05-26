// Conditions Générales d'Utilisation — TEMPLATE
// À faire valider par un juriste avant publication.
import { router } from "expo-router";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const LAST_UPDATE = "26 mai 2026";
const CONTACT_EMAIL = "contact@revosea.com";

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conditions d&apos;utilisation</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.updated}>Dernière mise à jour : {LAST_UPDATE}</Text>

        <Section title="1. Acceptation des conditions">
          En téléchargeant, installant ou utilisant MarineDex, vous acceptez
          les présentes Conditions Générales d&apos;Utilisation. Si vous ne les
          acceptez pas, n&apos;utilisez pas l&apos;application.
        </Section>

        <Section title="2. Description du service">
          MarineDex est une application gratuite qui vous permet d&apos;identifier
          les espèces marines, de tenir un journal de vos observations, de
          créer des storyboards de voyage et de consulter les aires marines
          protégées. L&apos;app est éditée par l&apos;association Revosea.
        </Section>

        <Section title="3. Compte utilisateur">
          La création d&apos;un compte est requise pour utiliser l&apos;application.
          Vous êtes responsable de la confidentialité de vos identifiants. Vous
          devez avoir au moins 13 ans pour créer un compte (16 ans dans l&apos;UE
          sans accord parental).
        </Section>

        <Section title="4. Contenu utilisateur">
          Les photos, observations et notes que vous publiez restent votre
          propriété. En les téléversant sur nos serveurs (si sync activée),
          vous nous accordez une licence non exclusive pour les stocker et les
          afficher uniquement dans le cadre du service. Vous garantissez avoir
          le droit de publier ce contenu.
        </Section>

        <Section title="5. Utilisation interdite">
          Il est interdit d&apos;utiliser MarineDex pour :
          <Bullet>publier du contenu illégal, offensant ou portant atteinte aux droits d&apos;autrui ;</Bullet>
          <Bullet>perturber ou compromettre la sécurité de l&apos;application ;</Bullet>
          <Bullet>extraire massivement les données (scraping) ;</Bullet>
          <Bullet>usurper l&apos;identité d&apos;une autre personne ;</Bullet>
          <Bullet>perturber les écosystèmes marins observés (harceler des animaux, prélever, etc.).</Bullet>
        </Section>

        <Section title="6. Propriété intellectuelle">
          L&apos;application, son code, son design et son contenu encyclopédique
          sont la propriété de Revosea et de ses contributeurs, protégés par le
          droit d&apos;auteur. Toute reproduction non autorisée est interdite.
        </Section>

        <Section title="7. Exactitude des identifications">
          Les identifications fournies par notre IA sont des suggestions et
          peuvent être incorrectes. MarineDex ne saurait être tenu responsable
          de décisions prises sur la base d&apos;une identification erronée
          (notamment pour évaluer la dangerosité d&apos;une espèce). En cas de
          doute, gardez vos distances.
        </Section>

        <Section title="8. Modification du service">
          Nous nous réservons le droit de modifier, suspendre ou interrompre
          tout ou partie de l&apos;application à tout moment, avec un préavis
          raisonnable lorsque c&apos;est possible.
        </Section>

        <Section title="9. Limitation de responsabilité">
          MarineDex est fourni &laquo; tel quel &raquo;. Nous ne garantissons
          pas l&apos;absence d&apos;erreurs ou la disponibilité continue. Notre
          responsabilité est limitée au montant payé pour l&apos;application
          (zéro pour la version gratuite), sauf en cas de faute lourde ou
          intentionnelle.
        </Section>

        <Section title="10. Résiliation">
          Vous pouvez supprimer votre compte à tout moment depuis Réglages.
          Nous pouvons résilier votre accès en cas de violation grave des
          présentes conditions, après notification quand c&apos;est possible.
        </Section>

        <Section title="11. Droit applicable">
          Les présentes CGU sont régies par le droit français. Tout litige
          relève de la compétence des tribunaux français, sous réserve des
          dispositions impératives protégeant le consommateur.
        </Section>

        <Section title="12. Contact">
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
