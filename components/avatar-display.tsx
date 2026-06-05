// AvatarDisplay — rendu SVG composé d'un avatar MarineDex.
// Calques (de bas en haut) : corps · tenue · cheveux arrière · tête · visage · cheveux avant · accessoire.
// Utiliser AvatarDisplay partout où l'avatar doit être affiché (profil, partage, badges).
import {
  AvatarConfig,
  DEFAULT_AVATAR_CONFIG,
  getHairColor,
  getOutfitColor,
  getSkinColor,
} from "@/constants/AvatarData";
import React from "react";
import Svg, {
  Circle,
  Ellipse,
  G,
  Path,
  Rect,
} from "react-native-svg";

interface AvatarDisplayProps {
  config?: AvatarConfig;
  size?: number; // px, carré — défaut : 80
}

/** ViewBox interne : 100 × 100. */
const VB = 100;

export default function AvatarDisplay({
  config = DEFAULT_AVATAR_CONFIG,
  size = 80,
}: AvatarDisplayProps) {
  const skin = getSkinColor(config.skin);
  const hair = getHairColor(config.hairColor);
  const outfit = getOutfitColor(config.outfitColor);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
      {/* Couche 1 : Corps (peau) — épaules + cou */}
      <BodyLayer skin={skin} />

      {/* Couche 2 : Tenue — par-dessus les épaules */}
      <OutfitLayer style={config.outfitStyle} color={outfit} skin={skin} />

      {/* Couche 3 : Cheveux arrière — derrière la tête */}
      <HairBackLayer style={config.hairStyle} color={hair} />

      {/* Couche 4 : Tête — ellipse principale */}
      <Ellipse cx="50" cy="40" rx="24" ry="26" fill={skin} />
      {/* Oreilles */}
      <Ellipse cx="26" cy="42" rx="4" ry="6" fill={skin} />
      <Ellipse cx="74" cy="42" rx="4" ry="6" fill={skin} />

      {/* Couche 5 : Visage (yeux + bouche) */}
      <FaceLayer expression={config.face} />

      {/* Couche 6 : Cheveux avant — par-dessus la tête */}
      <HairFrontLayer style={config.hairStyle} color={hair} />

      {/* Couche 7 : Accessoire */}
      {config.accessory && config.accessory !== "none" && (
        <AccessoryLayer kind={config.accessory} outfitColor={outfit} />
      )}
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────
// COUCHE 1 — Corps / épaules
// ─────────────────────────────────────────────────────────

function BodyLayer({ skin }: { skin: string }) {
  return (
    <G>
      {/* Silhouette des épaules + buste */}
      <Path
        d="M 8,100 Q 8,72 28,67 Q 40,63 50,62 Q 60,63 72,67 Q 92,72 92,100 Z"
        fill={skin}
      />
      {/* Cou */}
      <Rect x="43" y="60" width="14" height="10" fill={skin} />
    </G>
  );
}

// ─────────────────────────────────────────────────────────
// COUCHE 2 — Tenue
// ─────────────────────────────────────────────────────────

function OutfitLayer({
  style,
  color,
  skin,
}: {
  style: string;
  color: string;
  skin: string;
}) {
  // Corps de la tenue (même silhouette que BodyLayer, légèrement réduite)
  const bodyPath =
    "M 10,100 Q 10,74 30,69 Q 42,65 50,64 Q 58,65 70,69 Q 90,74 90,100 Z";

  if (style === "wetsuit" || style === "fullsuit") {
    // Combi : col haut, couvre aussi le cou et les oreilles
    return (
      <G>
        <Path d={bodyPath} fill={color} />
        {/* Col tube de la combinaison */}
        <Ellipse cx="50" cy="64" rx="12" ry="5" fill={color} />
        {/* Bande décorative centrale */}
        <Rect x="46" y="68" width="8" height="30" fill={`${color}99`} rx="4" />
      </G>
    );
  }

  if (style === "shorty") {
    return (
      <G>
        <Path d={bodyPath} fill={color} />
        {/* Col arrondi */}
        <Ellipse cx="50" cy="68" rx="10" ry="4" fill={color} />
        {/* Petit triangle de peau visible */}
        <Path d="M 40,64 Q 50,70 60,64 Q 50,62 40,64 Z" fill={skin} />
      </G>
    );
  }

  if (style === "rashguard") {
    return (
      <G>
        <Path d={bodyPath} fill={color} />
        {/* Col légèrement en V */}
        <Path d="M 40,66 Q 50,72 60,66 Q 50,60 40,66 Z" fill={skin} />
      </G>
    );
  }

  if (style === "swimsuit") {
    // Maillot : triangle plus ouvert
    return (
      <G>
        <Path d={bodyPath} fill={color} />
        {/* Col nageur large */}
        <Path d="M 34,68 Q 50,76 66,68 Q 50,60 34,68 Z" fill={skin} />
        {/* Bretelles */}
        <Rect x="38" y="64" width="5" height="8" fill={color} rx="2" />
        <Rect x="57" y="64" width="5" height="8" fill={color} rx="2" />
      </G>
    );
  }

  // Casual / défaut
  return (
    <G>
      <Path d={bodyPath} fill={color} />
      <Path d="M 36,68 Q 50,76 64,68 Q 50,60 36,68 Z" fill={skin} />
    </G>
  );
}

// ─────────────────────────────────────────────────────────
// COUCHE 3 — Cheveux arrière (derrière la tête)
// ─────────────────────────────────────────────────────────

function HairBackLayer({ style, color }: { style: string; color: string }) {
  if (style === "bald") return null;

  if (style === "long") {
    // Cheveux qui tombent sur les épaules
    return (
      <G>
        <Path
          d="M 26,38 Q 16,50 20,72 Q 26,80 34,78 Q 30,60 32,46 Z"
          fill={color}
        />
        <Path
          d="M 74,38 Q 84,50 80,72 Q 74,80 66,78 Q 70,60 68,46 Z"
          fill={color}
        />
        <Path
          d="M 26,26 Q 50,14 74,26 Q 76,38 74,38 Q 50,18 26,38 Z"
          fill={color}
        />
      </G>
    );
  }

  if (style === "medium") {
    return (
      <Path
        d="M 28,32 Q 50,16 72,32 Q 74,44 72,50 Q 62,56 50,56 Q 38,56 28,50 Q 26,44 28,32 Z"
        fill={color}
      />
    );
  }

  if (style === "curly") {
    // Volume bouclé de chaque côté
    return (
      <G>
        <Ellipse cx="22" cy="38" rx="10" ry="12" fill={color} />
        <Ellipse cx="78" cy="38" rx="10" ry="12" fill={color} />
        <Path
          d="M 26,24 Q 50,12 74,24 Q 76,34 74,36 Q 50,18 26,36 Z"
          fill={color}
        />
      </G>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────
// COUCHE 5 — Visage
// ─────────────────────────────────────────────────────────

function FaceLayer({ expression }: { expression: string }) {
  // Positions des yeux (par-dessus l'ellipse de tête)
  const leftEyeX = 40;
  const rightEyeX = 60;
  const eyeY = 38;

  const blush = (
    <G>
      <Ellipse cx="34" cy="46" rx="5" ry="3" fill="#FF9999" opacity={0.4} />
      <Ellipse cx="66" cy="46" rx="5" ry="3" fill="#FF9999" opacity={0.4} />
    </G>
  );

  if (expression === "happy") {
    return (
      <G>
        {blush}
        <Ellipse cx={leftEyeX} cy={eyeY} rx="4" ry="5" fill="#1A1A1A" />
        <Ellipse cx={rightEyeX} cy={eyeY} rx="4" ry="5" fill="#1A1A1A" />
        <Circle cx={leftEyeX + 1.5} cy={eyeY - 1.5} r="1.5" fill="white" />
        <Circle cx={rightEyeX + 1.5} cy={eyeY - 1.5} r="1.5" fill="white" />
        {/* Sourire */}
        <Path
          d={`M ${leftEyeX - 2},49 Q 50,57 ${rightEyeX + 2},49`}
          stroke="#333"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </G>
    );
  }

  if (expression === "cool") {
    // Yeux mi-clos
    return (
      <G>
        <Ellipse cx={leftEyeX} cy={eyeY} rx="4" ry="3" fill="#1A1A1A" />
        <Ellipse cx={rightEyeX} cy={eyeY} rx="4" ry="3" fill="#1A1A1A" />
        <Circle cx={leftEyeX + 1} cy={eyeY - 1} r="1.5" fill="white" />
        <Circle cx={rightEyeX + 1} cy={eyeY - 1} r="1.5" fill="white" />
        {/* Légère commissure */}
        <Path
          d={`M ${leftEyeX},50 Q 50,54 ${rightEyeX},50`}
          stroke="#333"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
      </G>
    );
  }

  if (expression === "surprised") {
    return (
      <G>
        {/* Grands yeux */}
        <Ellipse cx={leftEyeX} cy={eyeY} rx="5" ry="6" fill="#1A1A1A" />
        <Ellipse cx={rightEyeX} cy={eyeY} rx="5" ry="6" fill="#1A1A1A" />
        <Circle cx={leftEyeX + 2} cy={eyeY - 2} r="2" fill="white" />
        <Circle cx={rightEyeX + 2} cy={eyeY - 2} r="2" fill="white" />
        {/* Bouche en O */}
        <Ellipse cx="50" cy="51" rx="4" ry="3" fill="#333" />
      </G>
    );
  }

  if (expression === "determined") {
    return (
      <G>
        {/* Yeux plissés */}
        <Ellipse cx={leftEyeX} cy={eyeY} rx="4" ry="3.5" fill="#1A1A1A" />
        <Ellipse cx={rightEyeX} cy={eyeY} rx="4" ry="3.5" fill="#1A1A1A" />
        <Circle cx={leftEyeX + 1} cy={eyeY - 1} r="1.5" fill="white" />
        <Circle cx={rightEyeX + 1} cy={eyeY - 1} r="1.5" fill="white" />
        {/* Sourcils froncés */}
        <Path
          d={`M ${leftEyeX - 4},32 L ${leftEyeX + 3},34`}
          stroke="#1A1A1A"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Path
          d={`M ${rightEyeX - 3},34 L ${rightEyeX + 4},32`}
          stroke="#1A1A1A"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Bouche droite */}
        <Path
          d={`M ${leftEyeX - 1},50 L ${rightEyeX + 1},50`}
          stroke="#333"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </G>
    );
  }

  if (expression === "chill") {
    // Yeux fermés
    return (
      <G>
        {blush}
        <Path
          d={`M ${leftEyeX - 4},38 Q ${leftEyeX},34 ${leftEyeX + 4},38`}
          stroke="#1A1A1A"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M ${rightEyeX - 4},38 Q ${rightEyeX},34 ${rightEyeX + 4},38`}
          stroke="#1A1A1A"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        {/* Petit sourire fermé */}
        <Path
          d={`M ${leftEyeX},50 Q 50,55 ${rightEyeX},50`}
          stroke="#333"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
      </G>
    );
  }

  // Défaut : happy
  return (
    <G>
      <Ellipse cx={leftEyeX} cy={eyeY} rx="4" ry="5" fill="#1A1A1A" />
      <Ellipse cx={rightEyeX} cy={eyeY} rx="4" ry="5" fill="#1A1A1A" />
    </G>
  );
}

// ─────────────────────────────────────────────────────────
// COUCHE 6 — Cheveux avant (par-dessus la tête)
// ─────────────────────────────────────────────────────────

function HairFrontLayer({ style, color }: { style: string; color: string }) {
  if (style === "bald") return null;

  if (style === "short") {
    return (
      <Path
        d="M 26,28 Q 26,14 50,14 Q 74,14 74,28 Q 74,20 50,18 Q 26,20 26,28 Z"
        fill={color}
      />
    );
  }

  if (style === "medium" || style === "long") {
    return (
      <Path
        d="M 26,32 Q 26,14 50,14 Q 74,14 74,32 Q 74,20 50,18 Q 26,20 26,32 Z"
        fill={color}
      />
    );
  }

  if (style === "curly") {
    // Mèches bouclées sur le dessus
    return (
      <G>
        <Path
          d="M 26,30 Q 26,14 50,14 Q 74,14 74,30 Q 74,18 50,16 Q 26,18 26,30 Z"
          fill={color}
        />
        <Ellipse cx="34" cy="16" rx="6" ry="6" fill={color} />
        <Ellipse cx="50" cy="12" rx="7" ry="6" fill={color} />
        <Ellipse cx="66" cy="16" rx="6" ry="6" fill={color} />
      </G>
    );
  }

  if (style === "bun") {
    // Chignon sur le dessus
    return (
      <G>
        {/* Calotte */}
        <Path
          d="M 28,34 Q 28,18 50,16 Q 72,18 72,34 Q 72,22 50,20 Q 28,22 28,34 Z"
          fill={color}
        />
        {/* Chignon */}
        <Ellipse cx="50" cy="12" rx="10" ry="8" fill={color} />
        {/* Élastique */}
        <Ellipse cx="50" cy="18" rx="6" ry="3" fill="#333" opacity={0.4} />
      </G>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────
// COUCHE 7 — Accessoire
// ─────────────────────────────────────────────────────────

function AccessoryLayer({
  kind,
  outfitColor,
}: {
  kind: string;
  outfitColor: string;
}) {
  if (kind === "mask") {
    // Masque de plongée — cadre sur les yeux + sangle
    return (
      <G>
        {/* Verre du masque */}
        <Rect
          x="28"
          y="32"
          width="44"
          height="18"
          rx="6"
          fill="rgba(173,216,230,0.55)"
          stroke={outfitColor}
          strokeWidth="2.5"
        />
        {/* Sangle */}
        <Path
          d="M 28,36 Q 16,40 18,46 Q 16,52 28,50"
          stroke={outfitColor}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M 72,36 Q 84,40 82,46 Q 84,52 72,50"
          stroke={outfitColor}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </G>
    );
  }

  if (kind === "goggles") {
    // Lunettes de nage — plus petites et plus proches des yeux
    return (
      <G>
        <Ellipse
          cx="40"
          cy="38"
          rx="7"
          ry="6"
          fill="rgba(173,216,230,0.5)"
          stroke={outfitColor}
          strokeWidth="2"
        />
        <Ellipse
          cx="60"
          cy="38"
          rx="7"
          ry="6"
          fill="rgba(173,216,230,0.5)"
          stroke={outfitColor}
          strokeWidth="2"
        />
        {/* Pont central */}
        <Path
          d="M 47,38 L 53,38"
          stroke={outfitColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Sangle */}
        <Path
          d="M 33,38 Q 26,38 26,42"
          stroke={outfitColor}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M 67,38 Q 74,38 74,42"
          stroke={outfitColor}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </G>
    );
  }

  if (kind === "snorkel") {
    // Tuba — tube vertical à gauche + embout
    return (
      <G>
        {/* Corps du tuba */}
        <Path
          d="M 30,44 L 22,44 L 18,30 L 20,10 L 26,10 L 24,30 L 28,44"
          stroke={outfitColor}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Embout supérieur */}
        <Ellipse cx="23" cy="9" rx="4" ry="3" fill={outfitColor} />
      </G>
    );
  }

  if (kind === "cap_revosea") {
    // Casquette Revosea — visière + calotte
    return (
      <G>
        {/* Calotte */}
        <Path
          d="M 26,30 Q 26,8 50,8 Q 74,8 74,30 Q 74,16 50,14 Q 26,16 26,30 Z"
          fill={outfitColor}
        />
        {/* Visière */}
        <Path
          d="M 24,30 Q 50,38 76,30 Q 76,34 50,36 Q 24,34 24,30 Z"
          fill={outfitColor}
        />
        {/* Logo mini Revosea (🐬 représenté par une forme simple) */}
        <Path
          d="M 46,20 Q 50,16 54,20 Q 52,24 50,22 Q 48,24 46,20 Z"
          fill="white"
          opacity={0.7}
        />
      </G>
    );
  }

  return null;
}
