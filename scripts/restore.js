#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

function showFile(filePath) {
  try {
    const platform = os.platform();

    switch (platform) {
      case "win32":
        const { execSync } = require("child_process");
        execSync(`attrib -h "${filePath}"`, { stdio: "ignore" });
        console.log("File made visible on Windows");
        break;

      case "darwin":
      case "linux":
        const fileName = path.basename(filePath);
        const directory = path.dirname(filePath);
        const newPath = path.join(directory, fileName.replace(/^\./, ""));
        fs.renameSync(filePath, newPath);
        console.log("File made visible on macOS/Linux");
        break;

      default:
        console.log(`File display not supported on ${platform}`);
    }
  } catch (e) {
    console.error(`Error displaying file: ${e}`);
  }
}

function restoreFiles() {
  const sourceDirectory = process.cwd();

  const directoriesToRestore = [
    "images",
    "documents",
    "videos",
    "compressed",
    "torrents",
    "executables",
    "others",
  ];

  const logFiles = ["organization_log.json", ".organization_log.json"];

  let logPath = null;
  for (const file of logFiles) {
    const potentialPath = path.join(sourceDirectory, file);
    if (fs.existsSync(potentialPath)) {
      logPath = potentialPath;
      break;
    }
  }

  if (!logPath) {
    console.log("No movement log found. Unable to restore.");
    return;
  }

  showFile(logPath);

  const log = JSON.parse(fs.readFileSync(logPath, "utf8"));

  let restoredFiles = 0;

  for (const directory of directoriesToRestore) {
    const directoryPath = path.join(sourceDirectory, directory);

    if (!fs.existsSync(directoryPath)) continue;

    const files = fs.readdirSync(directoryPath);

    files.forEach((file) => {
      const filePath = path.join(directoryPath, file);

      if (log[file]) {
        let destination = path.join(sourceDirectory, file);

        let counter = 1;
        const extension = path.extname(file);
        const base = path.basename(file, extension);

        while (fs.existsSync(destination)) {
          const newName = `${base}(${counter})${extension}`;
          destination = path.join(sourceDirectory, newName);
          counter++;
        }

        fs.renameSync(filePath, destination);
        console.log(`Restored ${file} to ${destination}`);
        restoredFiles++;
      }
    });
  }

  for (const directory of directoriesToRestore) {
    const directoryPath = path.join(sourceDirectory, directory);
    if (
      fs.existsSync(directoryPath) &&
      fs.readdirSync(directoryPath).length === 0
    ) {
      fs.rmdirSync(directoryPath);
    }
  }

  const textFile = path.join(sourceDirectory, "open.txt");
  if (fs.existsSync(textFile)) {
    fs.unlinkSync(textFile);
  }

  fs.unlinkSync(logPath);

  console.log(`Restoration complete. ${restoredFiles} files restored.`);
}

function main() {
  restoreFiles();
}

if (require.main === module) {
  main();
}

module.exports = { restoreFiles };
