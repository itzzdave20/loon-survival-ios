#!/usr/bin/env bash
set -e

APP_TITLE="LoonSurvival"
APP_DIR="$(pwd)"

echo "Checking macOS..."
if [[ "$(uname)" != "Darwin" ]]; then
  echo "This iOS build script must be run on macOS with Xcode installed."
  exit 1
fi

echo "Creating Python virtual environment..."
python3 -m venv .venv-ios
source .venv-ios/bin/activate

pip install --upgrade pip setuptools wheel
pip install Cython==3.0.11
pip install kivy-ios

echo "Building Python and Kivy for iOS..."
toolchain build python3 kivy

echo "Creating Xcode project..."
if [[ ! -d "${APP_TITLE}-ios" ]]; then
  toolchain create "$APP_TITLE" "$APP_DIR"
else
  echo "Xcode project already exists. Updating instead..."
fi

toolchain update "${APP_TITLE}-ios"

echo "Opening Xcode project..."
open "${APP_TITLE}-ios/${APP_TITLE}.xcodeproj"

echo "Done. Configure signing, Bundle Identifier, orientation, then run/archive in Xcode."
