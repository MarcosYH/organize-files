# File Organizer CLI

![Cover Image](https://res.cloudinary.com/dbx3mcmdp/image/upload/f_auto,q_auto/uijrj7eiknafaxobv77u)

A simple, cross-platform command-line tool to automatically organize files in your current directory by type and easily restore them.

## 🚀 Features

- **Automatic File Categorization**: Instantly sort files into predefined categories
- **Cross-Platform Support**: Works on Windows, macOS, and Linux
- **Easy Restoration**: Quickly restore files to their original locations
- **Lightweight and Simple**: No complex configuration needed

## 📦 Installation

Install the package globally using npm:

```bash
npm install -g organizer-files-cli
```

## 🛠 Usage

### Organize Files

Navigate to the directory you want to organize and run:

```bash
organize-files
```

This will automatically sort your files into these categories:

- 🖼️ Images
- 📄 Documents
- 🎥 Videos
- 📦 Compressed Files
- 💾 Torrents
- 💻 Executables
- 📁 Others

### Restore Files

If you want to revert the organization, simply run:

```bash
restore-files
```

This will move all files back to their original locations.

## 📋 How It Works

1. When you run `organize-files`, the script:

   - Scans the current directory
   - Creates category folders if they don't exist
   - Moves files into appropriate category folders
   - Creates a hidden log file to track original locations

2. When you run `restore-files`, the script:
   - Reads the log file
   - Moves files back to their original locations
   - Removes the log file and empty category folders

## 🔍 Supported File Types

### Images

`.png`, `.jpeg`, `.jpg`, `.svg`, `.gif`, `.bmp`, `.webp`, `.tiff`, `.raw`, `.heic`

### Documents

`.docx`, `.pdf`, `.txt`, `.doc`, `.rtf`, `.odt`, `.xlsx`, `.csv`, `.pptx`, `.md`

### Videos

`.mp4`, `.mkv`, `.avi`, `.mov`, `.wmv`, `.flv`, `.webm`, `.m4v`, `.mpeg`, `.mpg`

### Compressed

`.zip`, `.rar`, `.7z`, `.tar`, `.gz`, `.bz2`, `.xz`, `.tgz`

### Executables

`.exe`, `.msi`, `.bat`, `.sh`, `.cmd`, `.app`, `.bin`

### Torrents

`.torrent`

## ⚠️ Notes

- The tool works in the current directory
- Files with unrecognized extensions go to the "Others" folder
- The original script is not moved or organized

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License

Copyright (c) 2024 Marcos.yh

## 🐛 Issues

Report issues on the GitHub repository.
