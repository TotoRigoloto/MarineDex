// AvatarBuilder — éditeur d'avatar composable (modal plein écran).
// Affiche un preview live via AvatarDisplay et des onglets par catégorie.
// Les items verrouillés montrent un cadenas avec la condition de déblocage.
import AvatarDisplay from "@/components/avatar-display";
import {
  ACCESSORY_OPTIONS,
  AvatarConfig,
  AvatarOption,
  ColorOption,
  DEFAULT_AVATAR_CONFIG,
  FACE_OPTIONS,
  HAIR_COLOR_OPTIONS,
  HAIR_STYLE_OPTIONS,
  isUnlocked,
  OUTFIT_COLOR_OPTIONS,
  OUTFIT_STYLE_OPTIONS,
  SKIN_OPTIONS,
} from "@/constants/AvatarData";
import * as H from "@/services/haptics";
import React, { useState } from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ---- Types ----

interface AvatarBuilderProps {
  visible: boolean;
  initialConfig: AvatarConfig;
  /** XP de l'utilisateur (pour les items verrouillés par XP). */
  userXp: number;
  /** Nombre de voyages (pour les items verrouillés par nb de voyages). */
  tripCount: number;
  /** IDs des badges débloqués (pour les items verrouillés par badge). */
  unlockedBadgeIds: string[];
  onSave: (config: AvatarConfig) => void;
  onClose: () => void;
}

type TabId = "skin" | "hair" | "face" | "outfit" | "accessory";

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: "skin", label: "Peau", emoji: "✋" },
  { id: "hair", label: "Cheveux", emoji: "💇" },
  { id: "face", label: "Visage", emoji: "😊" },
  { id: "outfit", label: "Tenue", emoji: "🤿" },
  { id: "accessory", label: "Accessoire", emoji: "🎒" },
];

// ---- Composant principal ----

export default function AvatarBuilder({
  visible,
  initialConfig,
  userXp,
  tripCount,
  unlockedBadgeIds,
  onSave,
  onClose,
}: AvatarBuilderProps) {
  const [draft, setDraft] = useState<AvatarConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<TabId>("skin");

  // Synchronise le draft si l'initialConfig change (ex : ouverture du modal)
  React.useEffect(() => {
    if (visible) setDraft(initialConfig);
  }, [visible, initialConfig]);

  const handleSave = () => {
    H.success();
    onSave(draft);
  };

  const handleTabChange = (tab: TabId) => {
    H.tapLight();
    setActiveTab(tab);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={styles.headerBtnTxt}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mon avatar</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.headerBtn, styles.headerBtnSave]}
          >
            <Text style={[styles.headerBtnTxt, { color: "white" }]}>
              Enregistrer
            </Text>
          </TouchableOpacity>
        </View>

        {/* Preview */}
        <View style={styles.previewContainer}>
          <View style={styles.previewCircle}>
            <AvatarDisplay config={draft} size={140} />
          </View>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsRow}
          contentContainerStyle={styles.tabsContent}
        >
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tab, activeTab === t.id && styles.tabActive]}
              onPress={() => handleTabChange(t.id)}
            >
              <Text style={styles.tabEmoji}>{t.emoji}</Text>
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === t.id && styles.tabLabelActive,
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Contenu de l'onglet actif */}
        <ScrollView
          contentContainerStyle={styles.optionsContainer}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "skin" && (
            <ColorPicker
              options={SKIN_OPTIONS}
              selected={draft.skin}
              onSelect={(id) => {
                H.tapLight();
                setDraft((d) => ({ ...d, skin: id }));
              }}
              userXp={userXp}
              tripCount={tripCount}
              unlockedBadgeIds={unlockedBadgeIds}
            />
          )}

          {activeTab === "hair" && (
            <>
              <Text style={styles.sectionLabel}>Style</Text>
              <OptionPicker
                options={HAIR_STYLE_OPTIONS}
                selected={draft.hairStyle}
                onSelect={(id) => {
                  H.tapLight();
                  setDraft((d) => ({ ...d, hairStyle: id }));
                }}
                userXp={userXp}
                tripCount={tripCount}
                unlockedBadgeIds={unlockedBadgeIds}
              />
              <Text style={[styles.sectionLabel, { marginTop: 14 }]}>
                Couleur
              </Text>
              <ColorPicker
                options={HAIR_COLOR_OPTIONS}
                selected={draft.hairColor}
                onSelect={(id) => {
                  H.tapLight();
                  if (id !== "bald") setDraft((d) => ({ ...d, hairColor: id }));
                }}
                userXp={userXp}
                tripCount={tripCount}
                unlockedBadgeIds={unlockedBadgeIds}
                disabled={draft.hairStyle === "bald"}
              />
            </>
          )}

          {activeTab === "face" && (
            <OptionPicker
              options={FACE_OPTIONS}
              selected={draft.face}
              onSelect={(id) => {
                H.tapLight();
                setDraft((d) => ({ ...d, face: id }));
              }}
              userXp={userXp}
              tripCount={tripCount}
              unlockedBadgeIds={unlockedBadgeIds}
            />
          )}

          {activeTab === "outfit" && (
            <>
              <Text style={styles.sectionLabel}>Style</Text>
              <OptionPicker
                options={OUTFIT_STYLE_OPTIONS}
                selected={draft.outfitStyle}
                onSelect={(id) => {
                  H.tapLight();
                  setDraft((d) => ({ ...d, outfitStyle: id }));
                }}
                userXp={userXp}
                tripCount={tripCount}
                unlockedBadgeIds={unlockedBadgeIds}
              />
              <Text style={[styles.sectionLabel, { marginTop: 14 }]}>
                Couleur
              </Text>
              <ColorPicker
                options={OUTFIT_COLOR_OPTIONS}
                selected={draft.outfitColor}
                onSelect={(id) => {
                  H.tapLight();
                  setDraft((d) => ({ ...d, outfitColor: id }));
                }}
                userXp={userXp}
                tripCount={tripCount}
                unlockedBadgeIds={unlockedBadgeIds}
              />
            </>
          )}

          {activeTab === "accessory" && (
            <OptionPicker
              options={ACCESSORY_OPTIONS}
              selected={draft.accessory ?? "none"}
              onSelect={(id) => {
                H.tapLight();
                setDraft((d) => ({ ...d, accessory: id === "none" ? null : id }));
              }}
              userXp={userXp}
              tripCount={tripCount}
              unlockedBadgeIds={unlockedBadgeIds}
            />
          )}
        </ScrollView>

        {/* Bouton reset */}
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => {
            H.tapMedium();
            setDraft(DEFAULT_AVATAR_CONFIG);
          }}
        >
          <Text style={styles.resetBtnTxt}>↺ Réinitialiser</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────
// Sous-composants de sélection
// ─────────────────────────────────────────────────────────

interface PickerProps {
  options: AvatarOption[];
  selected: string;
  onSelect: (id: string) => void;
  userXp: number;
  tripCount: number;
  unlockedBadgeIds: string[];
  disabled?: boolean;
}

/** Grille de pastilles colorées pour skin / hairColor / outfitColor. */
function ColorPicker({
  options,
  selected,
  onSelect,
  userXp,
  tripCount,
  unlockedBadgeIds,
  disabled,
}: PickerProps) {
  return (
    <View style={styles.colorGrid}>
      {(options as ColorOption[]).map((opt) => {
        const unlocked = isUnlocked(
          opt.lockedBy,
          userXp,
          tripCount,
          unlockedBadgeIds,
        );
        const isSelected = selected === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            style={[
              styles.colorSwatch,
              { backgroundColor: opt.color },
              isSelected && styles.colorSwatchSelected,
              (disabled || !unlocked) && styles.swatchLocked,
            ]}
            onPress={() => {
              if (!unlocked) {
                H.warning();
                return;
              }
              if (!disabled) onSelect(opt.id);
            }}
            accessibilityLabel={opt.label}
          >
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
            {!unlocked && <Text style={styles.lockIcon}>🔒</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** Liste de chips texte pour style / face / accessoire. */
function OptionPicker({
  options,
  selected,
  onSelect,
  userXp,
  tripCount,
  unlockedBadgeIds,
}: PickerProps) {
  return (
    <View style={styles.optionList}>
      {options.map((opt) => {
        const unlocked = isUnlocked(
          opt.lockedBy,
          userXp,
          tripCount,
          unlockedBadgeIds,
        );
        const isSelected = selected === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            style={[
              styles.optionChip,
              isSelected && styles.optionChipSelected,
              !unlocked && styles.optionChipLocked,
            ]}
            onPress={() => {
              if (!unlocked) {
                H.warning();
                return;
              }
              onSelect(opt.id);
            }}
          >
            <Text
              style={[
                styles.optionChipTxt,
                isSelected && styles.optionChipTxtSelected,
                !unlocked && styles.optionChipTxtLocked,
              ]}
            >
              {!unlocked ? "🔒 " : ""}
              {opt.label}
            </Text>
            {!unlocked && opt.lockedBy && (
              <Text style={styles.lockHint}>{opt.lockedBy.label}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f8ff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#006994" },
  headerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#eee",
  },
  headerBtnSave: { backgroundColor: "#006994" },
  headerBtnTxt: { fontWeight: "bold", color: "#333", fontSize: 14 },

  previewContainer: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "white",
  },
  previewCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    borderWidth: 3,
    borderColor: "#006994",
    overflow: "hidden",
  },

  tabsRow: { maxHeight: 64, backgroundColor: "white" },
  tabsContent: {
    paddingHorizontal: 10,
    gap: 8,
    alignItems: "center",
    paddingVertical: 8,
  },
  tab: {
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    flexDirection: "row",
    gap: 5,
  },
  tabActive: { backgroundColor: "#006994" },
  tabEmoji: { fontSize: 14 },
  tabLabel: { fontSize: 12, color: "#666", fontWeight: "600" },
  tabLabelActive: { color: "white" },

  optionsContainer: { padding: 16, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#006994",
    marginBottom: 10,
  },

  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "flex-start",
  },
  colorSwatch: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: "#FFB300",
    elevation: 5,
  },
  swatchLocked: { opacity: 0.5 },
  checkmark: { color: "white", fontWeight: "bold", fontSize: 18 },
  lockIcon: { fontSize: 18 },

  optionList: { gap: 10 },
  optionChip: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    elevation: 1,
  },
  optionChipSelected: {
    borderColor: "#006994",
    backgroundColor: "#e3f2fd",
  },
  optionChipLocked: { opacity: 0.6 },
  optionChipTxt: { fontSize: 15, color: "#333", fontWeight: "600" },
  optionChipTxtSelected: { color: "#006994" },
  optionChipTxtLocked: { color: "#888" },
  lockHint: {
    fontSize: 11,
    color: "#FFA000",
    marginTop: 4,
    fontStyle: "italic",
  },

  resetBtn: {
    alignSelf: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#eee",
    borderRadius: 20,
  },
  resetBtnTxt: { color: "#666", fontWeight: "600" },
});
