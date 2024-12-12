#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

function hideFile(filePath) {
  try {
    const platform = os.platform();

    switch (platform) {
      case "win32":
        const { execSync } = require("child_process");
        execSync(`attrib +h "${filePath}"`, { stdio: "ignore" });
        console.log("File hidden on Windows");
        break;

      case "darwin":
      case "linux":
        const fileName = path.basename(filePath);
        const directory = path.dirname(filePath);
        const newPath = path.join(directory, "." + fileName);
        fs.renameSync(filePath, newPath);
        console.log("File hidden on macOS/Linux");
        break;

      default:
        console.log(`File hiding not supported on ${platform}`);
    }
  } catch (e) {
    console.error(`Error hiding file: ${e}`);
  }
}

function createDirectories(basePath, categories) {
  Object.keys(categories).forEach((directory) => {
    const directoryPath = path.join(basePath, directory);
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
  });
}

function moveFile(fullPath, file, sourceDirectory, fileTypes, journal) {
  const extension = path.extname(file).toLowerCase();

  for (const [fileType, extensions] of Object.entries(fileTypes)) {
    if (extensions.includes(extension)) {
      const destination = path.join(sourceDirectory, fileType, file);
      try {
        fs.renameSync(fullPath, destination);
        console.log(`Moved ${file} to ${fileType}`);
        journal[file] = { type: fileType, origin: fullPath };
        return true;
      } catch (e) {
        console.error(`Error moving ${file}: ${e}`);
        return false;
      }
    }
  }
  return false;
}

function organizeFiles() {
  const sourceDirectory = process.cwd();
  const fileTypes = {
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
    compressed: [".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz", ".tgz"],
    torrents: [".torrent"],
    executables: [".exe", ".msi", ".bat", ".sh", ".cmd", ".app", ".bin"],
    others: [],
  };

  const journal = {};
  createDirectories(sourceDirectory, fileTypes);

  const files = fs.readdirSync(sourceDirectory);
  const filesToOrganize = [];

  // Filtrer les fichiers à organiser
  const organizableFiles = files.filter((file) => {
    const fullPath = path.join(sourceDirectory, file);
    const isDirectory = fs.statSync(fullPath).isDirectory();

    return !(
      isDirectory ||
      file === "file_organizer.js" ||
      file === "organization_log.json"
    );
  });

  // Si aucun fichier à organiser, créer un fichier humoristique et quitter
  if (organizableFiles.length === 0) {
    fs.writeFileSync("open.txt", "What were you expecting?", "utf8");
    console.log("No files to organize. Humorous message added.");
    return;
  }

  // Organiser les fichiers
  organizableFiles.forEach((file) => {
    const fullPath = path.join(sourceDirectory, file);

    if (!moveFile(fullPath, file, sourceDirectory, fileTypes, journal)) {
      const otherDirectory = path.join(sourceDirectory, "others", file);
      fs.renameSync(fullPath, otherDirectory);
      console.log(`Moved ${file} to 'others'`);
      journal[file] = { type: "others", origin: fullPath };
      filesToOrganize.push(file);
    }
  });

  // Ne créer le journal que s'il y a des fichiers à enregistrer
  if (Object.keys(journal).length > 0) {
    const logPath = path.join(sourceDirectory, "organization_log.json");
    fs.writeFileSync(logPath, JSON.stringify(journal, null, 4), "utf8");
    hideFile(logPath);
  }

  console.log(`Total of ${Object.keys(journal).length} files organized.`);
}

if (require.main === module) {
  organizeFiles();
}

module.exports = { organizeFiles };
