// app/constants/MarineData.ts

export const OCEAN_NAMES = {
  ATLANTIQUE: "Atlantique",
  PACIFIQUE: "Pacifique",
  INDIEN: "Océan Indien",
  MEDITERRANEE: "Méditerranée",
  ROUGE: "Mer Rouge",
  CARAIBES: "Caraïbes",
  ARCTIQUE: "Arctique",
  ANDAMAN: "Mer d'Andaman",
  CHINE: "Mer de Chine",
  GOLFE_MEXIQUE: "Golfe du Mexique",
};

// --- 1. L'ENCYCLOPÉDIE ---
export const ENCYCLOPEDIA_DATA: Record<
  string,
  {
    description: string;
    taille: string;
    danger: string;
    depth: string;
    image: any;
    habitats: string[];
    family: FamilyType;
    groupe: GroupType;
    rarity: RarityType;
  }
> = {
  // --- REQUINS & RAIES ---
  "Requin Baleine": {
    description: "Le plus grand poisson du monde. Totalement inoffensif.",
    taille: "4 à 14 mètres",
    danger: "🟢 Inoffensif",
    depth: "Surface - 1900m",
    image: require("../assets/images/animals/requin_baleine.png"),
    habitats: [
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.CARAIBES,
    ],
    family: "Requin",
    groupe: "Poissons",
    rarity: 3,
  },
  "Requin Tigre": {
    description: "Un super-prédateur curieux avec des rayures verticales.",
    taille: "3 à 5 mètres",
    danger: "🔴 Potentiellement dangereux",
    depth: "0 - 350m",
    image: require("../assets/images/animals/requin_tigre.png"),
    habitats: [
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.CARAIBES,
    ],
    family: "Requin",
    groupe: "Poissons",
    rarity: 2,
  },
  "Requin Marteau": {
    description: "Reconnaissable à sa tête en forme de T.",
    taille: "3 à 6 mètres",
    danger: "🟠 Respecter une distance",
    depth: "0 - 275m",
    image: require("../assets/images/animals/requin_marteau.png"),
    habitats: [
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.ROUGE,
    ],
    family: "Requin",
    groupe: "Poissons",
    rarity: 2,
  },
  "Grand Requin Blanc": {
    description: "Le prédateur ultime.",
    taille: "4 à 6 mètres",
    danger: "🔴 Potentiellement dangereux",
    depth: "0 - 1200m",
    image: require("../assets/images/animals/grand_requin_blanc.png"),
    habitats: [
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.MEDITERRANEE,
    ],
    family: "Requin",
    groupe: "Poissons",
    rarity: 3,
  },
  "Requin Pointe Noire": {
    description: "Petit requin de récif très commun.",
    taille: "1.2 à 1.6 mètres",
    danger: "🟢 Inoffensif",
    depth: "0 - 75m",
    image: require("../assets/images/animals/requin_pointe_noire.png"),
    habitats: [
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.ROUGE,
      OCEAN_NAMES.ANDAMAN,
    ],
    family: "Requin",
    groupe: "Poissons",
    rarity: 1,
  },
  "Requin Renard": {
    description:
      "Utilise sa queue immense comme un fouet pour assommer ses proies.",
    taille: "3 à 5 mètres",
    danger: "🟢 Inoffensif",
    depth: "0 - 500m",
    image: require("../assets/images/animals/requin_renard.png"),
    habitats: [
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.INDIEN,
    ],
    family: "Requin",
    groupe: "Poissons",
    rarity: 3,
  },
  "Requin Nourrice": {
    description: "Passe ses journées à dormir sur le sable dans les grottes.",
    taille: "2 à 3 mètres",
    danger: "🟢 Inoffensif",
    depth: "1 - 75m",
    image: require("../assets/images/animals/requin_nourrice.png"),
    habitats: [
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.CARAIBES,
      OCEAN_NAMES.PACIFIQUE,
    ],
    family: "Requin",
    groupe: "Poissons",
    rarity: 1,
  },
  // --- RAIES ---
  "Raie Manta": {
    description: "La géante gracieuse.",
    taille: "3 à 7 mètres (envergure)",
    danger: "🟢 Inoffensif",
    depth: "0 - 1000m",
    image: require("../assets/images/animals/raie_manta.png"),
    habitats: [
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.ATLANTIQUE,
    ],
    family: "Raie",
    groupe: "Poissons",
    rarity: 3,
  },
  "Raie Aigle": {
    description: "Reconnaissable à ses taches blanches.",
    taille: "1 à 3 mètres (envergure)",
    danger: "🟢 Inoffensif",
    depth: "1 - 80m",
    image: require("../assets/images/animals/raie_aigle.png"),
    habitats: [
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.CARAIBES,
    ],
    family: "Raie",
    groupe: "Poissons",
    rarity: 2,
  },
  "Raie Pastenague": {
    description: "Possède un dard venimeux à la base de la queue.",
    taille: "1 à 2 mètres",
    danger: "🟠 Venimeux (Défensif)",
    depth: "1 - 60m",
    image: require("../assets/images/animals/raie_pastenague.png"),
    habitats: [
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.MEDITERRANEE,
      OCEAN_NAMES.CARAIBES,
      OCEAN_NAMES.INDIEN,
    ],
    family: "Raie",
    groupe: "Poissons",
    rarity: 1,
  },

  // --- MAMMIFÈRES ---
  "Grand Dauphin": {
    description: "Le fameux 'Flipper'.",
    taille: "2 à 4 mètres",
    danger: "🟢 Inoffensif",
    depth: "Surface - 30m",
    image: require("../assets/images/animals/grand_dauphin.png"),
    habitats: [
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.MEDITERRANEE,
      OCEAN_NAMES.ROUGE,
      OCEAN_NAMES.CARAIBES,
    ],
    family: "Cétacé",
    groupe: "Mammifères Marins",
    rarity: 1,
  },
  "Baleine à Bosse": {
    description: "Célèbre pour ses chants.",
    taille: "12 à 16 mètres",
    danger: "🟢 Inoffensif",
    depth: "Surface - 200m",
    image: require("../assets/images/animals/baleine_a_bosse.png"),
    habitats: [
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.ARCTIQUE,
    ],
    family: "Cétacé",
    groupe: "Mammifères Marins",
    rarity: 2,
  },
  "Baleine Bleue": {
    description: "Le plus gros animal du monde.",
    taille: "24 à 30 mètres",
    danger: "🟢 Inoffensif",
    depth: "Surface - 500m",
    image: require("../assets/images/animals/baleine_bleue.png"),
    habitats: [
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.ARCTIQUE,
    ],
    family: "Cétacé",
    groupe: "Mammifères Marins",
    rarity: 3,
  },
  Orque: {
    description: "Le super-prédateur absolu.",
    taille: "6 à 8 mètres",
    danger: "🟠 Respecter une distance",
    depth: "0 - 1000m",
    image: require("../assets/images/animals/orque.png"),
    habitats: [
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.ARCTIQUE,
      OCEAN_NAMES.MEDITERRANEE,
    ],
    family: "Cétacé",
    groupe: "Mammifères Marins",
    rarity: 3,
  },
  Narval: {
    description: "La 'licorne des mers' avec sa dent unique en spirale.",
    taille: "4 à 5 mètres",
    danger: "🟢 Inoffensif",
    depth: "0 - 1500m",
    image: require("../assets/images/animals/narval.png"),
    habitats: [OCEAN_NAMES.ARCTIQUE],
    family: "Cétacé",
    groupe: "Mammifères Marins",
    rarity: 3,
  },
  Cachalot: {
    description:
      "Le plus grand prédateur à dents, plonge à des profondeurs extrêmes.",
    taille: "15 à 18 mètres",
    danger: "🟠 Respecter une distance",
    depth: "Surface - 3000m",
    image: require("../assets/images/animals/cachalot.png"),
    habitats: [
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
    ],
    family: "Cétacé",
    groupe: "Mammifères Marins",
    rarity: 3,
  },
  Marsouin: {
    description: "Plus petit et plus discret que le dauphin.",
    taille: "1.5 à 2 mètres",
    danger: "🟢 Inoffensif",
    depth: "0 - 200m",
    image: require("../assets/images/animals/marsouin.png"),
    habitats: [
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.ARCTIQUE,
    ],
    family: "Cétacé",
    groupe: "Mammifères Marins",
    rarity: 1,
  },
  Dugong: {
    description: "La 'vache de mer'.",
    taille: "2.5 à 3 mètres",
    danger: "🟢 Inoffensif",
    depth: "1 - 10m",
    image: require("../assets/images/animals/dugong.png"),
    habitats: [OCEAN_NAMES.INDIEN, OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.ROUGE],
    family: "Sirénien",
    groupe: "Mammifères Marins",
    rarity: 2,
  },
  Lamantin: {
    description: "Cousin du Dugong à queue ronde.",
    taille: "3 à 4 mètres",
    danger: "🟢 Inoffensif",
    depth: "1 - 5m",
    image: require("../assets/images/animals/lamantin.png"),
    habitats: [
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.CARAIBES,
      OCEAN_NAMES.GOLFE_MEXIQUE,
    ],
    family: "Sirénien",
    groupe: "Mammifères Marins",
    rarity: 2,
  },

  // --- TORTUES ---
  "Tortue Verte": {
    description: "Herbivore à l'âge adulte.",
    taille: "80 cm à 1.5 m",
    danger: "🟢 Inoffensif",
    depth: "Surface - 20m",
    image: require("../assets/images/animals/tortue_verte.png"),
    habitats: [
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.CARAIBES,
      OCEAN_NAMES.MEDITERRANEE,
    ],
    family: "Tortue",
    groupe: "Reptiles",
    rarity: 1,
  },
  "Tortue Imbriquée": {
    description: "Mange des éponges.",
    taille: "60 à 90 cm",
    danger: "🟢 Inoffensif",
    depth: "1 - 30m",
    image: require("../assets/images/animals/tortue_imbriquee.png"),
    habitats: [
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.CARAIBES,
      OCEAN_NAMES.ROUGE,
    ],
    family: "Tortue",
    groupe: "Reptiles",
    rarity: 2,
  },
  "Tortue Luth": {
    description: "La plus grande des tortues, sa carapace ressemble à du cuir.",
    taille: "1.8 à 2.2 mètres",
    danger: "🟢 Inoffensif",
    depth: "0 - 1200m",
    image: require("../assets/images/animals/tortue_luth.png"),
    habitats: [
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
    ],
    family: "Tortue",
    groupe: "Reptiles",
    rarity: 3,
  },
  "Tortue Caouanne": {
    description: "Possède une tête massive et des mâchoires puissantes.",
    taille: "90 cm à 1.2 m",
    danger: "🟢 Inoffensif",
    depth: "0 - 100m",
    image: require("../assets/images/animals/tortue_caouanne.png"),
    habitats: [
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.MEDITERRANEE,
      OCEAN_NAMES.INDIEN,
    ],
    family: "Tortue",
    groupe: "Reptiles",
    rarity: 1,
  },

  // --- POISSONS ---
  "Poisson Clown": {
    description: "Vit dans les anémones.",
    taille: "7 à 15 cm",
    danger: "🟢 Inoffensif",
    depth: "1 - 15m",
    image: require("../assets/images/animals/poisson_clown.png"),
    habitats: [
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.ROUGE,
      OCEAN_NAMES.ANDAMAN,
    ],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 1,
  },
  Barracuda: {
    description: "Chasseur argenté rapide.",
    taille: "50 cm à 1.8 m",
    danger: "🟠 Morsure possible",
    depth: "0 - 100m",
    image: require("../assets/images/animals/barracuda.png"),
    habitats: [
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.CARAIBES,
      OCEAN_NAMES.MEDITERRANEE,
    ],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 1,
  },
  Murène: {
    description: "Vit cachée dans les trous.",
    taille: "1 à 2.5 mètres",
    danger: "🟠 Morsure douloureuse",
    depth: "0 - 50m",
    image: require("../assets/images/animals/murene.png"),
    habitats: [
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.CARAIBES,
      OCEAN_NAMES.MEDITERRANEE,
      OCEAN_NAMES.ROUGE,
    ],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 1,
  },
  Anguille: {
    description: "Poisson serpentiforme.",
    taille: "1 à 1.5 mètre",
    danger: "🟢 Inoffensif",
    depth: "0 - 600m",
    image: require("../assets/images/animals/anguille.png"),
    habitats: [OCEAN_NAMES.ATLANTIQUE, OCEAN_NAMES.MEDITERRANEE],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 1,
  },
  "Poisson Lion": {
    description: "Envahissant et venimeux.",
    taille: "30 à 45 cm",
    danger: "🔴 Venimeux",
    depth: "1 - 50m",
    image: require("../assets/images/animals/poisson_lion.png"),
    habitats: [
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.ROUGE,
      OCEAN_NAMES.CARAIBES,
    ],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 2,
  },
  Napoléon: {
    description: "Enorme poisson à bosse.",
    taille: "1 à 2.3 mètres",
    danger: "🟢 Inoffensif",
    depth: "1 - 60m",
    image: require("../assets/images/animals/napoleon.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ROUGE],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 2,
  },
  "Thon Rouge": {
    description: "Le sprinter des océans, peut nager jusqu'à 70 km/h.",
    taille: "2 à 3 mètres",
    danger: "🟢 Inoffensif",
    depth: "0 - 1000m",
    image: require("../assets/images/animals/thon_rouge.png"),
    habitats: [OCEAN_NAMES.ATLANTIQUE, OCEAN_NAMES.MEDITERRANEE],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 2,
  },
  Espadon: {
    description: "Armé d'un long rostre pour fendre l'eau et chasser.",
    taille: "3 à 4.5 mètres",
    danger: "🟠 Danger si acculé",
    depth: "0 - 800m",
    image: require("../assets/images/animals/espadon.png"),
    habitats: [
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.MEDITERRANEE,
    ],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 3,
  },
  Mérou: {
    description: "Poisson territorial et curieux qui peut vivre 50 ans.",
    taille: "1 à 2.5 mètres",
    danger: "🟢 Inoffensif",
    depth: "5 - 150m",
    image: require("../assets/images/animals/merou.png"),
    habitats: [
      OCEAN_NAMES.MEDITERRANEE,
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.ROUGE,
    ],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 2,
  },
  "Poisson Perroquet": {
    description: "Grignote le corail et crée le sable blanc des plages.",
    taille: "30 à 70 cm",
    danger: "🟢 Inoffensif",
    depth: "1 - 30m",
    image: require("../assets/images/animals/poisson_perroquet.png"),
    habitats: [
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.CARAIBES,
      OCEAN_NAMES.ROUGE,
    ],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 1,
  },
  "Môle (Poisson Lune)": {
    description:
      "Ressemble à une énorme galette flottante, adore bronzer en surface.",
    taille: "2 à 3 mètres",
    danger: "🟢 Inoffensif",
    depth: "0 - 600m",
    image: require("../assets/images/animals/poisson_lune.png"),
    habitats: [
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.MEDITERRANEE,
    ],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 3,
  },
  "Poisson-Pierre": {
    description: "Le poisson le plus venimeux au monde. Parfaitement camouflé.",
    taille: "30 à 40 cm",
    danger: "🔴 Très Venimeux",
    depth: "0 - 20m",
    image: require("../assets/images/animals/poisson_pierre.png"),
    habitats: [OCEAN_NAMES.INDIEN, OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.ROUGE],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 2,
  },
  "Murène Ruban": {
    description: "Change de couleur et de sexe au cours de sa vie.",
    taille: "1 mètre",
    danger: "🟢 Inoffensif",
    depth: "1 - 20m",
    image: require("../assets/images/animals/murene_ruban.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 2,
  },
  Hippocampe: {
    description: "Le mâle porte les œufs.",
    taille: "2 à 15 cm",
    danger: "🟢 Inoffensif",
    depth: "1 - 30m",
    image: require("../assets/images/animals/hippocampe.png"),
    habitats: [
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.MEDITERRANEE,
    ],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 2,
  },
  // --- INVERTÉBRÉS ---
  Pieuvre: {
    description: "Invertébré intelligent.",
    taille: "Variable",
    danger: "🟢 Inoffensif",
    depth: "0 - 200m",
    image: require("../assets/images/animals/pieuvre.png"),
    habitats: [
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.MEDITERRANEE,
    ],
    family: "Céphalopode",
    groupe: "Mollusques",
    rarity: 2,
  },
  Seiche: {
    description:
      "Maître du camouflage capable de changer de texture et de couleur.",
    taille: "20 à 50 cm",
    danger: "🟢 Inoffensif",
    depth: "0 - 150m",
    image: require("../assets/images/animals/seiche.png"),
    habitats: [
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.MEDITERRANEE,
      OCEAN_NAMES.INDIEN,
    ],
    family: "Céphalopode",
    groupe: "Mollusques",
    rarity: 1,
  },
  Calamar: {
    description: "Prédateur rapide doté de dix bras.",
    taille: "30 à 60 cm",
    danger: "🟢 Inoffensif",
    depth: "0 - 500m",
    image: require("../assets/images/animals/calamar.png"),
    habitats: [
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.MEDITERRANEE,
    ],
    family: "Céphalopode",
    groupe: "Mollusques",
    rarity: 1,
  },
  "Calamar Géant": {
    description:
      "Vivant dans les abysses, il a alimenté les légendes du Kraken.",
    taille: "10 à 13 mètres",
    danger: "🟠 Potentiellement dangereux",
    depth: "300 - 1000m",
    image: require("../assets/images/animals/calamar_geant.png"),
    habitats: [OCEAN_NAMES.ATLANTIQUE, OCEAN_NAMES.PACIFIQUE],
    family: "Céphalopode",
    groupe: "Mollusques",
    rarity: 3,
  },
  Nautile: {
    description: "Fossile vivant doté d'une magnifique coquille spiralée.",
    taille: "15 à 25 cm",
    danger: "🟢 Inoffensif",
    depth: "100 - 600m",
    image: require("../assets/images/animals/nautile.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN],
    family: "Céphalopode",
    groupe: "Mollusques",
    rarity: 2,
  },
  "Méduse Boîte": {
    description: "Transparente et extrêmement redoutable.",
    taille: "20 à 30 cm",
    danger: "🔴 Mortel",
    depth: "0 - 10m",
    image: require("../assets/images/animals/meduse_boite.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN],
    family: "Méduse",
    groupe: "Cnidaires",
    rarity: 3,
  },
  // --- VAGUE 2 : RÉCIFS & MERVEILLES ---
  "Poisson Mandarin": {
    description:
      "L'un des poissons les plus colorés au monde, célèbre pour sa danse nuptiale.",
    taille: "6 à 10 cm",
    danger: "🟢 Inoffensif",
    depth: "1 - 20m",
    image: require("../assets/images/animals/poisson_mandarin.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.ANDAMAN, OCEAN_NAMES.CHINE],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 2,
  },
  "Pieuvre à anneaux bleus": {
    description:
      "Petite mais extrêmement venimeuse. Ses anneaux brillent en cas de menace.",
    taille: "10 à 20 cm",
    danger: "🔴 Mortel",
    depth: "0 - 20m",
    image: require("../assets/images/animals/pieuvre_anneaux_bleus.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN],
    family: "Céphalopode",
    groupe: "Mollusques",
    rarity: 3,
  },
  "Bénitier Géant": {
    description: "Le plus grand mollusque bivalve. Peut vivre plus de 100 ans.",
    taille: "Jusqu'à 1.2 mètre",
    danger: "🟢 Inoffensif",
    depth: "1 - 20m",
    image: require("../assets/images/animals/benitier_geant.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ROUGE],
    family: "Bivalve",
    groupe: "Mollusques",
    rarity: 2,
  },
  Nudibranche: {
    description:
      "Limace de mer aux couleurs flamboyantes servant d'avertissement.",
    taille: "1 à 15 cm",
    danger: "🟢 Inoffensif",
    depth: "0 - 50m",
    image: require("../assets/images/animals/nudibranche.png"),
    habitats: [
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.MEDITERRANEE,
      OCEAN_NAMES.ATLANTIQUE,
    ],
    family: "Gastéropode",
    groupe: "Mollusques",
    rarity: 2,
  },
  "Poisson Chirurgien Bleu": {
    description:
      "Rendu célèbre par 'Dory', il possède une épine tranchante à la base de la queue.",
    taille: "20 à 30 cm",
    danger: "🟠 Attention aux épines",
    depth: "2 - 40m",
    image: require("../assets/images/animals/chirurgien_bleu.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 1,
  },
  "Baliste Titan": {
    description:
      "Très territorial, il peut charger les plongeurs pour protéger son nid.",
    taille: "40 à 75 cm",
    danger: "🟠 Territorial (Morsure)",
    depth: "1 - 50m",
    image: require("../assets/images/animals/baliste_titan.png"),
    habitats: [OCEAN_NAMES.INDIEN, OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.ROUGE],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 2,
  },
  "Poisson Grenouille": {
    description:
      "Maître du camouflage et de la patience, il 'marche' sur ses nageoires.",
    taille: "5 à 30 cm",
    danger: "🟢 Inoffensif",
    depth: "1 - 100m",
    image: require("../assets/images/animals/poisson_grenouille.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.CARAIBES],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 3,
  },
  "Dragon de Mer Feuillu": {
    description:
      "Ressemble à des algues dérivantes. Unique aux eaux australiennes. Hippocampe feuille",
    taille: "20 à 35 cm",
    danger: "🟢 Inoffensif",
    depth: "4 - 30m",
    image: require("../assets/images/animals/dragon_mer_feuillu.png"),
    habitats: [OCEAN_NAMES.INDIEN, OCEAN_NAMES.PACIFIQUE],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 3,
  },
  "Raie pastenague à taches bleues": {
    description:
      "Petite raie colorée vivant souvent sous les surplombs rocheux.",
    taille: "30 à 70 cm",
    danger: "🟠 Venimeux (Dard)",
    depth: "1 - 30m",
    image: require("../assets/images/animals/raie_pastenague.png"),
    habitats: [OCEAN_NAMES.INDIEN, OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.ROUGE],
    family: "Raie",
    groupe: "Poissons",
    rarity: 1,
  },
  "Hippocampe Pygmée": {
    description:
      "Si petit et bien camouflé qu'il est presque impossible à voir sur les gorgones.",
    taille: "1.5 à 2 cm",
    danger: "🟢 Inoffensif",
    depth: "10 - 40m",
    image: require("../assets/images/animals/hippocampe_pygmee.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.CHINE],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 3,
  },
  "Poisson Coffre Jaune": {
    description:
      "Corps cubique et rigide, il devient plus sombre en grandissant.",
    taille: "15 à 45 cm",
    danger: "🟢 Inoffensif",
    depth: "1 - 280m",
    image: require("../assets/images/animals/poisson_coffre_jaune.jpg"),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ROUGE],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 2,
  },
  "Poisson Trompette": {
    description:
      "S'aligne verticalement pour se cacher parmi les coraux ou les plongeurs.",
    taille: "40 à 80 cm",
    danger: "🟢 Inoffensif",
    depth: "2 - 100m",
    image: require("../assets/images/animals/poisson_trompette.png"),
    habitats: [
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.CARAIBES,
      OCEAN_NAMES.PACIFIQUE,
    ],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 1,
  },
  "Poisson-scorpion barbu": {
    description:
      "Passé maître dans l'art du camouflage, il possède de nombreux lambeaux de peau (cirres) sous la mâchoire et sur le corps qui imitent les algues. Il dispose de 12 épines dorsales venimeuses très robustes. Contrairement à la Rascasse, il reste souvent parfaitement immobile même si on s'en approche à quelques centimètres.",
    taille: "20 à 40 cm",
    danger: "🔴 Très Venimeux (Épines dorsales)",
    depth: "1 - 50m",
    groupe: "Poissons",
    family: "Poisson osseux",
    image: require("../assets/images/animals/poisson_scorpion_barbu.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ROUGE],
    rarity: 2,
  },
  "Anguille Jardinière": {
    description:
      "Vit en colonies, dressée hors de son trou dans le sable comme une plante.",
    taille: "30 à 40 cm",
    danger: "🟢 Inoffensif",
    depth: "5 - 45m",
    image: require("../assets/images/animals/anguille_jardiniere.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ROUGE],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 2,
  },
  "Labre Nettoyeur": {
    description:
      "Établit des 'stations de lavage' pour manger les parasites des gros poissons.",
    taille: "10 à 14 cm",
    danger: "🟢 Inoffensif",
    depth: "1 - 30m",
    image: require("../assets/images/animals/labre_nettoyeur.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ROUGE],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 1,
  },
  Rémora: {
    description:
      "Possède une ventouse sur la tête pour se fixer aux requins ou tortues.",
    taille: "30 à 90 cm",
    danger: "🟢 Inoffensif",
    depth: "0 - 100m",
    image: require("../assets/images/animals/remora.png"),
    habitats: [
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
    ],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 1,
  },
  "Galère Portugaise": {
    description:
      "Ce n'est pas une méduse mais une colonie d'organismes. Très urticante.",
    taille: "15 cm (flotteur) / 30m (filaments)",
    danger: "🔴 Très Urticant",
    depth: "Surface",
    image: require("../assets/images/animals/galere_portugaise.png"),
    habitats: [
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
    ],
    family: "Méduse",
    groupe: "Cnidaires",
    rarity: 2,
  },
  "Poisson Ange Duc": {
    description:
      "Rayures verticales bleues, blanches et oranges. Très élégant.",
    taille: "20 à 25 cm",
    danger: "🟢 Inoffensif",
    depth: "2 - 50m",
    image: require("../assets/images/animals/poisson_ange_duc.png"),
    habitats: [OCEAN_NAMES.INDIEN, OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.ROUGE],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 2,
  },
  "Poisson Écureuil": {
    description:
      "Poisson nocturne doté de grands yeux pour voir dans l'obscurité.",
    taille: "15 à 30 cm",
    danger: "🟢 Inoffensif",
    depth: "1 - 100m",
    image: require("../assets/images/animals/poisson_ecureuil.png"),
    habitats: [
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.CARAIBES,
      OCEAN_NAMES.PACIFIQUE,
    ],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 1,
  },
  "Girelle Paon": {
    description:
      "Petit poisson très vif aux couleurs arc-en-ciel, commun en Méditerranée.",
    taille: "15 à 25 cm",
    danger: "🟢 Inoffensif",
    depth: "1 - 30m",
    image: require("../assets/images/animals/girelle_paon.png"),
    habitats: [OCEAN_NAMES.MEDITERRANEE, OCEAN_NAMES.ATLANTIQUE],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 1,
  },
  // --- ZONE POLAIRE (Arctique & Arctique) ---
  Béluga: {
    description:
      "Surnommé le 'canari des mers' à cause de ses sifflements aigus. Il est entièrement blanc.",
    taille: "3 à 5 mètres",
    danger: "🟢 Inoffensif",
    depth: "0 - 800m",
    image: require("../assets/images/animals/beluga.png"),
    habitats: [OCEAN_NAMES.ARCTIQUE],
    family: "Cétacé",
    groupe: "Mammifères Marins",
    rarity: 3,
  },
  "Requin du Groenland": {
    description:
      "Le vertébré à la longévité record : il peut vivre plus de 400 ans dans les eaux glacées.",
    taille: "4 à 7 mètres",
    danger: "🟠 Respecter une distance",
    depth: "0 - 2200m",
    image: require("../assets/images/animals/requin_du_groenland.png"),
    habitats: [OCEAN_NAMES.ARCTIQUE, OCEAN_NAMES.ATLANTIQUE],
    family: "Requin",
    groupe: "Poissons",
    rarity: 3,
  },

  // --- ABYSSES (Créatures de l'ombre) ---
  "Baudroie Abyssale": {
    description:
      "Possède un leurre lumineux sur la tête pour attirer ses proies dans le noir total.",
    taille: "20 à 60 cm",
    danger: "🟠 Morsure puissante",
    depth: "1000 - 4000m",
    image: require("../assets/images/animals/baudroie_abyssale.png"),
    habitats: [
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
    ],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 3,
  },
  "Requin Lutin": {
    description:
      "Un requin préhistorique rare avec un museau allongé et une mâchoire extensible.",
    taille: "3 à 4 mètres",
    danger: "🟢 Inoffensif",
    depth: "100 - 1300m",
    image: require("../assets/images/animals/requin_lutin.png"),
    habitats: [
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.INDIEN,
    ],
    family: "Requin",
    groupe: "Poissons",
    rarity: 3,
  },
  "Macropinna Microstoma": {
    description:
      "Poisson fascinant avec un dôme transparent sur la tête laissant voir ses yeux verts.",
    taille: "15 cm",
    danger: "🟢 Inoffensif",
    depth: "500 - 1000m",
    image: require("../assets/images/animals/macropinna_microstoma.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 3,
  },

  // --- GRANDS PÉLAGIQUES & SPORTIFS ---
  "Marlin Bleu": {
    description:
      "L'un des poissons les plus rapides et les plus puissants au monde.",
    taille: "3 à 5 mètres",
    danger: "🟠 Danger si acculé",
    depth: "0 - 200m",
    image: require("../assets/images/animals/marlin_bleu.png"),
    habitats: [
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
    ],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 2,
  },
  "Requin Mako": {
    description:
      "Le guépard des mers, capable de pointes de vitesse à plus de 70 km/h.",
    taille: "2.5 à 4 mètres",
    danger: "🔴 Potentiellement dangereux",
    depth: "0 - 500m",
    image: require("../assets/images/animals/requin_mako.png"),
    habitats: [
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.MEDITERRANEE,
    ],
    family: "Requin",
    groupe: "Poissons",
    rarity: 3,
  },
  Tarpon: {
    description:
      "Énorme poisson argenté capable de sauter hors de l'eau pour respirer de l'air.",
    taille: "1.5 à 2.5 mètres",
    danger: "🟢 Inoffensif",
    depth: "0 - 30m",
    image: require("../assets/images/animals/tarpon.png"),
    habitats: [
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.CARAIBES,
      OCEAN_NAMES.GOLFE_MEXIQUE,
    ],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 2,
  },

  // --- RÉCIFS & ZONES TROPICALES ---
  "Baliste Picasso": {
    description:
      "Reconnaissable à ses motifs géométriques rappelant une peinture moderne.",
    taille: "25 à 30 cm",
    danger: "🟢 Inoffensif",
    depth: "1 - 10m",
    image: require("../assets/images/animals/baliste_picasso.png"),
    habitats: [OCEAN_NAMES.ROUGE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.PACIFIQUE],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 1,
  },
  "Poisson-Ballon": {
    description:
      "Se gonfle d'eau pour effrayer ses prédateurs. Contient un poison mortel.",
    taille: "30 à 50 cm",
    danger: "🔴 Venimeux (Ingestion)",
    depth: "1 - 50m",
    image: require("../assets/images/animals/poisson_ballon.png"),
    habitats: [OCEAN_NAMES.INDIEN, OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.ROUGE],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 1,
  },
  "Poisson-Vache": {
    description: "Petit poisson coffre avec deux cornes sur la tête.",
    taille: "10 à 40 cm",
    danger: "🟢 Inoffensif",
    depth: "1 - 50m",
    image: require("../assets/images/animals/poisson_vache.png"),
    habitats: [OCEAN_NAMES.CARAIBES, OCEAN_NAMES.INDIEN, OCEAN_NAMES.PACIFIQUE],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 2,
  },
  "Poisson-Chauve-souris": {
    description:
      "Corps très plat et lèvres rouges vives (pour certaines espèces des Galapagos).",
    taille: "20 à 40 cm",
    danger: "🟢 Inoffensif",
    depth: "3 - 70m",
    image: require("../assets/images/animals/poisson_chauve_souris.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.CARAIBES],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 2,
  },
  "Dauphin à long bec": {
    description:
      "Célèbre pour ses sauts acrobatiques où il tournoie sur lui-même.",
    taille: "1.8 à 2.2 mètres",
    danger: "🟢 Inoffensif",
    depth: "0 - 50m",
    image: require("../assets/images/animals/dauphin_long_bec.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ROUGE],
    family: "Cétacé",
    groupe: "Mammifères Marins",
    rarity: 2,
  },

  // --- FORMES ÉTRANGES & RAIES ---
  "Raie Guitare": {
    description: "Une forme intermédiaire entre le requin et la raie.",
    taille: "1.5 à 2.5 mètres",
    danger: "🟢 Inoffensif",
    depth: "1 - 100m",
    image: require("../assets/images/animals/raie_guitare.png"),
    habitats: [
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.MEDITERRANEE,
      OCEAN_NAMES.ROUGE,
    ],
    family: "Raie",
    groupe: "Poissons",
    rarity: 2,
  },
  "Squille (Crevette Mante)": {
    description:
      "Possède les yeux les plus complexes du règne animal et une frappe ultra-puissante.",
    taille: "10 à 30 cm",
    danger: "🟠 Coup de pattes puissant",
    depth: "5 - 40m",
    image: require("../assets/images/animals/squille.png"),
    habitats: [OCEAN_NAMES.INDIEN, OCEAN_NAMES.PACIFIQUE],
    family: "Crustacé",
    groupe: "Arthropodes",
    rarity: 2,
  },

  // --- INVERTÉBRÉS & CORAUX ---
  "Pieuvre Géante du Pacifique": {
    description: "La plus grande et la plus intelligente des pieuvres.",
    taille: "3 à 5 mètres",
    danger: "🟢 Inoffensif",
    depth: "0 - 1500m",
    image: require("../assets/images/animals/pieuvre_geante_pacifique.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE],
    family: "Céphalopode",
    groupe: "Mollusques",
    rarity: 3,
  },
  "Étoile de Mer Pourpre": {
    description:
      "Étoile de mer commune aux couleurs éclatantes, très résistante.",
    taille: "15 à 25 cm",
    danger: "🟢 Inoffensif",
    depth: "0 - 200m",
    image: require("../assets/images/animals/etoile_de_mer_pourpre.png"),
    habitats: [OCEAN_NAMES.ATLANTIQUE, OCEAN_NAMES.PACIFIQUE],
    family: "Étoile de mer",
    groupe: "Échinodermes",
    rarity: 1,
  },
  "Corail Cerveau": {
    description:
      "Corail dur dont les motifs ressemblent aux circonvolutions d'un cerveau.",
    taille: "Jusqu'à 1.8 mètre",
    danger: "🟢 Inoffensif",
    depth: "1 - 30m",
    image: require("../assets/images/animals/corail_cerveau.png"),
    habitats: [OCEAN_NAMES.CARAIBES, OCEAN_NAMES.INDIEN, OCEAN_NAMES.PACIFIQUE],
    family: "Corail",
    groupe: "Cnidaires",
    rarity: 1,
  },
  "Éponge Baril": {
    description:
      "Surnommée la 'séquoia de l'océan' pour sa taille et sa longévité millénaire.",
    taille: "1 à 2 mètres",
    danger: "🟢 Inoffensif",
    depth: "10 - 50m",
    image: require("../assets/images/animals/eponge_baril.png"),
    habitats: [OCEAN_NAMES.CARAIBES, OCEAN_NAMES.ATLANTIQUE],
    family: "Spongiaire",
    groupe: "Spongiaires",
    rarity: 1,
  },
  "Poisson-Papillon": {
    description:
      "Petit poisson de récif élégant, souvent en couple inséparable.",
    taille: "15 à 20 cm",
    danger: "🟢 Inoffensif",
    depth: "1 - 40m",
    image: require("../assets/images/animals/poisson_papillon.png"),
    habitats: [
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.CARAIBES,
      OCEAN_NAMES.ROUGE,
    ],
    family: "Poisson osseux",
    groupe: "Poissons",
    rarity: 1,
  },
  // --- REPTILES MARINS ---
  "Tricot Rayé": {
    description:
      "Un serpent marin extrêmement venimeux mais très docile, souvent vu sur les récifs du Pacifique.",
    taille: "1 à 1.5 mètre",
    danger: "🔴 Très Venimeux",
    depth: "0 - 30m",
    groupe: "Reptiles",
    family: "Serpent",
    image: require("../assets/images/animals/tricot_raye.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.CHINE],
    rarity: 2,
  },

  // --- CNIDAIRES (Coraux, Méduses, Anémones) ---
  "Anémone Magnifique": {
    description:
      "L'habitat privilégié des poissons-clowns. Ses tentacules abritent des cellules urticantes.",
    taille: "30 à 50 cm",
    danger: "🟠 Urticant",
    depth: "1 - 20m",
    groupe: "Cnidaires",
    family: "Anémone",
    image: require("../assets/images/animals/anemone_magnifique.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ROUGE],
    rarity: 1,
  },
  "Méduse Aurélie": {
    description:
      "Méduse commune en forme de disque translucide, reconnaissable à ses quatre gonades en forme de fer à cheval.",
    taille: "25 à 40 cm",
    danger: "🟢 Faiblement urticant",
    depth: "0 - 15m",
    groupe: "Cnidaires",
    family: "Méduse",
    image: require("../assets/images/animals/meduse_aurelie.png"),
    habitats: [
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.MEDITERRANEE,
    ],
    rarity: 1,
  },
  "Corail de Feu": {
    description:
      "Ressemble à un corail mais appartient aux hydrozoaires. Provoque de fortes brûlures au contact.",
    taille: "Variable",
    danger: "🔴 Brûlures intenses",
    depth: "1 - 40m",
    groupe: "Cnidaires",
    family: "Corail",
    image: require("../assets/images/animals/corail_de_feu.png"),
    habitats: [OCEAN_NAMES.CARAIBES, OCEAN_NAMES.ROUGE, OCEAN_NAMES.INDIEN],
    rarity: 1,
  },

  // --- ÉCHINODERMES (Étoiles, Oursins, Holothuries) ---
  "Oursin Diadème": {
    description:
      "Possède des piquants noirs extrêmement longs et fins. Très commun dans les récifs tropicaux.",
    taille: "20 à 30 cm",
    danger: "🟠 Piquants douloureux",
    depth: "1 - 50m",
    groupe: "Échinodermes",
    family: "Oursin",
    image: require("../assets/images/animals/oursin_diademe.png"),
    habitats: [
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.ROUGE,
      OCEAN_NAMES.CARAIBES,
    ],
    rarity: 1,
  },
  "Étoile de Mer Couronne d'Épines": {
    description:
      "Se nourrit de corail et peut ravager des récifs entiers. Elle est couverte de pointes venimeuses.",
    taille: "25 à 35 cm",
    danger: "🔴 Venimeux (Piquants)",
    depth: "1 - 30m",
    groupe: "Échinodermes",
    family: "Étoile de mer",
    image: require("../assets/images/animals/etoile_de_mer_couronne_epines.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ROUGE],
    rarity: 2,
  },
  "Holothurie Ananas": {
    description:
      "Un concombre de mer massif dont les papilles ressemblent aux écailles d'un ananas.",
    taille: "40 à 70 cm",
    danger: "🟢 Inoffensif",
    depth: "2 - 30m",
    groupe: "Échinodermes",
    family: "Holothurie",
    image: require("../assets/images/animals/holothurie_ananas.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN],
    rarity: 2,
  },

  // --- ARTHROPODES (Crustacés) ---
  "Crevette Nettoyeuse": {
    description:
      "Établit des stations de nettoyage où elle déparasite les poissons et même les plongeurs.",
    taille: "5 à 6 cm",
    danger: "🟢 Inoffensif",
    depth: "2 - 40m",
    groupe: "Arthropodes",
    family: "Crustacé",
    image: require("../assets/images/animals/crevette_nettoyeuse.png"),
    habitats: [
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.CARAIBES,
      OCEAN_NAMES.ROUGE,
    ],
    rarity: 1,
  },

  // --- MOLLUSQUES (Gastéropodes & Bivalves) ---
  "Cône Géographe": {
    description:
      "L'un des coquillages les plus dangereux au monde. Son dard venimeux peut être mortel.",
    taille: "10 à 15 cm",
    danger: "🔴 Mortel",
    depth: "1 - 20m",
    groupe: "Mollusques",
    family: "Gastéropode",
    image: require("../assets/images/animals/cone_geographe.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ROUGE],
    rarity: 3,
  },
  "Nudibranche Chromodoris": {
    description:
      "Limace de mer aux motifs pyjamas bleus et jaunes. Une star de la macrophotographie.",
    taille: "3 à 5 cm",
    danger: "🟢 Inoffensif",
    depth: "5 - 30m",
    groupe: "Mollusques",
    family: "Gastéropode",
    image: require("../assets/images/animals/nudibranche_chromodoris.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN],
    rarity: 2,
  },
  "Porcelaine (Cypraea)": {
    description:
      "Coquillage au test très brillant et lisse, autrefois utilisé comme monnaie.",
    taille: "5 à 10 cm",
    danger: "🟢 Inoffensif",
    depth: "0 - 20m",
    groupe: "Mollusques",
    family: "Gastéropode",
    image: require("../assets/images/animals/porcelaine.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ROUGE],
    rarity: 2,
  },

  // --- POISSONS OSSEUX (Compléments) ---
  "Poisson-Faucon à long nez": {
    description:
      "Petit poisson très vif souvent posté immobile sur les branches de gorgones.",
    taille: "10 à 13 cm",
    danger: "🟢 Inoffensif",
    depth: "10 - 50m",
    groupe: "Poissons",
    family: "Poisson osseux",
    image: require("../assets/images/animals/poisson_faucon_long_nez.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ROUGE],
    rarity: 2,
  },
  "Poisson-Lime": {
    description:
      "Reconnaissable à sa forme plate et sa peau rugueuse comme une lime.",
    taille: "20 à 40 cm",
    danger: "🟢 Inoffensif",
    depth: "1 - 30m",
    groupe: "Poissons",
    family: "Poisson osseux",
    image: require("../assets/images/animals/poisson_lime.png"),
    habitats: [
      OCEAN_NAMES.INDIEN,
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.ATLANTIQUE,
    ],
    rarity: 2,
  },

  // --- MAMMIFÈRES (Pinnipèdes & Oiseaux) ---
  "Léopard de Mer": {
    description:
      "Le super-prédateur de l'Antarctique. Puissant et doté d'une mâchoire impressionnante.",
    taille: "3 à 3.5 mètres",
    danger: "🔴 Dangereux",
    depth: "0 - 300m",
    groupe: "Mammifères Marins",
    family: "Pinnipède",
    image: require("../assets/images/animals/leopard_de_mer.png"),
    habitats: [OCEAN_NAMES.ARCTIQUE], // Techniquement Océan Austral/Antarctique
    rarity: 3,
  },
  "Manchot Papou": {
    description:
      "Le nageur le plus rapide de tous les manchots, capable d'atteindre 35 km/h sous l'eau.",
    taille: "70 à 80 cm",
    danger: "🟢 Inoffensif",
    depth: "0 - 150m",
    groupe: "Mammifères Marins", // Classification simplifiée pour l'app, ou "Oiseaux"
    family: "Oiseau marin",
    image: require("../assets/images/animals/manchot_papou.png"),
    habitats: [
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.PACIFIQUE,
      OCEAN_NAMES.INDIEN,
    ],
    rarity: 2,
  },
  "Grand Cormoran": {
    description:
      "Oiseau marin capable de plonger à des profondeurs surprenantes pour chasser ses poissons.",
    taille: "80 à 100 cm",
    danger: "🟢 Inoffensif",
    depth: "0 - 10m",
    groupe: "Poissons", // À classer dans "Oiseaux Marins" si tu crées le groupe
    family: "Oiseau marin",
    image: require("../assets/images/animals/grand_cormoran.png"),
    habitats: [
      OCEAN_NAMES.ATLANTIQUE,
      OCEAN_NAMES.MEDITERRANEE,
      OCEAN_NAMES.CHINE,
    ],
    rarity: 1,
  },
  "Triton Géant": {
    description:
      "L'un des rares prédateurs naturels de l'étoile couronne d'épines. Coquillage protégé.",
    taille: "30 à 50 cm",
    danger: "🟢 Inoffensif",
    depth: "1 - 30m",
    groupe: "Mollusques",
    family: "Gastéropode",
    image: require("../assets/images/animals/triton_geant.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ROUGE],
    rarity: 3,
  },
  "Oursin Crayon": {
    description:
      "Possède des piquants très larges et émoussés, autrefois utilisés pour écrire sur l'ardoise.",
    taille: "10 à 15 cm",
    danger: "🟢 Inoffensif",
    depth: "1 - 25m",
    groupe: "Échinodermes",
    family: "Oursin",
    image: require("../assets/images/animals/oursin_crayon.png"),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ROUGE],
    rarity: 2,
  },
};

// --- 2. GÉOGRAPHIE ---
export const GEOGRAPHY_DB: Record<string, string[]> = {
  France: ["Atlantique", "Méditerranée"],
  Espagne: ["Atlantique", "Méditerranée"],
  Maldives: ["Océan Indien"],
  Indonésie: ["Océan Indien", "Pacifique"],
  Australie: ["Pacifique", "Océan Indien"],
  Égypte: ["Mer Rouge"],
  Mexique: ["Pacifique", "Caraïbes"],
  Thaïlande: ["Mer d'Andaman", "Golfe de Thaïlande"],
  USA: ["Atlantique", "Pacifique", "Golfe du Mexique"],
  Japon: ["Pacifique"],
  Brésil: ["Atlantique"],
  Canada: ["Atlantique", "Pacifique", "Arctique"],
  "La Réunion": ["Océan Indien"],
  "Costa Rica": ["Pacifique", "Caraïbes"],
  "Polynésie Française": ["Pacifique"],
  "Afrique du Sud": ["Atlantique", "Océan Indien"],
  Maurice: ["Océan Indien"],
  Seychelles: ["Océan Indien"],
  Colombie: ["Pacifique", "Caraïbes"],
  Philippines: ["Pacifique", "Mer de Chine"],
  Italie: ["Méditerranée"],
  Grèce: ["Méditerranée"],
  Guadeloupe: ["Caraïbes"],
  Martinique: ["Caraïbes"],
};

// --- 3. INTERFACES ---
export interface Observation {
  id: string;
  speciesName: string;
  date: string;
  location: string;
  ocean: string;
  userPhoto?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}
// Le groupe large (Embranchement ou Classe selon l'importance)
export type GroupType =
  | "Mammifères Marins"
  | "Poissons"
  | "Reptiles"
  | "Mollusques"
  | "Arthropodes"
  | "Cnidaires"
  | "Échinodermes"
  | "Spongiaires";

// Le type précis (Ordre ou Famille commune)
export type FamilyType =
  // Mammifères
  | "Cétacé"
  | "Pinnipède"
  | "Sirénien"
  | "Oiseau marin"
  // Poissons
  | "Requin"
  | "Raie"
  | "Poisson osseux"
  // Reptiles
  | "Tortue"
  | "Serpent"
  // Mollusques
  | "Céphalopode"
  | "Gastéropode"
  | "Bivalve"
  // Arthropodes
  | "Crustacé"
  // Cnidaires
  | "Corail"
  | "Méduse"
  | "Anémone"
  // Échinodermes
  | "Étoile de mer"
  | "Oursin"
  | "Holothurie"
  // Spongiaires
  | "Spongiaire";

export type RarityType = 1 | 2 | 3;

export interface Animal {
  id: string;
  name: string;
  image: any;
  discovered: boolean;
  descriptionription: string;
  size: string;
  depth: string;
  danger?: string;
  habitats?: string[];
  family: FamilyType; // NOUVEAU : Pour les badges
  groupe: GroupType;
  rarity: RarityType; // NOUVEAU : Pour l'XP (100xp, 200xp, 500xp)
}

export const initialAnimals: Animal[] = Object.keys(ENCYCLOPEDIA_DATA).map(
  (key, index) => {
    const data = ENCYCLOPEDIA_DATA[key];
    return {
      id: String(index + 1),
      name: key,
      image: data.image,
      discovered: false,
      descriptionription: data.description,
      size: data.taille,
      depth: data.depth,
      danger: data.danger,
      habitats: data.habitats,
      family: data.family,
      groupe: data.groupe,
      rarity: data.rarity,
    };
  },
);
// --- 1.5 COORDONNÉES PRÉCISES PAR OCÉAN (Liste Étendue) ---
export const COUNTRY_COORDINATES: Record<
  string,
  Record<string, { latitude: number; longitude: number }>
> = {
  // --- EUROPE ---
  France: {
    [OCEAN_NAMES.ATLANTIQUE]: { latitude: 47.5, longitude: -3.0 }, // Bretagne
    [OCEAN_NAMES.MEDITERRANEE]: { latitude: 43.0, longitude: 6.2 }, // Port-Cros
    Manche: { latitude: 49.5, longitude: -1.5 },
  },
  Espagne: {
    [OCEAN_NAMES.ATLANTIQUE]: { latitude: 43.0, longitude: -9.0 }, // Galice
    [OCEAN_NAMES.MEDITERRANEE]: { latitude: 39.5, longitude: 2.8 }, // Majorque
    Canaries: { latitude: 28.0, longitude: -16.5 }, // Tenerife (Tech. Atlantique mais zone distincte)
  },
  Italie: {
    [OCEAN_NAMES.MEDITERRANEE]: { latitude: 41.2, longitude: 9.8 }, // Sardaigne/Elbe
    Adriatique: { latitude: 42.0, longitude: 15.0 },
  },
  Portugal: {
    [OCEAN_NAMES.ATLANTIQUE]: { latitude: 37.0, longitude: -8.9 }, // Algarve
    Açores: { latitude: 37.7, longitude: -25.6 },
    Madère: { latitude: 32.6, longitude: -16.9 },
  },
  Grèce: { [OCEAN_NAMES.MEDITERRANEE]: { latitude: 36.8, longitude: 25.0 } }, // Cyclades
  Croatie: { [OCEAN_NAMES.MEDITERRANEE]: { latitude: 43.5, longitude: 16.0 } },
  Malte: { [OCEAN_NAMES.MEDITERRANEE]: { latitude: 35.9, longitude: 14.4 } },
  Chypre: { [OCEAN_NAMES.MEDITERRANEE]: { latitude: 34.9, longitude: 33.6 } },
  "Royaume-Uni": {
    [OCEAN_NAMES.ATLANTIQUE]: { latitude: 50.1, longitude: -5.5 }, // Cornouailles
    "Mer du Nord": { latitude: 58.9, longitude: -3.0 }, // Scapa Flow
  },
  Irlande: { [OCEAN_NAMES.ATLANTIQUE]: { latitude: 52.0, longitude: -10.5 } },
  Norvège: {
    [OCEAN_NAMES.ATLANTIQUE]: { latitude: 60.3, longitude: 5.3 },
    [OCEAN_NAMES.ARCTIQUE]: { latitude: 69.6, longitude: 18.9 }, // Tromsø (Orques)
  },
  Islande: { [OCEAN_NAMES.ATLANTIQUE]: { latitude: 64.1, longitude: -21.9 } }, // Silfra
  Turquie: {
    [OCEAN_NAMES.MEDITERRANEE]: { latitude: 36.2, longitude: 29.6 }, // Kas
    "Mer Égée": { latitude: 37.0, longitude: 27.4 }, // Bodrum
  },
  Monténégro: {
    [OCEAN_NAMES.MEDITERRANEE]: { latitude: 42.4, longitude: 18.6 },
  }, // Baie de Kotor
  Albanie: { [OCEAN_NAMES.MEDITERRANEE]: { latitude: 40.1, longitude: 19.7 } }, // Saranda (Ionian)
  Monaco: { [OCEAN_NAMES.MEDITERRANEE]: { latitude: 43.7, longitude: 7.4 } },
  Suède: { "Mer Baltique": { latitude: 59.0, longitude: 18.5 } }, // Épaves froide
  Danemark: { "Mer du Nord": { latitude: 56.0, longitude: 8.0 } },
  // --- AFRIQUE & MOYEN-ORIENT ---
  Maroc: {
    [OCEAN_NAMES.MEDITERRANEE]: { latitude: 35.8, longitude: -5.5 },
    [OCEAN_NAMES.ATLANTIQUE]: { latitude: 30.4, longitude: -9.6 }, // Agadir
  },
  "Sao Tomé-et-Principe": {
    [OCEAN_NAMES.ATLANTIQUE]: { latitude: 0.3, longitude: 6.7 },
  },
  Ghana: { [OCEAN_NAMES.ATLANTIQUE]: { latitude: 5.5, longitude: 0.0 } },
  Égypte: {
    [OCEAN_NAMES.ROUGE]: { latitude: 27.2, longitude: 33.8 }, // Hurghada/Marsa Alam
    [OCEAN_NAMES.MEDITERRANEE]: { latitude: 31.2, longitude: 29.9 },
  },
  Soudan: { [OCEAN_NAMES.ROUGE]: { latitude: 19.6, longitude: 37.2 } },
  Djibouti: { [OCEAN_NAMES.ROUGE]: { latitude: 11.6, longitude: 42.8 } }, // Requins Baleines
  Oman: { [OCEAN_NAMES.INDIEN]: { latitude: 23.5, longitude: 58.5 } },
  Jordanie: { [OCEAN_NAMES.ROUGE]: { latitude: 29.5, longitude: 34.9 } }, // Aqaba
  "Afrique du Sud": {
    [OCEAN_NAMES.ATLANTIQUE]: { latitude: -34.1, longitude: 18.4 }, // Cape Town
    [OCEAN_NAMES.INDIEN]: { latitude: -30.0, longitude: 31.0 }, // Aliwal Shoal/Durban
  },
  Mozambique: { [OCEAN_NAMES.INDIEN]: { latitude: -23.8, longitude: 35.5 } }, // Tofo
  Tanzanie: { [OCEAN_NAMES.INDIEN]: { latitude: -6.1, longitude: 39.2 } }, // Zanzibar
  Kenya: { [OCEAN_NAMES.INDIEN]: { latitude: -4.0, longitude: 39.7 } },
  Madagascar: { [OCEAN_NAMES.INDIEN]: { latitude: -13.3, longitude: 48.2 } }, // Nosy Be
  Maurice: { [OCEAN_NAMES.INDIEN]: { latitude: -20.3, longitude: 57.5 } },
  Seychelles: { [OCEAN_NAMES.INDIEN]: { latitude: -4.6, longitude: 55.5 } },
  "Cap-Vert": {
    [OCEAN_NAMES.ATLANTIQUE]: { latitude: 16.6, longitude: -22.9 },
  },
  Sénégal: { [OCEAN_NAMES.ATLANTIQUE]: { latitude: 14.7, longitude: -17.5 } },
  "Arabie Saoudite": {
    [OCEAN_NAMES.ROUGE]: { latitude: 22.5, longitude: 38.9 }, // Jeddah/Farasan Banks
    "Golfe Persique": { latitude: 26.5, longitude: 50.5 },
  },
  Israël: {
    [OCEAN_NAMES.ROUGE]: { latitude: 29.5, longitude: 34.9 }, // Eilat
    [OCEAN_NAMES.MEDITERRANEE]: { latitude: 32.5, longitude: 34.8 },
  },
  "Émirats Arabes Unis": {
    [OCEAN_NAMES.INDIEN]: { latitude: 25.5, longitude: 56.4 }, // Fujairah (Golfe d'Oman)
    "Golfe Persique": { latitude: 25.0, longitude: 54.0 },
  },
  Qatar: { "Golfe Persique": { latitude: 25.3, longitude: 51.5 } },
  // --- ASIE ---
  Indonésie: {
    [OCEAN_NAMES.INDIEN]: { latitude: -8.7, longitude: 115.5 }, // Bali/Nusa Penida
    [OCEAN_NAMES.PACIFIQUE]: { latitude: -0.5, longitude: 130.5 }, // Raja Ampat
    "Mer de Java": { latitude: -5.8, longitude: 110.4 }, // Karimunjawa
  },
  Maldives: { [OCEAN_NAMES.INDIEN]: { latitude: 3.5, longitude: 73.0 } },
  Thaïlande: {
    [OCEAN_NAMES.ANDAMAN]: { latitude: 7.9, longitude: 98.3 }, // Phuket/Similan
    "Golfe de Thaïlande": { latitude: 10.1, longitude: 99.9 }, // Koh Tao
  },
  Philippines: {
    [OCEAN_NAMES.PACIFIQUE]: { latitude: 9.6, longitude: 123.8 }, // Bohol/Visayas
    [OCEAN_NAMES.CHINE]: { latitude: 11.2, longitude: 119.4 }, // Palawan
  },
  Malaisie: {
    [OCEAN_NAMES.PACIFIQUE]: { latitude: 4.2, longitude: 118.6 }, // Sipadan (Bornéo)
    "Mer de Chine": { latitude: 2.8, longitude: 104.1 }, // Tioman
  },
  Japon: {
    [OCEAN_NAMES.PACIFIQUE]: { latitude: 26.2, longitude: 127.7 }, // Okinawa
    "Mer du Japon": { latitude: 35.6, longitude: 135.0 },
  },
  Vietnam: { [OCEAN_NAMES.CHINE]: { latitude: 12.2, longitude: 109.3 } }, // Nha Trang
  "Sri Lanka": { [OCEAN_NAMES.INDIEN]: { latitude: 6.0, longitude: 80.2 } },
  Inde: {
    [OCEAN_NAMES.INDIEN]: { latitude: 10.5, longitude: 72.6 }, // Lakshadweep
    [OCEAN_NAMES.ANDAMAN]: { latitude: 11.5, longitude: 92.7 }, // Îles Andaman
  },
  Taïwan: { [OCEAN_NAMES.PACIFIQUE]: { latitude: 22.0, longitude: 120.7 } },
  "Timor oriental": {
    [OCEAN_NAMES.INDIEN]: { latitude: -8.5, longitude: 125.6 },
  }, // Atauro Island (Biodiversité record)
  Myanmar: { [OCEAN_NAMES.ANDAMAN]: { latitude: 12.0, longitude: 98.0 } }, // Mergui Archipelago
  Cambodge: { "Golfe de Thaïlande": { latitude: 10.5, longitude: 103.5 } }, // Koh Rong
  "Corée du Sud": {
    [OCEAN_NAMES.PACIFIQUE]: { latitude: 33.3, longitude: 126.5 },
  }, // Jeju Island
  Singapour: { "Mer de Chine": { latitude: 1.2, longitude: 103.8 } }, // Pulau Hantu
  // --- OCÉANIE ---
  Australie: {
    [OCEAN_NAMES.PACIFIQUE]: { latitude: -16.8, longitude: 145.8 }, // Grande Barrière (Cairns)
    [OCEAN_NAMES.INDIEN]: { latitude: -21.9, longitude: 114.1 }, // Ningaloo Reef
  },
  "Nouvelle-Zélande": {
    [OCEAN_NAMES.PACIFIQUE]: { latitude: -35.5, longitude: 174.5 },
  }, // Poor Knights
  "Polynésie Française": {
    [OCEAN_NAMES.PACIFIQUE]: { latitude: -16.5, longitude: -151.7 },
  }, // Bora Bora/Rangiroa
  "Nouvelle-Calédonie": {
    [OCEAN_NAMES.PACIFIQUE]: { latitude: -22.3, longitude: 166.4 },
  },
  Fidji: { [OCEAN_NAMES.PACIFIQUE]: { latitude: -17.7, longitude: 178.0 } },
  Palau: { [OCEAN_NAMES.PACIFIQUE]: { latitude: 7.3, longitude: 134.5 } },
  Micronésie: { [OCEAN_NAMES.PACIFIQUE]: { latitude: 7.4, longitude: 151.8 } }, // Truk Lagoon
  "Papouasie-Nouvelle-Guinée": {
    [OCEAN_NAMES.PACIFIQUE]: { latitude: -9.4, longitude: 147.2 },
  },
  Vanuatu: { [OCEAN_NAMES.PACIFIQUE]: { latitude: -17.7, longitude: 168.3 } },
  "Îles Salomon": {
    [OCEAN_NAMES.PACIFIQUE]: { latitude: -9.0, longitude: 160.0 },
  }, // Guadalcanal/Wrecks
  Tonga: { [OCEAN_NAMES.PACIFIQUE]: { latitude: -18.6, longitude: -174.0 } }, // Vava'u (Baleines à bosse)
  "Îles Cook": {
    [OCEAN_NAMES.PACIFIQUE]: { latitude: -21.2, longitude: -159.8 },
  }, // Rarotonga
  Samoa: { [OCEAN_NAMES.PACIFIQUE]: { latitude: -13.8, longitude: -172.0 } },
  "Îles Marshall": {
    [OCEAN_NAMES.PACIFIQUE]: { latitude: 7.1, longitude: 171.2 },
  }, // Bikini Atoll (Épaves nucléaires)
  Kiribati: { [OCEAN_NAMES.PACIFIQUE]: { latitude: 1.9, longitude: -157.4 } }, // Kiritimati
  // --- AMÉRIQUE DU NORD & CARAÏBES ---
  USA: {
    [OCEAN_NAMES.ATLANTIQUE]: { latitude: 25.0, longitude: -80.4 }, // Florida Keys
    [OCEAN_NAMES.PACIFIQUE]: { latitude: 33.3, longitude: -118.3 }, // Californie/Catalina
    [OCEAN_NAMES.GOLFE_MEXIQUE]: { latitude: 27.8, longitude: -93.0 },
    Hawaï: { latitude: 20.7, longitude: -156.4 },
  },
  Canada: {
    [OCEAN_NAMES.ATLANTIQUE]: { latitude: 47.5, longitude: -53.0 }, // Terre-Neuve
    [OCEAN_NAMES.PACIFIQUE]: { latitude: 49.5, longitude: -126.5 }, // Vancouver Island
    [OCEAN_NAMES.ARCTIQUE]: { latitude: 72.0, longitude: -80.0 },
  },
  Mexique: {
    [OCEAN_NAMES.CARAIBES]: { latitude: 20.5, longitude: -86.9 }, // Cozumel/Cenotes
    [OCEAN_NAMES.PACIFIQUE]: { latitude: 24.1, longitude: -110.3 }, // La Paz/Sea of Cortez
    Socorro: { latitude: 18.8, longitude: -110.9 }, // Revillagigedo
  },
  Bahamas: { [OCEAN_NAMES.ATLANTIQUE]: { latitude: 24.5, longitude: -76.5 } }, // Exumas
  Belize: { [OCEAN_NAMES.CARAIBES]: { latitude: 17.5, longitude: -87.5 } }, // Blue Hole
  Honduras: { [OCEAN_NAMES.CARAIBES]: { latitude: 16.3, longitude: -86.5 } }, // Roatan
  "Costa Rica": {
    [OCEAN_NAMES.PACIFIQUE]: { latitude: 5.5, longitude: -87.0 }, // Île Coco
    [OCEAN_NAMES.CARAIBES]: { latitude: 9.9, longitude: -83.0 },
  },
  Panama: {
    [OCEAN_NAMES.PACIFIQUE]: { latitude: 7.6, longitude: -81.7 }, // Coiba
    [OCEAN_NAMES.CARAIBES]: { latitude: 9.3, longitude: -82.2 }, // Bocas del Toro
  },
  Cuba: { [OCEAN_NAMES.CARAIBES]: { latitude: 21.6, longitude: -81.5 } }, // Jardines de la Reina
  "République Dominicaine": {
    [OCEAN_NAMES.CARAIBES]: { latitude: 18.3, longitude: -68.8 },
  },
  Guadeloupe: { [OCEAN_NAMES.CARAIBES]: { latitude: 16.1, longitude: -61.8 } }, // Réserve Cousteau
  Martinique: { [OCEAN_NAMES.CARAIBES]: { latitude: 14.5, longitude: -61.1 } },
  "Saint-Martin": {
    [OCEAN_NAMES.CARAIBES]: { latitude: 18.0, longitude: -63.0 },
  },
  Bonaire: { [OCEAN_NAMES.CARAIBES]: { latitude: 12.1, longitude: -68.3 } },
  Curaçao: { [OCEAN_NAMES.CARAIBES]: { latitude: 12.2, longitude: -69.0 } },
  "Îles Caïmans": {
    [OCEAN_NAMES.CARAIBES]: { latitude: 19.3, longitude: -81.4 },
  },
  "Turques-et-Caïques": {
    [OCEAN_NAMES.ATLANTIQUE]: { latitude: 21.8, longitude: -72.3 },
  }, // Grand Turk
  Bermudes: { [OCEAN_NAMES.ATLANTIQUE]: { latitude: 32.3, longitude: -64.8 } }, // Épaves
  Aruba: { [OCEAN_NAMES.CARAIBES]: { latitude: 12.5, longitude: -70.0 } },
  Dominique: { [OCEAN_NAMES.CARAIBES]: { latitude: 15.4, longitude: -61.4 } }, // Cachalots
  "Sainte-Lucie": {
    [OCEAN_NAMES.CARAIBES]: { latitude: 13.9, longitude: -61.0 },
  },
  Barbade: { [OCEAN_NAMES.ATLANTIQUE]: { latitude: 13.2, longitude: -59.6 } },
  Grenade: { [OCEAN_NAMES.CARAIBES]: { latitude: 12.0, longitude: -61.7 } }, // Sculpture Park
  "Îles Vierges britanniques": {
    [OCEAN_NAMES.CARAIBES]: { latitude: 18.4, longitude: -64.6 },
  },
  "Îles Vierges des États-Unis": {
    [OCEAN_NAMES.CARAIBES]: { latitude: 18.3, longitude: -64.8 },
  },
  "Saint-Kitts-et-Nevis": {
    [OCEAN_NAMES.CARAIBES]: { latitude: 17.3, longitude: -62.7 },
  },
  "Antigua-et-Barbuda": {
    [OCEAN_NAMES.CARAIBES]: { latitude: 17.0, longitude: -61.8 },
  },
  "Porto Rico": {
    [OCEAN_NAMES.CARAIBES]: { latitude: 18.2, longitude: -66.4 },
  },
  // --- AMÉRIQUE DU SUD ---
  Brésil: {
    [OCEAN_NAMES.ATLANTIQUE]: { latitude: -3.8, longitude: -32.4 }, // Fernando de Noronha
  },
  Colombie: {
    [OCEAN_NAMES.CARAIBES]: { latitude: 12.5, longitude: -81.7 }, // San Andres/Providencia
    [OCEAN_NAMES.PACIFIQUE]: { latitude: 3.9, longitude: -81.6 }, // Malpelo
  },
  Équateur: {
    [OCEAN_NAMES.PACIFIQUE]: { latitude: -0.8, longitude: -91.0 }, // Galapagos
  },
  Pérou: { [OCEAN_NAMES.PACIFIQUE]: { latitude: -13.5, longitude: -76.5 } },
  Chili: { [OCEAN_NAMES.PACIFIQUE]: { latitude: -27.0, longitude: -71.0 } },
  Venezuela: { [OCEAN_NAMES.CARAIBES]: { latitude: 11.9, longitude: -66.1 } }, // Los Roques
  Argentine: {
    [OCEAN_NAMES.ATLANTIQUE]: { latitude: -42.5, longitude: -64.0 },
  }, // Péninsule Valdés (Orques/Lions de mer)
  Uruguay: { [OCEAN_NAMES.ATLANTIQUE]: { latitude: -35.0, longitude: -54.9 } }, // Isla de Lobos
  // --- ZONES POLAIRES (Extrême) ---
  Antarctique: { "Océan Austral": { latitude: -64.8, longitude: -62.6 } }, // Péninsule Antarctique
  Groenland: { [OCEAN_NAMES.ARCTIQUE]: { latitude: 69.0, longitude: -51.0 } }, // Disko Bay
};
