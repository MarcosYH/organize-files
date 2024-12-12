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

function ensureDirectoryExists(directoryPath) {
  try {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
  } catch (error) {
    console.error(`Folder creation error ${directoryPath}:`, error);
    throw error;
  }
}

function createDirectoriesForExistingFileTypes(
  basePath,
  fileTypes,
  sourceFiles
) {
  const directoriesToCreate = {};

  Object.entries(fileTypes).forEach(([fileType, extensions]) => {
    const hasMatchingFiles = sourceFiles.some((file) =>
      extensions.includes(path.extname(file).toLowerCase())
    );

    if (hasMatchingFiles || fileType === "others") {
      directoriesToCreate[fileType] = true;
    }
  });

  Object.keys(directoriesToCreate).forEach((directory) => {
    const directoryPath = path.join(basePath, directory);
    ensureDirectoryExists(directoryPath);
  });
}

function generateUniqueFileName(destinationPath) {
  if (!fs.existsSync(destinationPath)) {
    return destinationPath;
  }

  const ext = path.extname(destinationPath);
  const base = path.basename(destinationPath, ext);
  let counter = 1;

  while (true) {
    const newPath = path.join(
      path.dirname(destinationPath),
      `${base}(${counter})${ext}`
    );

    if (!fs.existsSync(newPath)) {
      return newPath;
    }
    counter++;
  }
}

function moveFile(fullPath, file, sourceDirectory, fileTypes, journal) {
  const extension = path.extname(file).toLowerCase();

  for (const [fileType, extensions] of Object.entries(fileTypes)) {
    if (extensions.includes(extension)) {
      const destination = path.join(sourceDirectory, fileType, file);

      try {
        const uniqueDestination = generateUniqueFileName(destination);

        fs.renameSync(fullPath, uniqueDestination);

        if (uniqueDestination !== destination) {
          console.log(
            `Moved ${file} to ${fileType} as ${path.basename(
              uniqueDestination
            )}`
          );
          journal[file] = {
            type: fileType,
            origin: fullPath,
            newName: path.basename(uniqueDestination),
          };
        } else {
          console.log(`Moved ${file} to ${fileType}`);
          journal[file] = { type: fileType, origin: fullPath };
        }

        return true;
      } catch (e) {
        console.error(`Error moving ${file}: ${e}`);
        return false;
      }
    }
  }
  return false;
}

function writeOrganizationLog(sourceDirectory, newJournal) {
  const logPath = path.join(sourceDirectory, "organization_log.json");

  try {
    let existingJournal = {};
    if (fs.existsSync(logPath)) {
      try {
        existingJournal = JSON.parse(fs.readFileSync(logPath, "utf8"));
      } catch (parseError) {
        console.error("Error reading old log :", parseError);
      }
    }

    const mergedJournal = {
      ...existingJournal,
      ...newJournal,
    };

    if (fs.existsSync(logPath)) {
      fs.unlinkSync(logPath);
    }

    fs.writeFileSync(logPath, JSON.stringify(mergedJournal, null, 4), "utf8");
    hideFile(logPath);

    console.log(`Updated log`);
    return mergedJournal;
  } catch (error) {
    console.error(`Error while writing log : ${error}`);
    return newJournal;
  }
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
      ".json",
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

  const files = fs.readdirSync(sourceDirectory);
  const filesToOrganize = files.filter((file) => {
    const fullPath = path.join(sourceDirectory, file);
    const isDirectory = fs.statSync(fullPath).isDirectory();

    return !(
      isDirectory ||
      file === "file_organizer.js" ||
      file === "organization_log.json" ||
      Object.keys(fileTypes).some((category) =>
        fullPath.startsWith(path.join(sourceDirectory, category))
      )
    );
  });

  createDirectoriesForExistingFileTypes(
    sourceDirectory,
    fileTypes,
    filesToOrganize
  );

  if (filesToOrganize.length === 0) {
    console.log("No new files to organize.");
    return;
  }

  filesToOrganize.forEach((file) => {
    const fullPath = path.join(sourceDirectory, file);

    if (!moveFile(fullPath, file, sourceDirectory, fileTypes, journal)) {
      const otherDirectoryPath = path.join(sourceDirectory, "others");
      ensureDirectoryExists(otherDirectoryPath);

      const otherDirectory = generateUniqueFileName(
        path.join(otherDirectoryPath, file)
      );
      try {
        fs.renameSync(fullPath, otherDirectory);
        console.log(`Moved ${file} to 'others'`);
        journal[file] = {
          type: "others",
          origin: fullPath,
          newName: path.basename(otherDirectory),
        };
      } catch (error) {
        console.error(`Impossible to move ${file} : ${error}`);
      }
    }
  });

  if (Object.keys(journal).length > 0) {
    writeOrganizationLog(sourceDirectory, journal);
  }

  console.log(`Total of ${Object.keys(journal).length} files organized.`);
}

if (require.main === module) {
  organizeFiles();
}

module.exports = { organizeFiles };
