# Loon Survival — iOS Build and Upload Guide

This project is already written in Python using Kivy. For iOS, you do not need to rewrite the full game in Swift immediately. The practical path is to package the Kivy project into an Xcode project using `kivy-ios`, then archive and upload it through Xcode.

## 1. Requirements

You need a Mac because Xcode only runs on macOS.

Install these first:

- macOS
- Xcode from the Mac App Store
- Xcode Command Line Tools
- Homebrew
- Python 3
- Apple Developer Account if you want to upload to TestFlight or the App Store

## 2. Project entry point

The iOS packaging tool expects the app entry point to be:

```text
main.py
```

This project already has that file.

## 3. Install iOS build dependencies

Open Terminal on macOS inside this project folder, then run:

```bash
brew install autoconf automake libtool pkg-config
brew link libtool
python3 -m venv .venv-ios
source .venv-ios/bin/activate
pip install --upgrade pip setuptools wheel
pip install Cython==3.0.11
pip install kivy-ios
```

## 4. Build Kivy for iOS

Run:

```bash
toolchain build python3 kivy
```

This step can take time because it compiles Python and Kivy for iOS.

## 5. Create the Xcode project

Run this from the project root:

```bash
toolchain create LoonSurvival "$(pwd)"
toolchain update LoonSurvival-ios
open LoonSurvival-ios/LoonSurvival.xcodeproj
```

## 6. Configure in Xcode

In Xcode, open the project and set these values:

| Setting | Suggested value |
|---|---|
| Display Name | Loon Survival |
| Bundle Identifier | com.yourname.loonsurvival |
| Version | 1.0.3 |
| Build | 1 |
| Orientation | Landscape Left / Landscape Right |
| Team | Your Apple Developer Team |
| Signing | Automatically manage signing |

Replace `com.yourname.loonsurvival` with your own unique bundle ID.

## 7. Test on iPhone or Simulator

In Xcode:

1. Select an iPhone simulator or your connected iPhone.
2. Click **Run**.
3. Check if the game opens, audio works, controls respond, and screen orientation is correct.

## 8. Archive and upload

When the app is working:

1. In Xcode, select **Any iOS Device**.
2. Go to **Product > Archive**.
3. When the Organizer opens, choose **Distribute App**.
4. Choose **App Store Connect**.
5. Upload the build.
6. Finish TestFlight setup in App Store Connect.

## 9. App Store notes

Prepare these before submission:

- App name
- App icon, 1024 × 1024 px
- Screenshots for required iPhone sizes
- App description
- Age rating
- Privacy policy URL
- Support URL
- Category: Games

## 10. Common problems

### Problem: `toolchain` command not found

Activate the virtual environment again:

```bash
source .venv-ios/bin/activate
```

### Problem: Xcode signing error

Check these:

- You selected your Apple Developer Team.
- Your Bundle Identifier is unique.
- Your Apple Developer membership is active.

### Problem: assets not loading

Make sure these folders are included in the project:

```text
resources/
scripts/resources/
user_config.csv
world_objects_list.csv
```

### Problem: app works on desktop but crashes on iOS

Check file paths. iOS is stricter with bundled resources. Avoid writing into the app bundle. Use Kivy's user data directory for saved files.

## 11. Important note

This package prepares the project for iOS conversion and upload. The actual Xcode archive must be created on a Mac with Xcode and an Apple Developer account.
