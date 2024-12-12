#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

function showFile(filePath) {
  try {
    const platform = os.platform();

    switch (platform) {
      case "win32":
        // Remove hidden attribute on Windows
        const { execSync } = require("child_process");
        execSync(`attrib -h "${filePath}"`, { stdio: "ignore" });
        console.log("File made visible on Windows");
        break;

      case "darwin": // macOS
      case "linux":
        // On Unix-like systems, remove the leading dot from filename
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
  // Get current directory
  const sourceDirectory = process.cwd();

  // Paths of directories to restore
  const directoriesToRestore = [
    "images",
    "documents",
    "videos",
    "compressed",
    "torrents",
    "executables",
    "others", // Ajout du dossier "others"
  ];

  // Possible log files
  const logFiles = ["organization_log.json", ".organization_log.json"];

  // Find log file
  let logPath = null;
  for (const file of logFiles) {
    const potentialPath = path.join(sourceDirectory, file);
    if (fs.existsSync(potentialPath)) {
      logPath = potentialPath;
      break;
    }
  }

  // Check if log file exists
  if (!logPath) {
    console.log("No movement log found. Unable to restore.");
    return;
  }

  // Show log file if hidden
  showFile(logPath);

  // Load movement log
  const log = JSON.parse(fs.readFileSync(logPath, "utf8"));

  // Restore each file
  let restoredFiles = 0;

  for (const directory of directoriesToRestore) {
    const directoryPath = path.join(sourceDirectory, directory);

    // Check if directory exists
    if (!fs.existsSync(directoryPath)) continue;

    // Browse directory files
    const files = fs.readdirSync(directoryPath);

    files.forEach((file) => {
      const filePath = path.join(directoryPath, file);

      // Check if file is in the log
      if (log[file]) {
        // Restore to original location
        let destination = path.join(sourceDirectory, file);

        // Conflict management
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

  // Remove empty category directories
  for (const directory of directoriesToRestore) {
    const directoryPath = path.join(sourceDirectory, directory);
    if (
      fs.existsSync(directoryPath) &&
      fs.readdirSync(directoryPath).length === 0
    ) {
      fs.rmdirSync(directoryPath);
    }
  }

  // Remove the "what_were_you_expecting.txt" file if it exists
  const textFile = path.join(sourceDirectory, "open.txt");
  if (fs.existsSync(textFile)) {
    fs.unlinkSync(textFile);
  }

  // Delete log only after successful restoration
  fs.unlinkSync(logPath);

  console.log(`Restoration complete. ${restoredFiles} files restored.`);
}

function main() {
  restoreFiles();
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = { restoreFiles };
