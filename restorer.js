#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

function montrerFichier(cheminFichier) {
  try {
    const plateforme = os.platform();

    switch (plateforme) {
      case "win32":
        // Enlever l'attribut caché sur Windows
        const { execSync } = require("child_process");
        execSync(`attrib -h "${cheminFichier}"`, { stdio: "ignore" });
        console.log("Fichier rendu visible sur Windows");
        break;

      case "darwin": // macOS
      case "linux":
        // Sur Unix-like systems, enlever le point du début du nom
        const nomFichier = path.basename(cheminFichier);
        const dossier = path.dirname(cheminFichier);
        const nouveauChemin = path.join(dossier, nomFichier.replace(/^\./, ""));
        fs.renameSync(cheminFichier, nouveauChemin);
        console.log("Fichier rendu visible sur macOS/Linux");
        break;

      default:
        console.log(`Affichage de fichier non supporté sur ${plateforme}`);
    }
  } catch (e) {
    console.error(`Erreur lors de l'affichage du fichier : ${e}`);
  }
}

function restaurerFichiers() {
  // Obtenir le dossier courant
  const dossierSource = process.cwd();

  // Chemins des dossiers à restaurer
  const dossiersARestaurer = [
    "images",
    "documents",
    "videos",
    "comprimes",
    "torrents",
    "executables",
  ];

  // Fichiers journaux possibles
  const fichiersJournal = [
    "journal_organisation.json",
    ".journal_organisation.json",
  ];

  // Trouver le fichier journal
  let cheminJournal = null;
  for (const fichier of fichiersJournal) {
    const cheminPotentiel = path.join(dossierSource, fichier);
    if (fs.existsSync(cheminPotentiel)) {
      cheminJournal = cheminPotentiel;
      break;
    }
  }

  // Vérifier si le fichier journal existe
  if (!cheminJournal) {
    console.log(
      "Aucun journal de déplacement trouvé. Impossible de restaurer."
    );
    return;
  }

  // Montrer le fichier journal s'il est caché
  montrerFichier(cheminJournal);

  // Charger le journal des déplacements
  const journal = JSON.parse(fs.readFileSync(cheminJournal, "utf8"));

  // Restaurer chaque fichier
  let fichiersRestaures = 0;

  for (const dossier of dossiersARestaurer) {
    const cheminDossier = path.join(dossierSource, dossier);

    // Vérifier si le dossier existe
    if (!fs.existsSync(cheminDossier)) continue;

    // Parcourir les fichiers du dossier
    const fichiers = fs.readdirSync(cheminDossier);

    fichiers.forEach((fichier) => {
      const cheminFichier = path.join(cheminDossier, fichier);

      // Vérifier si le fichier est dans le journal
      if (journal[fichier]) {
        // Restaurer à l'emplacement d'origine
        let destination = path.join(dossierSource, fichier);

        // Gestion des conflits
        let compteur = 1;
        const extension = path.extname(fichier);
        const base = path.basename(fichier, extension);

        while (fs.existsSync(destination)) {
          const nouveauNom = `${base}(${compteur})${extension}`;
          destination = path.join(dossierSource, nouveauNom);
          compteur++;
        }

        fs.renameSync(cheminFichier, destination);
        console.log(`Restauré ${fichier} vers ${destination}`);
        fichiersRestaures++;
      }
    });
  }

  // Supprimer les dossiers de catégories vides
  for (const dossier of dossiersARestaurer) {
    const cheminDossier = path.join(dossierSource, dossier);
    if (
      fs.existsSync(cheminDossier) &&
      fs.readdirSync(cheminDossier).length === 0
    ) {
      fs.rmdirSync(cheminDossier);
    }
  }

  // Supprimer le fichier "tu_tattends_a_quoi.txt" s'il existe
  const fichierTexte = path.join(dossierSource, "tu_tattends_a_quoi.txt");
  if (fs.existsSync(fichierTexte)) {
    fs.unlinkSync(fichierTexte);
  }

  // Supprimer le journal uniquement après une restauration réussie
  fs.unlinkSync(cheminJournal);

  console.log(
    `Restauration terminée. ${fichiersRestaures} fichiers restaurés.`
  );
}

function main() {
  restaurerFichiers();
}

// Exécution si lancé directement
if (require.main === module) {
  main();
}

module.exports = { restaurerFichiers };
