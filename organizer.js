#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

function cacherFichier(cheminFichier) {
  try {
    const plateforme = os.platform();

    switch (plateforme) {
      case "win32":
        // Utilisation de Windows-specific API pour masquer le fichier
        const { execSync } = require("child_process");
        execSync(`attrib +h "${cheminFichier}"`, { stdio: "ignore" });
        console.log("Fichier caché sur Windows");
        break;

      case "darwin": // macOS
      case "linux":
        // Sur Unix-like systems, ajouter un point au début du nom
        const nomFichier = path.basename(cheminFichier);
        const dossier = path.dirname(cheminFichier);
        const nouveauChemin = path.join(dossier, "." + nomFichier);
        fs.renameSync(cheminFichier, nouveauChemin);
        console.log("Fichier caché sur macOS/Linux");
        break;

      default:
        console.log(`Masquage de fichier non supporté sur ${plateforme}`);
    }
  } catch (e) {
    console.error(`Erreur lors du masquage du fichier : ${e}`);
  }
}

function creerDossiers(basePath, categories) {
  Object.keys(categories).forEach((dossier) => {
    const cheminDossier = path.join(basePath, dossier);
    if (!fs.existsSync(cheminDossier)) {
      fs.mkdirSync(cheminDossier, { recursive: true });
    }
  });
}

function deplacerFichier(
  cheminComplet,
  fichier,
  dossierSource,
  typesFichiers,
  journal
) {
  const extension = path.extname(fichier).toLowerCase();

  for (const [typeFichier, extensions] of Object.entries(typesFichiers)) {
    if (extensions.includes(extension)) {
      const destination = path.join(dossierSource, typeFichier, fichier);
      try {
        fs.renameSync(cheminComplet, destination);
        console.log(`Déplacé ${fichier} vers ${typeFichier}`);
        journal[fichier] = { type: typeFichier, origine: cheminComplet };
        return true;
      } catch (e) {
        console.error(`Erreur lors du déplacement de ${fichier} : ${e}`);
        return false;
      }
    }
  }
  return false;
}

function organiserFichiers() {
  const dossierSource = process.cwd();
  const typesFichiers = {
    images: [
      ".png",
      ".jpeg",
      ".jpg",
      ".svg",
      ".gif",
      ".bmp",
      ".webp",
      ".tiff",
      ".raw",
      ".heic",
    ],
    documents: [
      ".docx",
      ".pdf",
      ".txt",
      ".doc",
      ".rtf",
      ".odt",
      ".xlsx",
      ".csv",
      ".pptx",
      ".md",
    ],
    videos: [
      ".mp4",
      ".mkv",
      ".avi",
      ".mov",
      ".wmv",
      ".flv",
      ".webm",
      ".m4v",
      ".mpeg",
      ".mpg",
    ],
    comprimes: [".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz", ".tgz"],
    torrents: [".torrent"],
    executables: [".exe", ".msi", ".bat", ".sh", ".cmd", ".app", ".bin"],
    autres: [],
  };

  const journal = {};
  creerDossiers(dossierSource, typesFichiers);

  const fichiers = fs.readdirSync(dossierSource);
  const fichiersAOrganiser = [];

  fichiers.forEach((fichier) => {
    const cheminComplet = path.join(dossierSource, fichier);
    const estDossier = fs.statSync(cheminComplet).isDirectory();

    if (
      estDossier ||
      fichier === "organiseur_fichiers.js" ||
      fichier === "journal_organisation.json"
    ) {
      return;
    }

    if (
      !deplacerFichier(
        cheminComplet,
        fichier,
        dossierSource,
        typesFichiers,
        journal
      )
    ) {
      const autreDossier = path.join(dossierSource, "autres", fichier);
      fs.renameSync(cheminComplet, autreDossier);
      console.log(`Déplacé ${fichier} vers 'autres'`);
      journal[fichier] = { type: "autres", origine: cheminComplet };
      fichiersAOrganiser.push(fichier);
    }
  });

  const cheminJournal = path.join(dossierSource, "journal_organisation.json");
  fs.writeFileSync(cheminJournal, JSON.stringify(journal, null, 4), "utf8");
  cacherFichier(cheminJournal);

  if (fichiersAOrganiser.length === 0) {
    fs.writeFileSync("tu_tattends_a_quoi.txt", "Tu t'attends à quoi ?", "utf8");
    console.log("Aucun fichier organisé. Message humoristique ajouté.");
  }

  console.log(`Total de ${Object.keys(journal).length} fichiers organisés.`);
}

// Exécution si lancé directement
if (require.main === module) {
  organiserFichiers();
}

module.exports = { organiserFichiers };
