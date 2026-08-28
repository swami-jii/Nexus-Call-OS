"""
Cross-Platform Companion Package & APK Bundle Generator
Nexus Call OS v2.4 Enterprise

Packages and distributes authentic artifacts:
1. Android (.apk compiled via Gradle & source bundle)
2. Apple iOS / iPhone (Xcode companion project zip)
3. Apple macOS (Mac companion project zip)
4. Windows PC (.NET companion project zip)
"""

import os
import shutil
import zipfile
from pathlib import Path


def generate_all_packages():
    root_dir = Path(__file__).resolve().parent.parent.parent
    downloads_dir = root_dir / "public" / "downloads"
    downloads_dir.mkdir(parents=True, exist_ok=True)

    apps_dir = root_dir / "apps"

    # 1. Android APK (Authentic Gradle Compiled Artifact) & Source Package
    android_dir = apps_dir / "android"
    if android_dir.exists():
        output_apk = downloads_dir / "Nexus-GSM-Gateway-v2.4.apk"
        compiled_apk = android_dir / "app" / "build" / "outputs" / "apk" / "debug" / "app-debug.apk"
        
        if compiled_apk.exists():
            shutil.copyfile(compiled_apk, output_apk)
            print(f"[OK] Deployed genuine compiled APK: {output_apk} ({compiled_apk.stat().st_size:,} bytes)")
        else:
            print(f"[WARN] Compiled APK not found at {compiled_apk}. Run './gradlew assembleDebug' in apps/android first.")

        # Source Package (excluding build and .gradle caches)
        output_android_zip = downloads_dir / "Nexus-Android-Companion-Source.zip"
        with zipfile.ZipFile(output_android_zip, "w", zipfile.ZIP_DEFLATED) as zip_out:
            for root, dirs, files in os.walk(android_dir):
                # Exclude build & cache directories
                dirs[:] = [d for d in dirs if d not in ("build", ".gradle", ".idea")]
                for file in files:
                    if file.endswith((".apk", ".class", ".lock", ".bin")):
                        continue
                    file_path = Path(root) / file
                    rel_path = file_path.relative_to(android_dir)
                    zip_out.write(file_path, str(rel_path))

    # 2. iOS Xcode Project Package
    ios_dir = apps_dir / "ios"
    if ios_dir.exists():
        output_ios_zip = downloads_dir / "Nexus-iOS-Companion-Xcode.zip"
        with zipfile.ZipFile(output_ios_zip, "w", zipfile.ZIP_DEFLATED) as zip_out:
            for root, dirs, files in os.walk(ios_dir):
                for file in files:
                    file_path = Path(root) / file
                    rel_path = file_path.relative_to(ios_dir)
                    zip_out.write(file_path, str(rel_path))

    # 3. macOS Project Package
    macos_dir = apps_dir / "macos"
    if macos_dir.exists():
        output_mac_zip = downloads_dir / "Nexus-macOS-Companion.zip"
        with zipfile.ZipFile(output_mac_zip, "w", zipfile.ZIP_DEFLATED) as zip_out:
            for root, dirs, files in os.walk(macos_dir):
                for file in files:
                    file_path = Path(root) / file
                    rel_path = file_path.relative_to(macos_dir)
                    zip_out.write(file_path, str(rel_path))

    # 4. Windows Project Package
    win_dir = apps_dir / "windows"
    if win_dir.exists():
        output_win_zip = downloads_dir / "Nexus-Windows-Companion.zip"
        with zipfile.ZipFile(output_win_zip, "w", zipfile.ZIP_DEFLATED) as zip_out:
            for root, dirs, files in os.walk(win_dir):
                for file in files:
                    file_path = Path(root) / file
                    rel_path = file_path.relative_to(win_dir)
                    zip_out.write(file_path, str(rel_path))

    print("[SUCCESS] All Cross-Platform Companion Packages Deployed Cleanly!")


if __name__ == "__main__":
    generate_all_packages()


