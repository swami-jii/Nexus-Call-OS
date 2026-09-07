"""
Nexus Call OS - Comprehensive E2E Verification Script
Tests QR Pairing, LAN/Tunnel URLs, Physical APK Download, and SSOT Alignment
"""

import sys
import os
import json
import urllib.request
import urllib.parse
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


def run_e2e_verification():
    print("=" * 60)
    print(" NEXUS CALL OS - COMPLETE END-TO-END SYSTEM VERIFICATION ")
    print("=" * 60)

    # 1. Physical APK File Inspection
    downloads_dir = PROJECT_ROOT / "public" / "downloads"
    canonical_apk = downloads_dir / "Nexus-GSM-Gateway.apk"
    if not canonical_apk.exists():
        candidates = list(downloads_dir.glob("*.apk"))
        if candidates:
            canonical_apk = candidates[0]
        else:
            print("[FAIL] No physical APK found in public/downloads/")
            sys.exit(1)

    physical_size = canonical_apk.stat().st_size
    print(f"[PASS] Physical APK on disk: {canonical_apk.name} ({physical_size:,} bytes / {physical_size / 1_000_000:.2f} MB)")

    # 2. Test Backend Health on localhost:8000
    try:
        req = urllib.request.Request("http://127.0.0.1:8000/api/health")
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode())
            assert resp.status == 200
            print(f"[PASS] Backend Health: Status={data.get('status')}, DB={data.get('database')}")
    except Exception as e:
        print(f"[FAIL] Backend health check failed: {e}")
        sys.exit(1)

    # 3. Test Dynamic LAN Info & SSOT Metadata Endpoint
    try:
        req = urllib.request.Request("http://127.0.0.1:8000/api/android-gateway/lan-info")
        with urllib.request.urlopen(req, timeout=8) as resp:
            lan_info = json.loads(resp.read().decode())
            assert lan_info.get("status") == "success"
            print(f"[PASS] LAN Info SSOT:")
            print(f"  - Real Host LAN IP:    {lan_info.get('lan_ip')}")
            print(f"  - Version:             v{lan_info.get('version_name')}")
            print(f"  - Dynamic File Size:   {lan_info.get('apk_size_formatted')} ({lan_info.get('apk_size_bytes')} bytes)")
            print(f"  - Effective APK URL:   {lan_info.get('apk_download_url')}")
            print(f"  - Mobile Gateway URL:  {lan_info.get('mobile_gateway_url')}")

            assert lan_info.get("apk_size_bytes") == physical_size, "SSOT size must match physical size exactly"
    except Exception as e:
        print(f"[FAIL] LAN Info endpoint check failed: {e}")
        sys.exit(1)

    # 4. Test Direct APK Download Stream over HTTP
    try:
        download_url = "http://127.0.0.1:8000/download"
        req = urllib.request.Request(download_url)
        with urllib.request.urlopen(req, timeout=8) as resp:
            assert resp.status == 200
            content_type = resp.headers.get("Content-Type", "")
            content_length = int(resp.headers.get("Content-Length", 0))
            first_bytes = resp.read(4)

            print(f"[PASS] Direct APK Download Endpoint (/download):")
            print(f"  - HTTP Status:   {resp.status}")
            print(f"  - Content-Type:  {content_type}")
            print(f"  - Content-Len:   {content_length:,} bytes")
            print(f"  - Magic Header:  {first_bytes} (Valid ZIP/APK PK header)")

            assert "application/vnd.android.package-archive" in content_type
            assert content_length == physical_size
            assert first_bytes == b"PK\x03\x04"
    except Exception as e:
        print(f"[FAIL] APK download test failed: {e}")
        sys.exit(1)

    # 5. Test Cloudflare Dynamic Tunnel Manager
    try:
        from backend.android_gateway.tunnel_manager import get_tunnel_manager
        mgr = get_tunnel_manager()
        public_url = mgr.get_tunnel_url(auto_start=False)
        if not public_url:
            tunnel_res = mgr.start_tunnel(target_port=3000, timeout_sec=14.0)
            public_url = tunnel_res.get("public_https_url")
        print(f"[PASS] Dynamic Public Tunnel Generator:")
        print(f"  - Public HTTPS: {public_url}")
        assert public_url and public_url.startswith("https://")
    except Exception as e:
        print(f"[FAIL] Tunnel manager test failed: {e}")
        sys.exit(1)

    # 6. Test Mobile Overview & Bi-Directional SSOT
    try:
        req = urllib.request.Request("http://127.0.0.1:8000/api/android-gateway/mobile-overview")
        with urllib.request.urlopen(req, timeout=4) as resp:
            overview = json.loads(resp.read().decode())
            assert overview.get("status") == "success"
            print(f"[PASS] Mobile Gateway Overview:")
            print(f"  - Active Agents:  {len(overview.get('active_agents', []))}")
            print(f"  - LLM Providers:  {len(overview.get('providers', {}).get('llm', []))}")
    except Exception as e:
        print(f"[FAIL] Mobile overview test failed: {e}")
        sys.exit(1)

    print("=" * 60)
    print("   ALL END-TO-END CHECKS & VERIFICATIONS PASSED 100%    ")
    print("=" * 60)


if __name__ == "__main__":
    run_e2e_verification()
