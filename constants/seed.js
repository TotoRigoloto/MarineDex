const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

// 1. Tes identifiants Supabase
// Trouve ces infos dans Settings > API
const SUPABASE_URL = "https://giibfmhllophrouifedj.supabase.co";
// ATTENTION : Utilise la "service_role" key (secrète) pour passer outre les règles de sécurité (RLS) lors de l'import
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpaWJmbWhsbG9waHJvdWlmZWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU2NjIxNiwiZXhwIjoyMDkxMTQyMjE2fQ.rN-gv_lzSzyq0SJntTsdeXZr1y1A0hUkly2_mTawJF0";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 2. Lecture de ton fichier JSON
const rawData = fs.readFileSync("./MarineData.json", "utf-8");
const encyclopedia = JSON.parse(rawData);

async function seedDatabase() {
  console.log("🚀 Début de la migration...");

  // 3. Boucle sur chaque animal de ton objet
  for (const [speciesName, data] of Object.entries(encyclopedia)) {
    // Nettoyage du chemin de l'image (extrait juste le nom du fichier)
    // ex: "../assets/images/animals/requin_baleine.png" devient "requin_baleine.png"
    const imageName = data.image.split("/").pop();

    // Fabrication de l'URL publique Supabase
    const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/species-images/${imageName}`;

    // 4. Insertion dans la table app_species
    const { error } = await supabase.from("app_species").insert({
      name: speciesName,
      description: data.desc,
      size: data.taille,
      depth: data.depth,
      danger: data.danger,
      family: data.family,
      rarity: data.rarity,
      habitats: data.habitats, // Supabase gère nativement l'insertion de tableaux JSON vers TEXT[]
      image_url: imageUrl,
    });

    if (error) {
      console.error(
        `❌ Erreur lors de l'insertion de ${speciesName}:`,
        error.message,
      );
    } else {
      console.log(`✅ ${speciesName} migré avec succès !`);
    }
  }

  console.log("🎉 Migration terminée !");
}

seedDatabase();
