# Android build instructions for Loon Survival

This project has been prepared for Android packaging with `buildozer.spec`.

## What was added
- `buildozer.spec` configured for this Kivy app
- asset inclusion for:
  - `resources/`
  - `scripts/resources/`
  - `user_config.csv`
  - `world_objects_list.csv`

## Recommended build environment
Buildozer is most reliable on:
- Linux
- WSL2 on Windows
- Linux VM

It is not recommended to build Android APKs directly on macOS for typical Kivy/Buildozer workflows.

## 1. Install system dependencies
Example for Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y python3-pip python3-venv git zip unzip openjdk-17-jdk autoconf libtool pkg-config zlib1g-dev libncurses5-dev libncursesw5-dev libtinfo5 cmake libffi-dev libssl-dev
pip3 install --user buildozer cython
```

If `buildozer` is not on PATH, run it with:

```bash
python3 -m buildozer --help
```

## 2. Build a debug APK
From the project root:

```bash
buildozer android debug
```

The generated APK will usually be placed under `bin/`.

## 3. Install to a connected Android phone
Enable:
- Developer Options
- USB Debugging

Then connect your phone by USB and run:

```bash
buildozer android debug deploy run
```

## 4. Build a release package
For a release build:

```bash
buildozer android release
```

For Play Store release, signing is required.

## 5. Notes for this project
This app is configured as:
- title: `Loon Survival`
- package: `org.example.loonsurvival`
- orientation: `landscape`

Before publishing publicly, you should change:

- `package.domain = org.example`

to a domain you control, for example:

```ini
package.domain = com.yourname
```

## 6. Likely follow-up fixes
This repo may still need Android-specific adjustments after first build, especially for:
- audio loading behavior
- file path assumptions
- performance tuning
- screen scaling on different devices

## 7. Next command to run
After setting up Linux/WSL with Buildozer:

```bash
buildozer android debug
```
