[app]

# (str) Title of your application
title = Loon Survival

# (str) Package name
package.name = loonsurvival

# (str) Package domain (needed for android/ios packaging)
package.domain = org.example

# (str) Source code where the main.py live
source.dir = .

# (list) Source files to include
source.include_exts = py,png,jpg,jpeg,csv,txt,mp3,wav,ttf,kv

# (list) List of directory to exclude (let empty to not exclude anything)
source.exclude_dirs = .git,.idea,__pycache__,bin,.venv,venv,env,build,dist

# (list) List of exclusions using pattern matching
source.exclude_patterns = *.pyc,*.pyo,*.log,.DS_Store

# (str) Application versioning
version = 1.0.3

# (list) Application requirements
requirements = python3,kivy

# (str) Presplash of the application
# presplash.filename = %(source.dir)s/data/presplash.png

# (str) Icon of the application
# icon.filename = %(source.dir)s/data/icon.png

# (str) Supported orientation (one of landscape, sensorLandscape, portrait or all)
orientation = landscape

# (bool) Indicate if the application should be fullscreen or not
fullscreen = 1

# (string) Path to a custom Android manifest file
# android.manifest =

# (string) Path to a custom Android resource directory
# android.add_resources =

# (list) Permissions
android.permissions = INTERNET

# (list) Android API to use
android.api = 31

# (int) Minimum API your APK / AAB will support
android.minapi = 21

# (int) Android SDK version to use
android.sdk = 31

# (str) Android SDK directory (equivalent to CI: ln -sf …/sdk ~/.buildozer/android/platform/android-sdk). Local builds: override with env APP_ANDROID_SDK_PATH.
android.sdk_path = /usr/local/lib/android/sdk

# (str) Android NDK version to use
android.ndk = 25b

# (int) Android NDK API to use
android.ndk_api = 21

# (bool) Use AndroidX
android.enable_androidx = True

# (list) Java classes to add to the android project
# android.add_src =

# (str) Android entry point, default is ok for Kivy apps
# android.entrypoint = org.kivy.android.PythonActivity

# (str) Patterns to whitelist for the whole project
android.add_assets = resources,scripts/resources,user_config.csv,world_objects_list.csv

# (list) Python modules to blacklist
# blacklist_src =

# (str) OUYA Console category. Should be one of GAME or APP
# android.ouya.category = GAME

# (str) Indicate whether the screen should stay on
android.wakelock = False

# (str) Log level of build output
log_level = 2

# (bool) Copy libraries instead of making a libpymodules.so
copy_libs = 1

# (bool) Should buildozer ignore the storage path on Android?
# android.private_storage = True

[buildozer]

# (int) Log level (0 = error only, 1 = info, 2 = debug)
log_level = 2

# (int) Display warning if buildozer is run as root
warn_on_root = 1
