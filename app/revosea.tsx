// Page de présentation de l'association Revosea.
// COQUILLE À COMPLÉTER : remplacez les TODO par votre contenu réel.
// La structure est prête : héros, mission, actions, équipe, contact, faire un don.
import { router } from "expo-router";
import React from "react";
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ============== CHARTE DU PLONGEUR ==============
const CHARTE_TO_DO = [
  { icon: "📏", text: "Garder ses distances" },
  { icon: "🧴", text: 'Crème solaire "Reef Safe"' },
  { icon: "🏅", text: "Opérateurs certifiés" },
  { icon: "🚨", text: "Signaler les abus" },
  { icon: "🤫", text: "Rester discret" },
  { icon: "🗑️", text: "Rapporter ses déchets" },
];

const CHARTE_TO_AVOID = [
  { icon: "✋", text: "Toucher les animaux" },
  { icon: "🚧", text: "Bloquer la trajectoire" },
  { icon: "🍔", text: "Nourrir les animaux" },
  { icon: "🥾", text: "Marcher sur les coraux" },
  { icon: "📸", text: "Utiliser le flash" },
  { icon: "🐚", text: 'Rapporter des "souvenirs"' },
];

const CHARTE_ARTICLES = [
  {
    title: "Requins baleines : les règles d'or",
    desc: "Distances, comportements à éviter, et conseils pour une observation responsable.",
    url: "https://revosea.com/blog",
    emoji: "🐋",
  },
  {
    title: "Les coraux blancs ne sont pas morts",
    desc: "Un corail blanchi est en détresse, pas forcément mort. Apprenez à le protéger.",
    url: "https://revosea.com/blog",
    emoji: "🪸",
  },
];

// ============== CONTENU À REMPLIR ==============
// Modifiez ces valeurs avec les informations réelles de Revosea.
const REVOSEA = {
  name: "Revosea",
  tagline: "TODO — slogan de l'association",
  description:
    "TODO — Présentez ici la mission de Revosea en quelques phrases : qui vous êtes, ce que vous défendez, pourquoi vous existez.",

  website: "https://revosea.com",
  email: "contact@revosea.com", // TODO
  instagram: null as string | null, // ex: "https://instagram.com/revosea"
  facebook: null as string | null,
  donateUrl: null as string | null, // ex: "https://helloasso.com/..."

  // Actions menées (3-6 cartes idéalement)
  actions: [
    {
      icon: "🌊",
      title: "TODO — Action 1",
      desc: "TODO — Décrivez en une phrase.",
    },
    {
      icon: "🐢",
      title: "TODO — Action 2",
      desc: "TODO — Décrivez en une phrase.",
    },
    {
      icon: "📣",
      title: "TODO — Action 3",
      desc: "TODO — Décrivez en une phrase.",
    },
  ],

  // Chiffres clés
  stats: [
    { value: "—", label: "TODO" },
    { value: "—", label: "TODO" },
    { value: "—", label: "TODO" },
  ],

  // Équipe (optionnel) — laissez vide pour masquer
  team: [
    // { name: "Prénom Nom", role: "Fondateur", emoji: "👨‍🔬" },
  ] as { name: string; role: string; emoji: string }[],
};
// ================================================

export default function RevoseaScreen() {
  const openLink = (url: string | null) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* HERO */}
        <View style={styles.hero}>
          <TouchableOpacity
            style={styles.backBubble}
            onPress={() => router.back()}
          >
            <Text style={{ color: "white", fontSize: 22, fontWeight: "bold" }}>
              ←
            </Text>
          </TouchableOpacity>

          <View style={styles.heroLogo}>
            <Text style={{ fontSize: 60 }}>🐬</Text>
          </View>
          <Text style={styles.heroTitle}>{REVOSEA.name}</Text>
          <Text style={styles.heroTagline}>{REVOSEA.tagline}</Text>

          <TouchableOpacity
            style={styles.heroLink}
            onPress={() => openLink(REVOSEA.website)}
          >
            <Text style={styles.heroLinkTxt}>
              🌐 {REVOSEA.website.replace("https://", "")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* MISSION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notre mission</Text>
          <Text style={styles.sectionBody}>{REVOSEA.description}</Text>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          {REVOSEA.stats.map((s, i) => (
            <View key={i} style={styles.statBox}>
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ACTIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nos actions</Text>
          {REVOSEA.actions.map((a, i) => (
            <View key={i} style={styles.actionCard}>
              <View style={styles.actionIcon}>
                <Text style={{ fontSize: 28 }}>{a.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>{a.title}</Text>
                <Text style={styles.actionDesc}>{a.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CHARTE DU PLONGEUR */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌊 Charte du Plongeur</Text>
          <Text style={styles.sectionBody}>
            Adopte les bons réflexes pour protéger l&apos;océan et ses
            habitants.
          </Text>

          {/* À FAIRE */}
          <View style={[styles.charteCard, { backgroundColor: "#f4fbf8" }]}>
            <View style={[styles.charteHeader, { backgroundColor: "#a8e6cf" }]}>
              <Text style={[styles.charteHeaderTxt, { color: "#2e7d32" }]}>
                ✅ À FAIRE
              </Text>
            </View>
            <View style={styles.charteGrid}>
              {CHARTE_TO_DO.map((item, index) => (
                <View key={index} style={styles.charteItem}>
                  <View style={[styles.charteIcon, { borderColor: "#4CAF50" }]}>
                    <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                  </View>
                  <Text style={styles.charteItemTxt}>{item.text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* À ÉVITER */}
          <View style={[styles.charteCard, { backgroundColor: "#fff5f5" }]}>
            <View style={[styles.charteHeader, { backgroundColor: "#ffcccb" }]}>
              <Text style={[styles.charteHeaderTxt, { color: "#d32f2f" }]}>
                ❌ À ÉVITER
              </Text>
            </View>
            <View style={styles.charteGrid}>
              {CHARTE_TO_AVOID.map((item, index) => (
                <View key={index} style={styles.charteItem}>
                  <View style={[styles.charteIcon, { borderColor: "#d32f2f" }]}>
                    <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                    <Text style={styles.charteForbidden}>🚫</Text>
                  </View>
                  <Text style={styles.charteItemTxt}>{item.text}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ARTICLES — Comprendre pour mieux protéger */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Comprendre pour mieux protéger
          </Text>
          <Text style={[styles.sectionBody, { marginBottom: 12 }]}>
            Découvre les articles de Revosea
          </Text>
          {CHARTE_ARTICLES.map((article, index) => (
            <TouchableOpacity
              key={index}
              style={styles.articleCard}
              onPress={() => openLink(article.url)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 30, marginRight: 15 }}>
                {article.emoji}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleDesc}>{article.desc}</Text>
              </View>
              <Text style={{ fontSize: 20, color: "#006994", marginLeft: 10 }}>
                →
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.websiteBtn}
            onPress={() => openLink("https://revosea.com")}
          >
            <Text style={styles.websiteBtnTxt}>🌍 Visiter Revosea.com</Text>
          </TouchableOpacity>
        </View>

        {/* ÉQUIPE (si renseignée) */}
        {REVOSEA.team.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>L&apos;équipe</Text>
            <View style={styles.teamRow}>
              {REVOSEA.team.map((m, i) => (
                <View key={i} style={styles.teamCard}>
                  <View style={styles.teamAvatar}>
                    <Text style={{ fontSize: 32 }}>{m.emoji}</Text>
                  </View>
                  <Text style={styles.teamName}>{m.name}</Text>
                  <Text style={styles.teamRole}>{m.role}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* RELATION AVEC MARINEDEX */}
        <View style={styles.linkCard}>
          <Text style={{ fontSize: 28 }}>🤝</Text>
          <Text style={styles.linkCardTitle}>MarineDex × Revosea</Text>
          <Text style={styles.linkCardDesc}>
            TODO — Expliquez ici comment l&apos;app MarineDex soutient
            l&apos;association : reversement, sensibilisation, partage de
            données d&apos;observation, etc.
          </Text>
        </View>

        {/* DON */}
        {REVOSEA.donateUrl && (
          <TouchableOpacity
            style={styles.donateBtn}
            onPress={() => openLink(REVOSEA.donateUrl)}
          >
            <Text style={styles.donateBtnTxt}>💙 Faire un don</Text>
          </TouchableOpacity>
        )}

        {/* CONTACT / LIENS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nous contacter</Text>
          <ContactRow
            icon="📧"
            label="Email"
            value={REVOSEA.email}
            onPress={() => Linking.openURL(`mailto:${REVOSEA.email}`)}
          />
          <ContactRow
            icon="🌐"
            label="Site web"
            value={REVOSEA.website}
            onPress={() => openLink(REVOSEA.website)}
          />
          {REVOSEA.instagram && (
            <ContactRow
              icon="📷"
              label="Instagram"
              value={REVOSEA.instagram.replace("https://", "")}
              onPress={() => openLink(REVOSEA.instagram)}
            />
          )}
          {REVOSEA.facebook && (
            <ContactRow
              icon="📘"
              label="Facebook"
              value={REVOSEA.facebook.replace("https://", "")}
              onPress={() => openLink(REVOSEA.facebook)}
            />
          )}
        </View>

        <Text style={styles.footer}>Avec ❤️ depuis MarineDex</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const ContactRow = ({
  icon,
  label,
  value,
  onPress,
}: {
  icon: string;
  label: string;
  value: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity style={styles.contactRow} onPress={onPress}>
    <Text style={{ fontSize: 20, marginRight: 12 }}>{icon}</Text>
    <View style={{ flex: 1 }}>
      <Text style={styles.contactLabel}>{label}</Text>
      <Text style={styles.contactValue}>{value}</Text>
    </View>
    <Text style={{ color: "#006994" }}>→</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f8ff" },

  hero: {
    backgroundColor: "#006994",
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: "relative",
  },
  backBubble: {
    position: "absolute",
    top: 50,
    left: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroLogo: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)",
    marginBottom: 15,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    letterSpacing: 1,
  },
  heroTagline: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    marginTop: 6,
    fontStyle: "italic",
    textAlign: "center",
  },
  heroLink: {
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  heroLinkTxt: { color: "white", fontWeight: "bold", fontSize: 13 },

  section: {
    backgroundColor: "white",
    margin: 14,
    padding: 18,
    borderRadius: 18,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#006994",
    marginBottom: 10,
  },
  sectionBody: {
    fontSize: 14,
    color: "#444",
    lineHeight: 22,
  },

  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: "white",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    elevation: 2,
  },
  statVal: { fontSize: 22, fontWeight: "bold", color: "#006994" },
  statLbl: { fontSize: 11, color: "#666", marginTop: 4, textAlign: "center" },

  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f6fbff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionTitle: { fontWeight: "bold", color: "#333", fontSize: 14 },
  actionDesc: { color: "#666", fontSize: 12, marginTop: 2 },

  teamRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  teamCard: {
    width: "47%",
    backgroundColor: "#f6fbff",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  teamAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  teamName: { fontWeight: "bold", color: "#333", fontSize: 13 },
  teamRole: { fontSize: 11, color: "#666" },

  linkCard: {
    backgroundColor: "#fff8e1",
    margin: 14,
    padding: 18,
    borderRadius: 18,
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: "#FFB300",
  },
  linkCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#5d4037",
    marginTop: 8,
  },
  linkCardDesc: {
    fontSize: 13,
    color: "#5d4037",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 19,
  },

  donateBtn: {
    backgroundColor: "#006994",
    marginHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    elevation: 5,
    marginTop: 8,
  },
  donateBtnTxt: { color: "white", fontWeight: "bold", fontSize: 16 },

  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  contactLabel: { fontSize: 11, color: "#999" },
  contactValue: { fontSize: 14, color: "#333", marginTop: 2 },

  // Charte du Plongeur
  charteCard: {
    borderRadius: 15,
    overflow: "hidden",
    marginTop: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  charteHeader: {
    paddingVertical: 10,
    alignItems: "center",
  },
  charteHeaderTxt: {
    fontSize: 16,
    fontWeight: "bold",
  },
  charteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 14,
  },
  charteItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingRight: 8,
  },
  charteIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    marginRight: 10,
    position: "relative",
  },
  charteItemTxt: {
    flex: 1,
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
  },
  charteForbidden: {
    position: "absolute",
    fontSize: 44,
    opacity: 0.7,
    color: "red",
  },

  // Articles Revosea
  articleCard: {
    flexDirection: "row",
    backgroundColor: "#f6fbff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    alignItems: "center",
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 3,
  },
  articleDesc: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
  websiteBtn: {
    backgroundColor: "#006994",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
  },
  websiteBtnTxt: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },

  footer: {
    textAlign: "center",
    color: "#888",
    fontSize: 12,
    marginTop: 20,
  },
});
