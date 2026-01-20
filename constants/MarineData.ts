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
  GOLFE_MEXIQUE: "Golfe du Mexique"
};

// --- 1. L'ENCYCLOPÉDIE ---
export const ENCYCLOPEDIA_DATA: Record<string, { desc: string; taille: string; danger: string; depth: string; image: any; habitats: string[] }> = {
  // --- REQUINS & RAIES ---
  "Requin Baleine": {
    desc: "Le plus grand poisson du monde. Totalement inoffensif.",
    taille: "4 à 14 mètres",
    danger: "🟢 Inoffensif",
    depth: "Surface - 1900m",
    // ⚠️ ATTENTION : Assure-toi que 'requin_baleine.png' est bien dans le dossier !
    // Si tu ne l'as pas, mets temporairement 'grand_requin_blanc.png' pour tester.
    image: require('../assets/images/animals/requin_baleine.png'), 
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ATLANTIQUE, OCEAN_NAMES.CARAIBES]
  },
  "Requin Tigre": {
    desc: "Un super-prédateur curieux avec des rayures verticales.",
    taille: "3 à 5 mètres",
    danger: "🔴 Potentiellement dangereux",
    depth: "0 - 350m",
    // ⚠️ Vérifie que ce fichier existe
    image: require('../assets/images/animals/requin_tigre.png'),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ATLANTIQUE, OCEAN_NAMES.CARAIBES]
  },
  "Requin Marteau": {
    desc: "Reconnaissable à sa tête en forme de T.",
    taille: "3 à 6 mètres",
    danger: "🟠 Respecter une distance",
    depth: "0 - 275m",
    // ⚠️ Vérifie que ce fichier existe
    image: require('../assets/images/animals/requin_marteau.png'),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ATLANTIQUE, OCEAN_NAMES.ROUGE]
  },
  "Grand Requin Blanc": {
    desc: "Le prédateur ultime.",
    taille: "4 à 6 mètres",
    danger: "🔴 Potentiellement dangereux",
    depth: "0 - 1200m",
    // Celui-ci existe sur ta capture, c'est bon !
    image: require('../assets/images/animals/grand_requin_blanc.png'),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.ATLANTIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.MEDITERRANEE]
  },
  "Requin Pointe Noire": {
    desc: "Petit requin de récif très commun.",
    taille: "1.2 à 1.6 mètres",
    danger: "🟢 Inoffensif",
    depth: "0 - 75m",
    // ⚠️ Vérifie que ce fichier existe
    image: require('../assets/images/animals/requin_pointe_noire.png'),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ROUGE, OCEAN_NAMES.ANDAMAN]
  },
  "Raie Manta": {
    desc: "La géante gracieuse.",
    taille: "3 à 7 mètres (envergure)",
    danger: "🟢 Inoffensif",
    depth: "0 - 1000m",
    // Existe sur ta capture
    image: require('../assets/images/animals/raie_manta.png'),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ATLANTIQUE]
  },
  "Raie Aigle": {
    desc: "Reconnaissable à ses taches blanches.",
    taille: "1 à 3 mètres (envergure)",
    danger: "🟢 Inoffensif",
    depth: "1 - 80m",
    // Existe sur ta capture
    image: require('../assets/images/animals/raie_aigle.png'),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ATLANTIQUE, OCEAN_NAMES.CARAIBES]
  },

  // --- MAMMIFÈRES ---
  "Grand Dauphin": {
    desc: "Le fameux 'Flipper'.",
    taille: "2 à 4 mètres",
    danger: "🟢 Inoffensif",
    depth: "Surface - 30m",
    // Existe sur ta capture
    image: require('../assets/images/animals/grand_dauphin.png'),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ATLANTIQUE, OCEAN_NAMES.MEDITERRANEE, OCEAN_NAMES.ROUGE, OCEAN_NAMES.CARAIBES]
  },
  "Baleine à Bosse": {
    desc: "Célèbre pour ses chants.",
    taille: "12 à 16 mètres",
    danger: "🟢 Inoffensif",
    depth: "Surface - 200m",
    // Existe sur ta capture
    image: require('../assets/images/animals/baleine_a_bosse.png'),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ATLANTIQUE, OCEAN_NAMES.ARCTIQUE]
  },
  "Baleine Bleue": {
    desc: "Le plus gros animal du monde.",
    taille: "24 à 30 mètres",
    danger: "🟢 Inoffensif",
    depth: "Surface - 500m",
    // Existe sur ta capture
    image: require('../assets/images/animals/baleine_bleue.png'),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.ATLANTIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ARCTIQUE]
  },
  "Orque": {
    desc: "Le super-prédateur absolu.",
    taille: "6 à 8 mètres",
    danger: "🟠 Respecter une distance",
    depth: "0 - 1000m",
    // Existe sur ta capture
    image: require('../assets/images/animals/orque.png'),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ATLANTIQUE, OCEAN_NAMES.ARCTIQUE, OCEAN_NAMES.MEDITERRANEE]
  },
  "Dugong": {
    desc: "La 'vache de mer'.",
    taille: "2.5 à 3 mètres",
    danger: "🟢 Inoffensif",
    depth: "1 - 10m",
    // Existe sur ta capture
    image: require('../assets/images/animals/dugong.png'),
    habitats: [OCEAN_NAMES.INDIEN, OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.ROUGE]
  },
  "Lamantin": {
    desc: "Cousin du Dugong à queue ronde.",
    taille: "3 à 4 mètres",
    danger: "🟢 Inoffensif",
    depth: "1 - 5m",
    // Existe sur ta capture
    image: require('../assets/images/animals/lamantin.png'),
    habitats: [OCEAN_NAMES.ATLANTIQUE, OCEAN_NAMES.CARAIBES, OCEAN_NAMES.GOLFE_MEXIQUE]
  },

  // --- TORTUES ---
  "Tortue Verte": {
    desc: "Herbivore à l'âge adulte.",
    taille: "80 cm à 1.5 m",
    danger: "🟢 Inoffensif",
    depth: "Surface - 20m",
    // ⚠️ Vérifie que ce fichier existe (je ne le vois pas sur la capture)
    image: require('../assets/images/animals/tortue_verte.png'),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ATLANTIQUE, OCEAN_NAMES.CARAIBES, OCEAN_NAMES.MEDITERRANEE]
  },
  "Tortue Imbriquée": {
    desc: "Mange des éponges.",
    taille: "60 à 90 cm",
    danger: "🟢 Inoffensif",
    depth: "1 - 30m",
    // ⚠️ Vérifie que ce fichier existe
    image: require('../assets/images/animals/tortue_imbriquee.png'),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ATLANTIQUE, OCEAN_NAMES.CARAIBES, OCEAN_NAMES.ROUGE]
  },

  // --- POISSONS ---
  "Poisson Clown": {
    desc: "Vit dans les anémones.",
    taille: "7 à 15 cm",
    danger: "🟢 Inoffensif",
    depth: "1 - 15m",
    // Existe sur ta capture
    image: require('../assets/images/animals/poisson_clown.png'),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ROUGE, OCEAN_NAMES.ANDAMAN]
  },
  "Barracuda": {
    desc: "Chasseur argenté rapide.",
    taille: "50 cm à 1.8 m",
    danger: "🟠 Morsure possible",
    depth: "0 - 100m",
    // Existe sur ta capture
    image: require('../assets/images/animals/barracuda.png'),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ATLANTIQUE, OCEAN_NAMES.CARAIBES, OCEAN_NAMES.MEDITERRANEE]
  },
  "Murène": {
    desc: "Vit cachée dans les trous.",
    taille: "1 à 2.5 mètres",
    danger: "🟠 Morsure douloureuse",
    depth: "0 - 50m",
    // Existe sur ta capture
    image: require('../assets/images/animals/murene.png'),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ATLANTIQUE, OCEAN_NAMES.CARAIBES, OCEAN_NAMES.MEDITERRANEE, OCEAN_NAMES.ROUGE]
  },
  "Anguille": {
    desc: "Poisson serpentiforme.",
    taille: "1 à 1.5 mètre",
    danger: "🟢 Inoffensif",
    depth: "0 - 600m",
    // Existe sur ta capture
    image: require('../assets/images/animals/anguille.png'),
    habitats: [OCEAN_NAMES.ATLANTIQUE, OCEAN_NAMES.MEDITERRANEE]
  },
  "Poisson Lion": {
    desc: "Envahissant et venimeux.",
    taille: "30 à 45 cm",
    danger: "🔴 Venimeux",
    depth: "1 - 50m",
    // ⚠️ CORRECTION : Sur ta capture, le fichier a un TIRET (poisson-lion.png)
    // Mais ici je mets un UNDERSCORE pour être cohérent. RENOMME ton fichier ou change cette ligne !
    image: require('../assets/images/animals/poisson_lion.png'), 
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ROUGE, OCEAN_NAMES.CARAIBES]
  },
  "Napoléon": {
    desc: "Enorme poisson à bosse.",
    taille: "1 à 2.3 mètres",
    danger: "🟢 Inoffensif",
    depth: "1 - 60m",
    // Existe sur ta capture
    image: require('../assets/images/animals/napoleon.png'),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ROUGE]
  },

  // --- INSOLITE ---
  "Hippocampe": {
    desc: "Le mâle porte les œufs.",
    taille: "2 à 15 cm",
    danger: "🟢 Inoffensif",
    depth: "1 - 30m",
    // Existe sur ta capture
    image: require('../assets/images/animals/hippocampe.png'),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ATLANTIQUE, OCEAN_NAMES.MEDITERRANEE]
  },
  "Pieuvre": {
    desc: "Invertébré intelligent.",
    taille: "Variable",
    danger: "🟢 Inoffensif",
    depth: "0 - 200m",
    // Existe sur ta capture
    image: require('../assets/images/animals/pieuvre.png'),
    habitats: [OCEAN_NAMES.PACIFIQUE, OCEAN_NAMES.INDIEN, OCEAN_NAMES.ATLANTIQUE, OCEAN_NAMES.MEDITERRANEE]
  }
};

export const SPECIES_LIST = [
  ...Object.keys(ENCYCLOPEDIA_DATA),
  "Thon", "Espadon", "Mérou", "Poisson Perroquet", "Seiche", "Calamar", "Requin Renard", "Requin Nourrice"
];

// --- 2. GÉOGRAPHIE ---
export const GEOGRAPHY_DB: Record<string, string[]> = {
  "France": ["Atlantique", "Méditerranée"],
  "Espagne": ["Atlantique", "Méditerranée"],
  "Maldives": ["Océan Indien"],
  "Indonésie": ["Océan Indien", "Pacifique"],
  "Australie": ["Pacifique", "Océan Indien"],
  "Égypte": ["Mer Rouge"],
  "Mexique": ["Pacifique", "Caraïbes"],
  "Thaïlande": ["Mer d'Andaman", "Golfe de Thaïlande"],
  "USA": ["Atlantique", "Pacifique", "Golfe du Mexique"],
  "Japon": ["Pacifique"],
  "Brésil": ["Atlantique"],
  "Canada": ["Atlantique", "Pacifique", "Arctique"],
  "La Réunion": ["Océan Indien"],
  "Costa Rica": ["Pacifique", "Caraïbes"],
  "Polynésie Française": ["Pacifique"],
  "Afrique du Sud": ["Atlantique", "Océan Indien"],
  "Maurice": ["Océan Indien"],
  "Seychelles": ["Océan Indien"],
  "Colombie": ["Pacifique", "Caraïbes"],
  "Philippines": ["Pacifique", "Mer de Chine"],
  "Italie": ["Méditerranée"],
  "Grèce": ["Méditerranée"],
  "Guadeloupe": ["Caraïbes"],
  "Martinique": ["Caraïbes"]
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
  // NOUVEAU : Coordonnées GPS exactes
  latitude?: number;
  longitude?: number;
}

export interface Animal {
  id: string;
  name: string;
  image: any; 
  discovered: boolean;
  description: string;
  size: string;
  depth: string;
  danger?: string;
  habitats?: string[];
}

export const initialAnimals: Animal[] = Object.keys(ENCYCLOPEDIA_DATA).map((key, index) => {
    const data = ENCYCLOPEDIA_DATA[key];
    return {
        id: String(index + 1),
        name: key,
        image: data.image,
        discovered: false,
        description: data.desc,
        size: data.taille,
        depth: data.depth,
        danger: data.danger,
        habitats: data.habitats
    };
});
// --- 1.5 COORDONNÉES PRÉCISES PAR OCÉAN (Liste Étendue ~85 Destinations) ---
export const COUNTRY_COORDINATES: Record<string, Record<string, { latitude: number; longitude: number }>> = {
  // --- EUROPE ---
  "France": {
    [OCEAN_NAMES.ATLANTIQUE]: { latitude: 47.5, longitude: -3.0 }, // Bretagne
    [OCEAN_NAMES.MEDITERRANEE]: { latitude: 43.0, longitude: 6.2 }, // Port-Cros
    "Manche": { latitude: 49.5, longitude: -1.5 }
  },
  "Espagne": {
    [OCEAN_NAMES.ATLANTIQUE]: { latitude: 43.0, longitude: -9.0 }, // Galice
    [OCEAN_NAMES.MEDITERRANEE]: { latitude: 39.5, longitude: 2.8 }, // Majorque
    "Canaries": { latitude: 28.0, longitude: -16.5 } // Tenerife (Tech. Atlantique mais zone distincte)
  },
  "Italie": {
    [OCEAN_NAMES.MEDITERRANEE]: { latitude: 41.2, longitude: 9.8 }, // Sardaigne/Elbe
    "Adriatique": { latitude: 42.0, longitude: 15.0 }
  },
  "Portugal": {
    [OCEAN_NAMES.ATLANTIQUE]: { latitude: 37.0, longitude: -8.9 }, // Algarve
    "Açores": { latitude: 37.7, longitude: -25.6 },
    "Madère": { latitude: 32.6, longitude: -16.9 }
  },
  "Grèce": { [OCEAN_NAMES.MEDITERRANEE]: { latitude: 36.8, longitude: 25.0 } }, // Cyclades
  "Croatie": { [OCEAN_NAMES.MEDITERRANEE]: { latitude: 43.5, longitude: 16.0 } },
  "Malte": { [OCEAN_NAMES.MEDITERRANEE]: { latitude: 35.9, longitude: 14.4 } },
  "Chypre": { [OCEAN_NAMES.MEDITERRANEE]: { latitude: 34.9, longitude: 33.6 } },
  "Royaume-Uni": {
    [OCEAN_NAMES.ATLANTIQUE]: { latitude: 50.1, longitude: -5.5 }, // Cornouailles
    "Mer du Nord": { latitude: 58.9, longitude: -3.0 } // Scapa Flow
  },
  "Irlande": { [OCEAN_NAMES.ATLANTIQUE]: { latitude: 52.0, longitude: -10.5 } },
  "Norvège": {
    [OCEAN_NAMES.ATLANTIQUE]: { latitude: 60.3, longitude: 5.3 },
    [OCEAN_NAMES.ARCTIQUE]: { latitude: 69.6, longitude: 18.9 } // Tromsø (Orques)
  },
  "Islande": { [OCEAN_NAMES.ATLANTIQUE]: { latitude: 64.1, longitude: -21.9 } }, // Silfra
  "Turquie": {
    [OCEAN_NAMES.MEDITERRANEE]: { latitude: 36.2, longitude: 29.6 }, // Kas
    "Mer Égée": { latitude: 37.0, longitude: 27.4 } // Bodrum
  },
  "Monténégro": { [OCEAN_NAMES.MEDITERRANEE]: { latitude: 42.4, longitude: 18.6 } }, // Baie de Kotor
  "Albanie": { [OCEAN_NAMES.MEDITERRANEE]: { latitude: 40.1, longitude: 19.7 } }, // Saranda (Ionian)
  "Monaco": { [OCEAN_NAMES.MEDITERRANEE]: { latitude: 43.7, longitude: 7.4 } },
  "Suède": { "Mer Baltique": { latitude: 59.0, longitude: 18.5 } }, // Épaves froide
  "Danemark": { "Mer du Nord": { latitude: 56.0, longitude: 8.0 } },
  // --- AFRIQUE & MOYEN-ORIENT ---
  "Maroc": {
    [OCEAN_NAMES.MEDITERRANEE]: { latitude: 35.8, longitude: -5.5 },
    [OCEAN_NAMES.ATLANTIQUE]: { latitude: 30.4, longitude: -9.6 } // Agadir
  },
  "Sao Tomé-et-Principe": { [OCEAN_NAMES.ATLANTIQUE]: { latitude: 0.3, longitude: 6.7 } },
  "Ghana": { [OCEAN_NAMES.ATLANTIQUE]: { latitude: 5.5, longitude: 0.0 } },
  "Égypte": {
    [OCEAN_NAMES.ROUGE]: { latitude: 27.2, longitude: 33.8 }, // Hurghada/Marsa Alam
    [OCEAN_NAMES.MEDITERRANEE]: { latitude: 31.2, longitude: 29.9 }
  },
  "Soudan": { [OCEAN_NAMES.ROUGE]: { latitude: 19.6, longitude: 37.2 } },
  "Djibouti": { [OCEAN_NAMES.ROUGE]: { latitude: 11.6, longitude: 42.8 } }, // Requins Baleines
  "Oman": { [OCEAN_NAMES.INDIEN]: { latitude: 23.5, longitude: 58.5 } },
  "Jordanie": { [OCEAN_NAMES.ROUGE]: { latitude: 29.5, longitude: 34.9 } }, // Aqaba
  "Afrique du Sud": {
    [OCEAN_NAMES.ATLANTIQUE]: { latitude: -34.1, longitude: 18.4 }, // Cape Town
    [OCEAN_NAMES.INDIEN]: { latitude: -30.0, longitude: 31.0 } // Aliwal Shoal/Durban
  },
  "Mozambique": { [OCEAN_NAMES.INDIEN]: { latitude: -23.8, longitude: 35.5 } }, // Tofo
  "Tanzanie": { [OCEAN_NAMES.INDIEN]: { latitude: -6.1, longitude: 39.2 } }, // Zanzibar
  "Kenya": { [OCEAN_NAMES.INDIEN]: { latitude: -4.0, longitude: 39.7 } },
  "Madagascar": { [OCEAN_NAMES.INDIEN]: { latitude: -13.3, longitude: 48.2 } }, // Nosy Be
  "Maurice": { [OCEAN_NAMES.INDIEN]: { latitude: -20.3, longitude: 57.5 } },
  "Seychelles": { [OCEAN_NAMES.INDIEN]: { latitude: -4.6, longitude: 55.5 } },
  "Cap-Vert": { [OCEAN_NAMES.ATLANTIQUE]: { latitude: 16.6, longitude: -22.9 } },
  "Sénégal": { [OCEAN_NAMES.ATLANTIQUE]: { latitude: 14.7, longitude: -17.5 } },
  "Arabie Saoudite": {
    [OCEAN_NAMES.ROUGE]: { latitude: 22.5, longitude: 38.9 }, // Jeddah/Farasan Banks
    "Golfe Persique": { latitude: 26.5, longitude: 50.5 }
  },
  "Israël": {
    [OCEAN_NAMES.ROUGE]: { latitude: 29.5, longitude: 34.9 }, // Eilat
    [OCEAN_NAMES.MEDITERRANEE]: { latitude: 32.5, longitude: 34.8 }
  },
  "Émirats Arabes Unis": {
    [OCEAN_NAMES.INDIEN]: { latitude: 25.5, longitude: 56.4 }, // Fujairah (Golfe d'Oman)
    "Golfe Persique": { latitude: 25.0, longitude: 54.0 }
  },
  "Qatar": { "Golfe Persique": { latitude: 25.3, longitude: 51.5 } },
  // --- ASIE ---
  "Indonésie": {
    [OCEAN_NAMES.INDIEN]: { latitude: -8.7, longitude: 115.5 }, // Bali/Nusa Penida
    [OCEAN_NAMES.PACIFIQUE]: { latitude: -0.5, longitude: 130.5 }, // Raja Ampat
    "Mer de Java": { latitude: -5.8, longitude: 110.4 } // Karimunjawa
  },
  "Maldives": { [OCEAN_NAMES.INDIEN]: { latitude: 3.5, longitude: 73.0 } },
  "Thaïlande": {
    [OCEAN_NAMES.ANDAMAN]: { latitude: 7.9, longitude: 98.3 }, // Phuket/Similan
    "Golfe de Thaïlande": { latitude: 10.1, longitude: 99.9 } // Koh Tao
  },
  "Philippines": {
    [OCEAN_NAMES.PACIFIQUE]: { latitude: 9.6, longitude: 123.8 }, // Bohol/Visayas
    [OCEAN_NAMES.CHINE]: { latitude: 11.2, longitude: 119.4 } // Palawan
  },
  "Malaisie": {
    [OCEAN_NAMES.PACIFIQUE]: { latitude: 4.2, longitude: 118.6 }, // Sipadan (Bornéo)
    "Mer de Chine": { latitude: 2.8, longitude: 104.1 } // Tioman
  },
  "Japon": {
    [OCEAN_NAMES.PACIFIQUE]: { latitude: 26.2, longitude: 127.7 }, // Okinawa
    "Mer du Japon": { latitude: 35.6, longitude: 135.0 }
  },
  "Vietnam": { [OCEAN_NAMES.CHINE]: { latitude: 12.2, longitude: 109.3 } }, // Nha Trang
  "Sri Lanka": { [OCEAN_NAMES.INDIEN]: { latitude: 6.0, longitude: 80.2 } },
  "Inde": {
    [OCEAN_NAMES.INDIEN]: { latitude: 10.5, longitude: 72.6 }, // Lakshadweep
    [OCEAN_NAMES.ANDAMAN]: { latitude: 11.5, longitude: 92.7 } // Îles Andaman
  },
  "Taïwan": { [OCEAN_NAMES.PACIFIQUE]: { latitude: 22.0, longitude: 120.7 } },
  "Timor oriental": { [OCEAN_NAMES.INDIEN]: { latitude: -8.5, longitude: 125.6 } }, // Atauro Island (Biodiversité record)
  "Myanmar": { [OCEAN_NAMES.ANDAMAN]: { latitude: 12.0, longitude: 98.0 } }, // Mergui Archipelago
  "Cambodge": { "Golfe de Thaïlande": { latitude: 10.5, longitude: 103.5 } }, // Koh Rong
  "Corée du Sud": { [OCEAN_NAMES.PACIFIQUE]: { latitude: 33.3, longitude: 126.5 } }, // Jeju Island
  "Singapour": { "Mer de Chine": { latitude: 1.2, longitude: 103.8 } }, // Pulau Hantu
  // --- OCÉANIE ---
  "Australie": {
    [OCEAN_NAMES.PACIFIQUE]: { latitude: -16.8, longitude: 145.8 }, // Grande Barrière (Cairns)
    [OCEAN_NAMES.INDIEN]: { latitude: -21.9, longitude: 114.1 } // Ningaloo Reef
  },
  "Nouvelle-Zélande": { [OCEAN_NAMES.PACIFIQUE]: { latitude: -35.5, longitude: 174.5 } }, // Poor Knights
  "Polynésie Française": { [OCEAN_NAMES.PACIFIQUE]: { latitude: -16.5, longitude: -151.7 } }, // Bora Bora/Rangiroa
  "Nouvelle-Calédonie": { [OCEAN_NAMES.PACIFIQUE]: { latitude: -22.3, longitude: 166.4 } },
  "Fidji": { [OCEAN_NAMES.PACIFIQUE]: { latitude: -17.7, longitude: 178.0 } },
  "Palau": { [OCEAN_NAMES.PACIFIQUE]: { latitude: 7.3, longitude: 134.5 } },
  "Micronésie": { [OCEAN_NAMES.PACIFIQUE]: { latitude: 7.4, longitude: 151.8 } }, // Truk Lagoon
  "Papouasie-Nouvelle-Guinée": { [OCEAN_NAMES.PACIFIQUE]: { latitude: -9.4, longitude: 147.2 } },
  "Vanuatu": { [OCEAN_NAMES.PACIFIQUE]: { latitude: -17.7, longitude: 168.3 } },
  "Îles Salomon": { [OCEAN_NAMES.PACIFIQUE]: { latitude: -9.0, longitude: 160.0 } }, // Guadalcanal/Wrecks
  "Tonga": { [OCEAN_NAMES.PACIFIQUE]: { latitude: -18.6, longitude: -174.0 } }, // Vava'u (Baleines à bosse)
  "Îles Cook": { [OCEAN_NAMES.PACIFIQUE]: { latitude: -21.2, longitude: -159.8 } }, // Rarotonga
  "Samoa": { [OCEAN_NAMES.PACIFIQUE]: { latitude: -13.8, longitude: -172.0 } },
  "Îles Marshall": { [OCEAN_NAMES.PACIFIQUE]: { latitude: 7.1, longitude: 171.2 } }, // Bikini Atoll (Épaves nucléaires)
  "Kiribati": { [OCEAN_NAMES.PACIFIQUE]: { latitude: 1.9, longitude: -157.4 } }, // Kiritimati
  // --- AMÉRIQUE DU NORD & CARAÏBES ---
  "USA": {
    [OCEAN_NAMES.ATLANTIQUE]: { latitude: 25.0, longitude: -80.4 }, // Florida Keys
    [OCEAN_NAMES.PACIFIQUE]: { latitude: 33.3, longitude: -118.3 }, // Californie/Catalina
    [OCEAN_NAMES.GOLFE_MEXIQUE]: { latitude: 27.8, longitude: -93.0 },
    "Hawaï": { latitude: 20.7, longitude: -156.4 }
  },
  "Canada": {
    [OCEAN_NAMES.ATLANTIQUE]: { latitude: 47.5, longitude: -53.0 }, // Terre-Neuve
    [OCEAN_NAMES.PACIFIQUE]: { latitude: 49.5, longitude: -126.5 }, // Vancouver Island
    [OCEAN_NAMES.ARCTIQUE]: { latitude: 72.0, longitude: -80.0 }
  },
  "Mexique": {
    [OCEAN_NAMES.CARAIBES]: { latitude: 20.5, longitude: -86.9 }, // Cozumel/Cenotes
    [OCEAN_NAMES.PACIFIQUE]: { latitude: 24.1, longitude: -110.3 }, // La Paz/Sea of Cortez
    "Socorro": { latitude: 18.8, longitude: -110.9 } // Revillagigedo
  },
  "Bahamas": { [OCEAN_NAMES.ATLANTIQUE]: { latitude: 24.5, longitude: -76.5 } }, // Exumas
  "Belize": { [OCEAN_NAMES.CARAIBES]: { latitude: 17.5, longitude: -87.5 } }, // Blue Hole
  "Honduras": { [OCEAN_NAMES.CARAIBES]: { latitude: 16.3, longitude: -86.5 } }, // Roatan
  "Costa Rica": {
    [OCEAN_NAMES.PACIFIQUE]: { latitude: 5.5, longitude: -87.0 }, // Île Coco
    [OCEAN_NAMES.CARAIBES]: { latitude: 9.9, longitude: -83.0 }
  },
  "Panama": {
    [OCEAN_NAMES.PACIFIQUE]: { latitude: 7.6, longitude: -81.7 }, // Coiba
    [OCEAN_NAMES.CARAIBES]: { latitude: 9.3, longitude: -82.2 } // Bocas del Toro
  },
  "Cuba": { [OCEAN_NAMES.CARAIBES]: { latitude: 21.6, longitude: -81.5 } }, // Jardines de la Reina
  "République Dominicaine": { [OCEAN_NAMES.CARAIBES]: { latitude: 18.3, longitude: -68.8 } },
  "Guadeloupe": { [OCEAN_NAMES.CARAIBES]: { latitude: 16.1, longitude: -61.8 } }, // Réserve Cousteau
  "Martinique": { [OCEAN_NAMES.CARAIBES]: { latitude: 14.5, longitude: -61.1 } },
  "Saint-Martin": { [OCEAN_NAMES.CARAIBES]: { latitude: 18.0, longitude: -63.0 } },
  "Bonaire": { [OCEAN_NAMES.CARAIBES]: { latitude: 12.1, longitude: -68.3 } },
  "Curaçao": { [OCEAN_NAMES.CARAIBES]: { latitude: 12.2, longitude: -69.0 } },
  "Îles Caïmans": { [OCEAN_NAMES.CARAIBES]: { latitude: 19.3, longitude: -81.4 } },
  "Turques-et-Caïques": { [OCEAN_NAMES.ATLANTIQUE]: { latitude: 21.8, longitude: -72.3 } }, // Grand Turk
  "Bermudes": { [OCEAN_NAMES.ATLANTIQUE]: { latitude: 32.3, longitude: -64.8 } }, // Épaves
  "Aruba": { [OCEAN_NAMES.CARAIBES]: { latitude: 12.5, longitude: -70.0 } },
  "Dominique": { [OCEAN_NAMES.CARAIBES]: { latitude: 15.4, longitude: -61.4 } }, // Cachalots
  "Sainte-Lucie": { [OCEAN_NAMES.CARAIBES]: { latitude: 13.9, longitude: -61.0 } },
  "Barbade": { [OCEAN_NAMES.ATLANTIQUE]: { latitude: 13.2, longitude: -59.6 } },
  "Grenade": { [OCEAN_NAMES.CARAIBES]: { latitude: 12.0, longitude: -61.7 } }, // Sculpture Park
  "Îles Vierges britanniques": { [OCEAN_NAMES.CARAIBES]: { latitude: 18.4, longitude: -64.6 } },
  "Îles Vierges des États-Unis": { [OCEAN_NAMES.CARAIBES]: { latitude: 18.3, longitude: -64.8 } },
  "Saint-Kitts-et-Nevis": { [OCEAN_NAMES.CARAIBES]: { latitude: 17.3, longitude: -62.7 } },
  "Antigua-et-Barbuda": { [OCEAN_NAMES.CARAIBES]: { latitude: 17.0, longitude: -61.8 } },
  "Porto Rico": { [OCEAN_NAMES.CARAIBES]: { latitude: 18.2, longitude: -66.4 } },
  // --- AMÉRIQUE DU SUD ---
  "Brésil": {
    [OCEAN_NAMES.ATLANTIQUE]: { latitude: -3.8, longitude: -32.4 }, // Fernando de Noronha
  },
  "Colombie": {
    [OCEAN_NAMES.CARAIBES]: { latitude: 12.5, longitude: -81.7 }, // San Andres/Providencia
    [OCEAN_NAMES.PACIFIQUE]: { latitude: 3.9, longitude: -81.6 } // Malpelo
  },
  "Équateur": {
    [OCEAN_NAMES.PACIFIQUE]: { latitude: -0.8, longitude: -91.0 }, // Galapagos
  },
  "Pérou": { [OCEAN_NAMES.PACIFIQUE]: { latitude: -13.5, longitude: -76.5 } },
  "Chili": { [OCEAN_NAMES.PACIFIQUE]: { latitude: -27.0, longitude: -71.0 } },
  "Venezuela": { [OCEAN_NAMES.CARAIBES]: { latitude: 11.9, longitude: -66.1 } }, // Los Roques
  "Argentine": { [OCEAN_NAMES.ATLANTIQUE]: { latitude: -42.5, longitude: -64.0 } }, // Péninsule Valdés (Orques/Lions de mer)
  "Uruguay": { [OCEAN_NAMES.ATLANTIQUE]: { latitude: -35.0, longitude: -54.9 } }, // Isla de Lobos
  // --- ZONES POLAIRES (Extrême) ---
  "Antarctique": { "Océan Austral": { latitude: -64.8, longitude: -62.6 } }, // Péninsule Antarctique
  "Groenland": { [OCEAN_NAMES.ARCTIQUE]: { latitude: 69.0, longitude: -51.0 } } // Disko Bay
};