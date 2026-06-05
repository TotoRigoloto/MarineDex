// Savais-thon — 100 faits marins pour alimenter la streak au quotidien.
// Un fait par jour, calculé sur le numéro de jour dans l'année.
// Tout le monde voit le même fact le même jour.

export interface FunFact {
  id: number;
  emoji: string;
  fact: string;
}

/** Renvoie la date du jour au format YYYY-MM-DD (clé de stockage). */
export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Renvoie le fact du jour (déterministe, basé sur le numéro de jour dans l'année). */
export function getDailyFact(): FunFact {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return FUN_FACTS[dayOfYear % FUN_FACTS.length];
}

export const FUN_FACTS: FunFact[] = [
  {
    id: 1,
    emoji: "🐙",
    fact: "Le poulpe possède trois cœurs : deux pompent le sang vers les branchies, un troisième vers le reste du corps. Ses bras ont chacun leur propre réseau nerveux et peuvent agir de façon autonome.",
  },
  {
    id: 2,
    emoji: "🐬",
    fact: "Chaque dauphin possède un sifflement unique qui lui sert de prénom. Ses congénères utilisent ce sifflement pour l'appeler nommément.",
  },
  {
    id: 3,
    emoji: "🦈",
    fact: "Le requin baleine (Rhincodon typus) est le plus grand poisson du monde, pouvant atteindre 20 mètres. Pourtant, il se nourrit uniquement de plancton et de krill en filtrant l'eau.",
  },
  {
    id: 4,
    emoji: "🐠",
    fact: "Les poissons-clowns naissent tous mâles. Si la femelle dominante disparaît, le mâle dominant change de sexe pour la remplacer.",
  },
  {
    id: 5,
    emoji: "🪸",
    fact: "Les coraux sont des animaux, pas des plantes. Leurs couleurs vives viennent d'algues microscopiques appelées zooxanthelles qui vivent en symbiose avec eux.",
  },
  {
    id: 6,
    emoji: "🐢",
    fact: "Les tortues marines peuvent rester en apnée jusqu'à 7 heures en état de repos. Leurs poumons se compriment progressivement lors des plongées profondes.",
  },
  {
    id: 7,
    emoji: "🦑",
    fact: "Le calmar colossal (Mesonychoteuthis hamiltoni) possède les plus grands yeux du règne animal — jusqu'à 30 cm de diamètre, soit la taille d'une assiette.",
  },
  {
    id: 8,
    emoji: "🐋",
    fact: "La baleine bleue est l'animal le plus bruyant de la planète avec des appels pouvant atteindre 188 décibels. Ses vocalisations voyagent à des milliers de kilomètres.",
  },
  {
    id: 9,
    emoji: "🦭",
    fact: "L'éléphant de mer du sud peut plonger à 1 500 mètres de profondeur et rester en apnée plus de 2 heures. Il comprime activement ses poumons pour résister à la pression.",
  },
  {
    id: 10,
    emoji: "🐡",
    fact: "Le poisson-globe se gonfle d'eau — et non d'air. Sa peau contient de la tétrodotoxine, l'un des poisons les plus puissants du monde naturel.",
  },
  {
    id: 11,
    emoji: "🪼",
    fact: "Les méduses existent depuis au moins 500 millions d'années — soit 250 millions d'années avant les dinosaures. Elles ont survécu à toutes les extinctions de masse.",
  },
  {
    id: 12,
    emoji: "🦈",
    fact: "Les requins n'ont pas d'os : leur squelette est entièrement constitué de cartilage, plus léger et plus flexible que l'os. C'est pour cela qu'on trouve rarement des fossiles complets.",
  },
  {
    id: 13,
    emoji: "🦀",
    fact: "Les homards ne vieillissent pas biologiquement : leur fertilité et leur taille augmentent avec l'âge. Ils meurent le plus souvent d'épuisement après les mues répétées.",
  },
  {
    id: 14,
    emoji: "🐠",
    fact: "Le poisson perroquet mange des coraux pour en extraire les algues. En digérant le squelette calcaire, il produit du sable blanc — une grande plage tropicale peut ainsi devoir 70% de son sable à ces poissons.",
  },
  {
    id: 15,
    emoji: "🌊",
    fact: "L'océan couvre 71% de la surface de la Terre mais plus de 80% de ses fonds restent encore inexplorés. On en connaît mieux la surface de la Lune.",
  },
  {
    id: 16,
    emoji: "🐬",
    fact: "Les dauphins dorment avec un hémisphère cérébral à la fois (sommeil unihémisphérique). L'autre hémisphère reste éveillé pour respirer et guetter les dangers.",
  },
  {
    id: 17,
    emoji: "🦈",
    fact: "Le requin à cornes pond des œufs en spirale qu'il glisse entre les rochers pour les ancrer. La forme hélicoïdale empêche les prédateurs de les extraire facilement.",
  },
  {
    id: 18,
    emoji: "🐋",
    fact: "Les baleines à bosse composent de nouvelles chansons chaque année. Ces innovations musicales se propagent systématiquement d'ouest en est à travers le Pacifique.",
  },
  {
    id: 19,
    emoji: "🦑",
    fact: "Le poulpe mimique (Thaumoctopus mimicus) peut imiter la forme, la couleur et les mouvements de plus de 15 espèces différentes, dont le lionfish, la raie et le serpent de mer.",
  },
  {
    id: 20,
    emoji: "🐟",
    fact: "Les poissons-volants peuvent planer jusqu'à 400 mètres et atteindre 70 km/h hors de l'eau. Ils utilisent leurs nageoires pectorales comme des ailes.",
  },
  {
    id: 21,
    emoji: "🪸",
    fact: "Les récifs coralliens couvrent moins de 0,1% de l'océan, mais abritent environ 25% de toutes les espèces marines connues.",
  },
  {
    id: 22,
    emoji: "🐢",
    fact: "Les tortues marines reviennent pondre sur la plage exacte où elles sont nées, parfois après 30 ans d'absence. Elles se repèrent au champ magnétique terrestre.",
  },
  {
    id: 23,
    emoji: "🦐",
    fact: "La crevette mante (Odontodactylus scyllarus) possède 16 types de photorécepteurs contre seulement 3 chez l'humain. Elle perçoit les ultraviolets et la polarisation de la lumière.",
  },
  {
    id: 24,
    emoji: "🐙",
    fact: "Les pieuvres ont environ 10 millions de chromatophores dans la peau. Ces cellules pigmentaires leur permettent de changer de couleur et de motif en quelques millisecondes.",
  },
  {
    id: 25,
    emoji: "🌡️",
    fact: "Les eaux des abysses restent autour de 2°C en permanence, même sous les tropiques. Cette eau froide y descend depuis les pôles par convection.",
  },
  {
    id: 26,
    emoji: "🐬",
    fact: "Les bélugas sont surnommés « canaris des mers » : ils peuvent imiter des sons humains, des sifflements complexes et même des bruits de moteur de bateau.",
  },
  {
    id: 27,
    emoji: "🦈",
    fact: "La murène possède des mâchoires pharyngiennes dans la gorge qui avancent pour capturer et déplacer les proies — une mécanique propre aux Aliens et aux moraies.",
  },
  {
    id: 28,
    emoji: "🐋",
    fact: "La baleine boréale peut vivre plus de 200 ans. Des harpons du XIXe siècle ont été retrouvés dans des baleines vivantes pêchées au XXe siècle.",
  },
  {
    id: 29,
    emoji: "🐡",
    fact: "Le poisson-scie utilise son rostre pour détecter des champs électriques faibles et immobiliser ses proies dans le sable ou la vase.",
  },
  {
    id: 30,
    emoji: "🪸",
    fact: "Un récif corallien peut grandir d'environ 1 à 3 cm par an. Le Grand Récif de Corail australien a commencé à se former il y a plus de 20 000 ans.",
  },
  {
    id: 31,
    emoji: "🦀",
    fact: "L'araignée de mer japonaise (Macrocheira kaempferi) peut atteindre 4 mètres d'envergure avec ses pattes étendues — le plus grand arthropode vivant.",
  },
  {
    id: 32,
    emoji: "🐠",
    fact: "Le poisson mandarin est l'un des seuls vertébrés à produire de la couleur bleue directement par pigments biologiques, plutôt que par jeu de lumière ou reflets.",
  },
  {
    id: 33,
    emoji: "🌊",
    fact: "La mer des Sargasses est la seule mer au monde sans côtes : ses frontières sont définies uniquement par quatre courants océaniques qui l'entourent.",
  },
  {
    id: 34,
    emoji: "🦭",
    fact: "Les loutres de mer dorment enroulées dans des algues pour ne pas dériver avec les courants. Elles se tiennent aussi la main en dormant pour ne pas se séparer.",
  },
  {
    id: 35,
    emoji: "🐋",
    fact: "Le narval possède une dent qui peut atteindre 3 mètres de long. Cette « corne de licorne » est en réalité une canine modifiée traversant la lèvre supérieure.",
  },
  {
    id: 36,
    emoji: "🦑",
    fact: "Les calmars du genre Dosidicus peuvent propulser de l'eau par leur siphon pour s'élever jusqu'à 9 mètres hors de l'eau et planer sur 30 mètres.",
  },
  {
    id: 37,
    emoji: "🐟",
    fact: "Le poisson-archer crache un jet d'eau précis pour faire tomber des insectes posés sur des feuilles jusqu'à 3 mètres au-dessus de la surface.",
  },
  {
    id: 38,
    emoji: "🪼",
    fact: "La méduse immortelle (Turritopsis dohrnii) peut inverser son cycle de vie quand elle est stressée, redevenant un polype immature pour recommencer à zéro.",
  },
  {
    id: 39,
    emoji: "🐢",
    fact: "Les tortues luth peuvent peser jusqu'à 900 kg et plonger à 1 200 mètres de profondeur. Leur peau flexible — et non une carapace dure — absorbe la pression.",
  },
  {
    id: 40,
    emoji: "🦈",
    fact: "Le requin taureau peut survivre indéfiniment en eau douce. Il est régulièrement aperçu dans des fleuves comme le Mississippi, l'Amazone et le Gange.",
  },
  {
    id: 41,
    emoji: "🐬",
    fact: "Les dauphins jouent avec des bulles d'air qu'ils créent eux-mêmes sous l'eau : ils les façonnent en anneaux et plongent à travers pour le plaisir.",
  },
  {
    id: 42,
    emoji: "🌊",
    fact: "La dorsale médio-océanique est une chaîne volcanique sous-marine de 65 000 km de long — 4 fois plus longue que la chaîne himalayenne.",
  },
  {
    id: 43,
    emoji: "🦐",
    fact: "Les crevettes alpheidae claquent leurs pinces si vite qu'elles créent une cavitation dont la température locale atteint brièvement 4 700°C — soit presque la surface du Soleil.",
  },
  {
    id: 44,
    emoji: "🐙",
    fact: "Une pieuvre possède 9 cerveaux : 1 central et 8 ganglions dans ses tentacules. Au total, environ 500 millions de neurones — autant qu'un chien.",
  },
  {
    id: 45,
    emoji: "🐟",
    fact: "Les poissons « entendent » les vibrations grâce à une ligne latérale : une rangée d'organes sensoriels qui détectent les variations de pression dans l'eau.",
  },
  {
    id: 46,
    emoji: "🌊",
    fact: "L'eau de mer contient de l'or dissous — environ 20 millions de tonnes au total. Mais à des concentrations si infimes que l'extraction serait impossible.",
  },
  {
    id: 47,
    emoji: "🐋",
    fact: "Les cachalots plongent jusqu'à 2 200 mètres et peuvent retenir leur souffle jusqu'à 90 minutes. Ils chassent les calmars géants dans l'obscurité totale.",
  },
  {
    id: 48,
    emoji: "🦑",
    fact: "Le poulpe bleu tacheté (Hapalochlaena) est l'un des animaux les plus venimeux du monde. Son venin peut tuer 26 humains adultes et il n'existe pas d'antidote.",
  },
  {
    id: 49,
    emoji: "🐟",
    fact: "Le mérou changeant (Epinephelus) peut changer de sexe plusieurs fois dans sa vie, devenant mâle ou femelle selon la hiérarchie sociale du groupe.",
  },
  {
    id: 50,
    emoji: "🌊",
    fact: "Le Gulf Stream transporte 150 fois le débit cumulé de tous les fleuves terrestres de la planète. Sans lui, l'Europe de l'ouest serait 5 à 10°C plus froide.",
  },
  {
    id: 51,
    emoji: "🦈",
    fact: "Le requin mako (Isurus oxyrinchus) peut nager jusqu'à 70 km/h, ce qui en fait le poisson le plus rapide de l'océan. Sa forme est quasi identique à celle d'une torpille.",
  },
  {
    id: 52,
    emoji: "🐬",
    fact: "Des dauphins ont été observés en train de se frotter contre des coraux et des éponges spécifiques. Ces organismes contiennent des composés antibactériens et antifongiques.",
  },
  {
    id: 53,
    emoji: "🐢",
    fact: "Contrairement aux tortues terrestres, les tortues marines ne peuvent pas rétracter leur tête dans leur carapace. Elles compensent avec une nage rapide.",
  },
  {
    id: 54,
    emoji: "🦭",
    fact: "Les éléphants de mer mâles peuvent peser jusqu'à 2,5 tonnes et contrôler un harem d'une vingtaine de femelles. Ils se battent violemment pour défendre ce territoire.",
  },
  {
    id: 55,
    emoji: "🪼",
    fact: "Une prolifération de méduses s'appelle une « bloom » ou « smack ». En eau surchauffée, elles se multiplient exponentiellement et peuvent obstruer les circuits de refroidissement des centrales.",
  },
  {
    id: 56,
    emoji: "🐠",
    fact: "Le poisson-lion n'est pas venimeux mais possède des épines qui injectent activement du venin. La différence entre venimeux (injection) et toxique (contact) est essentielle en biologie marine.",
  },
  {
    id: 57,
    emoji: "🌊",
    fact: "Les vagues ne déplacent pas l'eau horizontalement : elles transportent de l'énergie. Les molécules d'eau décrivent des cercles sur place, comme la main qui secoue une corde.",
  },
  {
    id: 58,
    emoji: "🦀",
    fact: "Le crabe violoniste possède une pince 50 fois plus lourde que l'autre. Il l'agite pour séduire les femelles et la brandit pour intimider les rivaux.",
  },
  {
    id: 59,
    emoji: "🐙",
    fact: "Les pieuvres en captivité s'évadent régulièrement en dévissant des couvercles, en ouvrant des loquets et en parcourant jusqu'à 10 mètres hors de l'eau.",
  },
  {
    id: 60,
    emoji: "🐋",
    fact: "Les orques sont en réalité des dauphins géants, pas des baleines. Leur nom anglais « killer whale » vient d'une mauvaise traduction espagnole : « ballena asesina ».",
  },
  {
    id: 61,
    emoji: "🦑",
    fact: "Certaines seiches communiquent en créant des ondes de motifs sur leur peau — ces signaux ne sont visibles que via la polarisation de la lumière, invisible à l'œil humain.",
  },
  {
    id: 62,
    emoji: "🐟",
    fact: "Les poissons-clowns sont immunisés contre le venin des anémones grâce à une couche de mucus particulière. Ils renforcent cette immunité en se frottant progressivement aux tentacules.",
  },
  {
    id: 63,
    emoji: "🪸",
    fact: "Certains coraux du genre Porites peuvent vivre plus de 1 000 ans. Ils enregistrent dans leur squelette calcaire les conditions climatiques passées, comme les cernes d'un arbre.",
  },
  {
    id: 64,
    emoji: "🐢",
    fact: "La température du sable détermine le sexe des bébés tortues marines : un sable chaud donne des femelles, un sable frais donne des mâles. Le réchauffement climatique perturbe cet équilibre.",
  },
  {
    id: 65,
    emoji: "🦈",
    fact: "Les requins détectent les champs électriques faibles grâce aux ampoules de Lorenzini — des organes sensoriels invisibles à l'œil nu répartis sur leur museau.",
  },
  {
    id: 66,
    emoji: "🐬",
    fact: "L'écholocalisation des dauphins est si précise qu'ils peuvent détecter une bille de métal de 2,5 cm à 70 mètres de distance dans l'obscurité totale.",
  },
  {
    id: 67,
    emoji: "🌊",
    fact: "La fosse des Mariannes atteint 11 034 mètres de profondeur. On pourrait y planter l'Everest (8 849 m) et il resterait encore plus de 2 km d'eau au-dessus.",
  },
  {
    id: 68,
    emoji: "🦭",
    fact: "Les manchots empereurs plongent jusqu'à 565 mètres de profondeur et résistent à la pression grâce à leurs poumons extrêmement flexibles et à leurs os plus denses.",
  },
  {
    id: 69,
    emoji: "🐡",
    fact: "Le poisson-lune (Mola mola) peut peser jusqu'à 2,3 tonnes et mesurer 3 mètres. C'est le téléostéen (poisson à arêtes) le plus lourd du monde.",
  },
  {
    id: 70,
    emoji: "🪼",
    fact: "Les cuboméduses (méduses-boîte) sont les cnidaires les plus venimeux. Le venin d'une seule Chironex fleckeri suffit à tuer 60 adultes en moins de 3 minutes.",
  },
  {
    id: 71,
    emoji: "🐠",
    fact: "Les poissons des abysses produisent leur propre lumière par bioluminescence. Environ 90% des animaux vivant à plus de 200 mètres de profondeur en produisent.",
  },
  {
    id: 72,
    emoji: "🦐",
    fact: "Le zooplancton effectue chaque nuit la plus grande migration de la planète : il monte de 400 mètres de profondeur vers la surface pour se nourrir, puis redescend au lever du jour.",
  },
  {
    id: 73,
    emoji: "🐙",
    fact: "Une pieuvre stressée peut abandonner ses propres bras (autotomie). Les bras sectionnés continuent à se tortiller plusieurs minutes pour distraire le prédateur.",
  },
  {
    id: 74,
    emoji: "🐋",
    fact: "Les baleines à fanons filtrent jusqu'à 6 tonnes de krill par jour. Leurs fanons en kératine agissent comme des tamis géants pour retenir leurs proies microscopiques.",
  },
  {
    id: 75,
    emoji: "🦈",
    fact: "Les requins existent depuis 450 millions d'années. Ils ont survécu aux cinq grandes extinctions de masse, dont celle qui a anéanti les dinosaures.",
  },
  {
    id: 76,
    emoji: "🌊",
    fact: "L'océan absorbe environ 30% du CO₂ atmosphérique produit par les humains. Sans lui, la concentration en CO₂ et le réchauffement seraient bien plus rapides.",
  },
  {
    id: 77,
    emoji: "🐢",
    fact: "Lors des Arribadas, des centaines de milliers de tortues olivâtres viennent pondre simultanément sur la même plage sur quelques jours — une des plus grandes migrations animales au monde.",
  },
  {
    id: 78,
    emoji: "🦑",
    fact: "Le calmar géant (Architeuthis dux) peut atteindre 13 mètres de long. Les premières photos d'un calmar géant vivant dans son habitat naturel n'ont été prises qu'en 2004.",
  },
  {
    id: 79,
    emoji: "🐟",
    fact: "Le requin nourrice (Ginglymostoma cirratum) peut rester immobile sur le fond et pomper l'eau à travers ses branchies — une capacité rare chez les requins.",
  },
  {
    id: 80,
    emoji: "🪸",
    fact: "Les poissons-perroquets sécrètent une bulle de mucus autour d'eux la nuit. Cette « couette » masque leur odeur et les protège des prédateurs nocturnes comme les murènes.",
  },
  {
    id: 81,
    emoji: "🐬",
    fact: "Les dauphins roses de l'Amazone (boto) ont un cerveau proportionnellement plus grand que celui de l'humain. Ils peuvent tourner la tête à 90° grâce à leurs cervicales non soudées.",
  },
  {
    id: 82,
    emoji: "🦭",
    fact: "Les loutres de mer ont environ un million de poils par cm² — la fourrure la plus dense de tout le règne animal. Cette fourrure piège l'air pour les isoler de l'eau glacée.",
  },
  {
    id: 83,
    emoji: "🐡",
    fact: "Le poisson-coffre (Ostracion) produit une toxine cutanée appelée ostracitoxine. Dans un aquarium fermé, il peut s'empoisonner lui-même si il est très stressé.",
  },
  {
    id: 84,
    emoji: "🌊",
    fact: "La cascade sous-marine du détroit du Danemark est 3 fois plus haute que le plus grand saut de l'Angel Falls et transporte un débit 2 000 fois supérieur au Niagara.",
  },
  {
    id: 85,
    emoji: "🦀",
    fact: "Quand un bernard-l'ermite trouve une coquille plus grande, il lance une véritable « chaîne » : d'autres hermites arrivent et s'échangent des coquilles dans l'ordre croissant de taille.",
  },
  {
    id: 86,
    emoji: "🐙",
    fact: "Les pieuvres rêvent probablement : leur peau change de couleur de façon dynamique et répétitive pendant le sommeil, reproduisant apparemment des séquences vécues.",
  },
  {
    id: 87,
    emoji: "🐋",
    fact: "Les chants des baleines boréales voyagent si loin sous l'eau qu'elles peuvent potentiellement communiquer à travers tout l'océan Arctique.",
  },
  {
    id: 88,
    emoji: "🦑",
    fact: "La seiche peut passer d'un motif de camouflage parfait à un flash hypnotique de rayures en quelques dixièmes de secondes. Ce flash paralyse momentanément les proies.",
  },
  {
    id: 89,
    emoji: "🐢",
    fact: "Des tortues marines baguées dans les années 1950 ont été retrouvées vivantes dans les années 2000, démontrant que certaines espèces peuvent dépasser les 80 ans.",
  },
  {
    id: 90,
    emoji: "🦈",
    fact: "Le requin marteau utilise sa tête en forme de T (céphalofoil) comme un aile de portance pour tourner rapidement et comme capteur électromagnétique hyper-sensible.",
  },
  {
    id: 91,
    emoji: "🐬",
    fact: "Les dauphins pratiquent le jeu même à l'âge adulte — un comportement rare dans le règne animal, associé à une vie sociale complexe et à une intelligence élevée.",
  },
  {
    id: 92,
    emoji: "🌊",
    fact: "Le phytoplancton produit environ 50% de l'oxygène de l'atmosphère terrestre. Les forêts produisent l'autre moitié. La mer nous fait littéralement respirer.",
  },
  {
    id: 93,
    emoji: "🪼",
    fact: "La caravelle portugaise (Physalia physalis) n'est pas une méduse mais un siphonophore : une colonie de milliers d'individus spécialisés vivant comme un seul organisme.",
  },
  {
    id: 94,
    emoji: "🐠",
    fact: "Les labres nettoyeurs tiennent de véritables « stations de nettoyage » où les grands poissons, même les prédateurs, font la queue pour se faire déparasiter.",
  },
  {
    id: 95,
    emoji: "🦭",
    fact: "Le phoque moine de Méditerranée est l'un des mammifères marins les plus menacés d'Europe. Il subsiste moins de 700 individus répartis sur quelques îles isolées.",
  },
  {
    id: 96,
    emoji: "🐟",
    fact: "L'uranoscope enterre tout son corps dans le sable, yeux et bouche seuls à l'air. Il produit aussi des décharges électriques pour désorientem ses proies.",
  },
  {
    id: 97,
    emoji: "🌊",
    fact: "La pression à 11 000 mètres de profondeur est de 1 100 bars — soit l'équivalent de 50 gros avions posés sur un ongle de pouce.",
  },
  {
    id: 98,
    emoji: "🦀",
    fact: "Certains crabes décorent activement leur carapace avec des éponges, des coraux et des anémones. Ces ornements camouflent le crabe et font fuir les prédateurs.",
  },
  {
    id: 99,
    emoji: "🐋",
    fact: "Les bébés baleines bleues grossissent de 90 kg par jour pendant leurs 6 premiers mois, en buvant jusqu'à 200 litres de lait maternel par jour. C'est la croissance la plus rapide du règne animal.",
  },
  {
    id: 100,
    emoji: "🌊",
    fact: "Protéger 30% des océans d'ici 2030 (objectif mondial « 30x30 ») permettrait de restaurer des stocks de poissons, de stocker du carbone et de préserver des milliers d'espèces encore inconnues.",
  },
];
