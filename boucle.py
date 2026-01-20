import json
import os
from datetime import datetime

FICHIER_SAUVEGARDE = "mon_pokedex.json"

# --- 1. ENCYCLOPÉDIE ---
ENCYCLOPEDIE = {
    "Requin Baleine": {
        "desc": "Le plus grand poisson du monde. Totalement inoffensif, il se nourrit de plancton.",
        "taille": "10 à 18 mètres",
        "danger": "🟢 Inoffensif"
    },
    "Requin Tigre": {
        "desc": "Un prédateur curieux avec des rayures verticales. Mange un peu de tout.",
        "taille": "3 à 5 mètres",
        "danger": "🔴 Potentiellement dangereux"
    },
    "Requin Marteau": {
        "desc": "Reconnaissable à sa tête en forme de T. Souvent vu en bancs.",
        "taille": "3 à 6 mètres",
        "danger": "🟠 Respecter une distance"
    },
    "Grand Requin Blanc": {
        "desc": "Le super-prédateur des océans. Très puissant.",
        "taille": "4 à 6 mètres",
        "danger": "🔴 Potentiellement dangereux"
    },
    "Raie Manta": {
        "desc": "La géante gracieuse. Elle 'vole' sous l'eau.",
        "taille": "3 à 7 mètres d'envergure",
        "danger": "🟢 Inoffensif"
    },
    "Tortue Verte": {
        "desc": "Une tortue marine herbivore qu'on croise souvent près des côtes.",
        "taille": "80 cm à 1.5 m",
        "danger": "🟢 Inoffensif"
    },
    "Poisson Clown": {
        "desc": "Vit en symbiose avec les anémones. Popularisé par Nemo.",
        "taille": "10 cm",
        "danger": "🟢 Inoffensif"
    },
}

LISTE_SUGGESTIONS = list(ENCYCLOPEDIE.keys()) + [
    "Dauphin", "Baleine à Bosse", "Orque", "Barracuda", "Murène"
]

# --- 2. GÉOGRAPHIE ---
BDD_GEOGRAPHIQUE = {
    "France": ["Atlantique", "Méditerranée"],
    "Espagne": ["Atlantique", "Méditerranée"],
    "Maldives": ["Océan Indien"],
    "Indonésie": ["Océan Indien", "Pacifique"],
    "Australie": ["Pacifique", "Océan Indien"],
    "Égypte": ["Mer Rouge"],
    "Mexique": ["Pacifique", "Caraïbes"],
    "Thaïlande": ["Mer d'Andaman", "Golfe de Thaïlande"],
    "USA": ["Atlantique", "Pacifique", "Golfe du Mexique"]
}

def charger_donnees():
    if os.path.exists(FICHIER_SAUVEGARDE):
        try:
            with open(FICHIER_SAUVEGARDE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []
    return []

def sauvegarder_donnees(liste_observations):
    donnees_existantes = charger_donnees()
    donnees_existantes.extend(liste_observations)
    with open(FICHIER_SAUVEGARDE, 'w', encoding='utf-8') as f:
        json.dump(donnees_existantes, f, indent=4, ensure_ascii=False)

def voir_pokedex():
    observations = charger_donnees()
    print("\n" + "="*40)
    print("      📖 MON POKEDEX MARINE")
    print("="*40)
    
    if not observations:
        print("Pokedex vide. Allez plonger !")
        return

    pokedex_groupe = {}
    for obs in observations:
        nom = obs['nom_espece']
        if nom not in pokedex_groupe:
            pokedex_groupe[nom] = []
        pokedex_groupe[nom].append(obs)

    compteur_especes = 1
    for espece, liste_obs in pokedex_groupe.items():
        print(f"\n{compteur_especes}. [ {espece.upper()} ]")
        
        if espece in ENCYCLOPEDIE:
            info = ENCYCLOPEDIE[espece]
            print(f"   ℹ️  Info : {info['desc']}")
            print(f"   📏 Taille : {info['taille']}")
            print(f"   ⚠️  Statut : {info['danger']}")
        else:
            print("   ℹ️  (Données encyclopédiques non disponibles)")

        print(f"   👀 Vu {len(liste_obs)} fois :")
        for obs in liste_obs:
            pays = obs.get('pays', 'Inconnu')
            ocean = obs.get('ocean', 'Inconnu')
            print(f"      - Le {obs['date']} à {pays} ({ocean})")
            if obs['notes'] != "R.A.S.":
                print(f"        Note : {obs['notes']}")
        
        print("_" * 40)
        compteur_especes += 1
        
    input("\nAppuyez sur Entrée pour revenir au menu...")

def trouver_suggestion(saisie, liste_reference):
    saisie_clean = saisie.lower()
    matches = []
    for element in liste_reference:
        if element.lower().startswith(saisie_clean) or saisie_clean in element.lower():
            matches.append(element)
    return matches

def ajouter_observations():
    nouvelles_observations = [] 
    date_aujourdhui = datetime.now().strftime("%d/%m/%Y")
    
    print("\n--- 📝 JOURNAL DE BORD ---")
    print("Tapez 'fin' pour arrêter.")

    while True:
        # ==================== 1. ESPÈCE ====================
        espece_finale = ""
        stop_boucle = False

        while True:
            saisie = input("\nEspèce vue (début du nom ou nom complet) : ").strip()
            if saisie.lower() == 'fin': 
                stop_boucle = True
                break 

            # A. AUTO-VALIDATION (Ignore la casse)
            match_exact = False
            for nom_ref in LISTE_SUGGESTIONS:
                if saisie.lower() == nom_ref.lower():
                    espece_finale = nom_ref
                    print(f"   ✓ Espèce identifiée : {espece_finale}")
                    match_exact = True
                    break
            
            if match_exact: break

            # B. SUGGESTIONS
            suggestions = trouver_suggestion(saisie, LISTE_SUGGESTIONS)
            if len(suggestions) == 1:
                choix = input(f"   -> Voulez-vous dire '{suggestions[0]}' ? (o/n) : ")
                if choix.lower() == 'o' or choix == '':
                    espece_finale = suggestions[0]; break
            elif len(suggestions) > 1:
                print(f"   Choix possibles : {', '.join(suggestions)}")
            else:
                conf = input(f"   -> Espèce inconnue '{saisie}'. Ajouter quand même ? (o/n) : ")
                if conf.lower() == 'o':
                    espece_finale = saisie.capitalize(); break
        
        if stop_boucle: break

        # ==================== 2. LIEU ====================
        pays_final = ""
        ocean_final = ""
        while True:
            saisie_lieu = input(f"Pays ({espece_finale}) : ").strip()
            if saisie_lieu.lower() == 'fin': 
                stop_boucle = True
                break

            # A. AUTO-VALIDATION PAYS (Nouveau ! Comme pour les espèces)
            match_pays = False
            for nom_pays in BDD_GEOGRAPHIQUE:
                if saisie_lieu.lower() == nom_pays.lower():
                    pays_final = nom_pays
                    print(f"   ✓ Pays identifié : {pays_final}")
                    match_pays = True
                    break
            
            # Si pas de match exact, on cherche une suggestion
            if not match_pays:
                suggestions_pays = trouver_suggestion(saisie_lieu, list(BDD_GEOGRAPHIQUE.keys()))
                if suggestions_pays:
                    pays_trouve = suggestions_pays[0]
                    choix = input(f"   -> Voulez-vous dire '{pays_trouve}' ? (o/n) : ")
                    if choix.lower() == 'o' or choix == '':
                        pays_final = pays_trouve
                        match_pays = True
                else:
                    print("   ⚠️ Pays inconnu. Réessayez.")
            
            # Si on a trouvé le pays (via auto-valid ou suggestion), on gère l'Océan
            if match_pays:
                oceans = BDD_GEOGRAPHIQUE[pays_final]
                if len(oceans) == 1:
                    ocean_final = oceans[0]
                else:
                    print(f"   🌊 Zones possibles : {', '.join(oceans)}")
                    while True:
                        c = input("   Tapez 1 pour le premier, 2 pour le deuxième : ")
                        if c == "1": ocean_final = oceans[0]; break
                        if c == "2": ocean_final = oceans[1]; break
                break # On a le pays et l'océan, on sort

        if stop_boucle: break

        # ==================== 3. DETAILS ====================
        date_obs = input(f"Date (Entrée pour {date_aujourdhui}) : ").strip()
        if not date_obs: date_obs = date_aujourdhui
        
        details = input("Notes : ").strip()
        if not details: details = "R.A.S."

        nouvelles_observations.append({
            "nom_espece": espece_finale,
            "pays": pays_final,
            "ocean": ocean_final,
            "date": date_obs,
            "notes": details
        })
        print("--> Ajouté au carnet !")

    # ==================== SAUVEGARDE ====================
    if nouvelles_observations:
        sauvegarder_donnees(nouvelles_observations)
        print(f"\nSuccès ! {len(nouvelles_observations)} observation(s) sauvegardée(s).")
    else:
        print("\nSortie sans nouvelles sauvegardes.")

def menu_principal():
    while True:
        print("\n" + "="*30)
        print("   MENU MARINE POKEDEX")
        print("="*30)