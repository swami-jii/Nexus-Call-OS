#!/usr/bin/env python3
"""
Nexus Call OS - Dynamic Android APK Publish & Metadata Pipeline
Extracts version info from Gradle, locates the compiled APK, calculates actual filesystem
size and SHA-256 checksum, and publishes the APK to public/downloads with synchronized metadata.
"""

import os
import re
import sys
import json
import shutil
import hashlib
from datetime import datetime, timezone
from pathlib import Path

def get_project_root() -> Path:
    # Resolves to repository root
    return Path(__file__).resolve().parent.parent.parent

def extract_gradle_version(gradle_file: Path) -> tuple[str, int]:
    """Extracts versionName and versionCode from build.gradle.kts."""
    if not gradle_file.exists():
        return "2.4.0", 240
    
    content = gradle_file.read_text(encoding="utf-8")
    version_name_match = re.search(r'versionName\s*=\s*["\']([^"\']+)["\']', content)
    version_code_match = re.search(r'versionCode\s*=\s*(\d+)', content)
    
    version_name = version_name_match.group(1) if version_name_match else "2.4.0"
    version_code = int(version_code_match.group(1)) if version_code_match else 240
    return version_name, version_code

def format_file_size(size_bytes: int) -> str:
    if size_bytes >= 1_000_000:
        return f"{size_bytes / 1_000_000:.2f} MB"
    elif size_bytes >= 1024:
        return f"{size_bytes / 1024:.1f} KB"
    return f"{size_bytes} B"

def compute_sha256(file_path: Path) -> str:
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            sha256.update(chunk)
    return sha256.hexdigest()

def publish_apk() -> dict:
    root = get_project_root()
    gradle_file = root / "apps" / "android" / "app" / "build.gradle.kts"
    apk_debug = root / "apps" / "android" / "app" / "build" / "outputs" / "apk" / "debug" / "app-debug.apk"
    apk_release = root / "apps" / "android" / "app" / "build" / "outputs" / "apk" / "release" / "app-release.apk"
    
    # Select newest APK
    candidate_apks = [p for p in [apk_release, apk_debug] if p.exists()]
    if not candidate_apks:
        print("ERROR: No compiled APK found in apps/android/app/build/outputs/apk/.")
        print("Please build the Android app first using Gradle (./gradlew app:assembleDebug).")
        sys.exit(1)
        
    source_apk = max(candidate_apks, key=lambda p: p.stat().st_mtime)
    
    version_name, version_code = extract_gradle_version(gradle_file)
    file_size_bytes = source_apk.stat().st_size
    file_size_formatted = format_file_size(file_size_bytes)
    sha256_hash = compute_sha256(source_apk)
    mtime = datetime.fromtimestamp(source_apk.stat().st_mtime, tz=timezone.utc).isoformat()
    
    downloads_dir = root / "public" / "downloads"
    downloads_dir.mkdir(parents=True, exist_ok=True)
    
    versioned_filename = f"Nexus-GSM-Gateway-v{version_name}.apk"
    canonical_filename = "Nexus-GSM-Gateway.apk"
    legacy_filename = "Nexus-GSM-Gateway-v2.4.apk"
    
    dest_versioned = downloads_dir / versioned_filename
    dest_canonical = downloads_dir / canonical_filename
    dest_legacy = downloads_dir / legacy_filename
    
    # Copy APK to public download paths
    shutil.copy2(source_apk, dest_versioned)
    shutil.copy2(source_apk, dest_canonical)
    shutil.copy2(source_apk, dest_legacy)
    
    metadata = {
        "versionName": version_name,
        "versionCode": version_code,
        "apkFileName": versioned_filename,
        "canonicalApkFileName": canonical_filename,
        "legacyApkFileName": legacy_filename,
        "apkSizeBytes": file_size_bytes,
        "apkSizeFormatted": file_size_formatted,
        "sha256": sha256_hash,
        "buildTimestamp": mtime,
        "publishedAt": datetime.now(timezone.utc).isoformat(),
        "isReady": True
    }
    
    # Save metadata to public/downloads/release_metadata.json
    metadata_public = downloads_dir / "release_metadata.json"
    metadata_public.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    
    # Also save to backend directory for direct import
    backend_gateway_dir = root / "backend" / "android_gateway"
    if backend_gateway_dir.exists():
        metadata_backend = backend_gateway_dir / "release_metadata.json"
        metadata_backend.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
        
    print("==================================================")
    print("   NEXUS CALL OS - ANDROID APK PUBLISHED          ")
    print("==================================================")
    print(f"Source APK:      {source_apk}")
    print(f"Version Name:    {version_name}")
    print(f"Version Code:    {version_code}")
    print(f"APK Size:        {file_size_formatted} ({file_size_bytes:,} bytes)")
    print(f"SHA-256:         {sha256_hash}")
    print(f"Published Files: ")
    print(f"  - {dest_versioned}")
    print(f"  - {dest_canonical}")
    print(f"  - {dest_legacy}")
    print(f"Metadata File:   {metadata_public}")
    print("==================================================")
    return metadata

if __name__ == "__main__":
    publish_apk()
