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

        if (fileName.startsWith(".")) {
          const newFileName = fileName.replace(/^\./, "");
          const newPath = path.join(directory, newFileName);

          let finalPath = newPath;
          let counter = 1;
          while (fs.existsSync(finalPath)) {
            finalPath = path.join(directory, `${newFileName}(${counter})`);
            counter++;
          }

          fs.renameSync(filePath, finalPath);
          console.log(`File made visible: ${finalPath}`);
        }
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

  let log;
  try {
    log = JSON.parse(fs.readFileSync(logPath, "utf8"));
  } catch (error) {
    console.error("Error reading log file:", error);
    return;
  }

  let restoredFiles = 0;

  for (const directory of directoriesToRestore) {
    const directoryPath = path.join(sourceDirectory, directory);

    if (!fs.existsSync(directoryPath)) continue;

    const files = fs.readdirSync(directoryPath);

    files.forEach((file) => {
      const filePath = path.join(directoryPath, file);

      const logEntry = Object.entries(log).find(
        ([key, value]) =>
          value.newName === file ||
          (value.type === directory && path.basename(value.origin) === file)
      );

      if (logEntry) {
        const [originalFileName, fileInfo] = logEntry;
        let destination = path.join(sourceDirectory, originalFileName);

        let counter = 1;
        const extension = path.extname(originalFileName);
        const base = path.basename(originalFileName, extension);

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
