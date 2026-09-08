"""
Comprehensive Verification Script for Multi-Endpoint Permanent Tunnel & Gateway Route Switcher
"""
import urllib.request
import json
import sys

def main():
    base_url = "http://127.0.0.1:8000"
    print("Testing /api/android-gateway/lan-info ...")
    req = urllib.request.urlopen(f"{base_url}/api/android-gateway/lan-info")
    data = json.loads(req.read().decode())
    print("LAN IP:", data.get("lan_ip"))
    print("Public HTTPS URL:", data.get("public_https_url"))
    print("Provider:", data.get("tunnel_provider"))
    print("Configured Routes:", data.get("configured_routes"))
    
    assert data.get("status") == "success", "Failed status check"
    assert data.get("lan_ip") != "127.0.0.1", "LAN IP must not be loopback"
    if data.get("public_https_url"):
        assert "api.trycloudflare.com" not in data["public_https_url"], "POISON URL detected!"
        assert data["public_https_url"].startswith("https://"), "Public URL must start with https://"

    print("\nTesting Multi-Endpoint Tunnel Configuration Save (Ngrok + Cloudflare + Custom)...")
    payload = {
        "ngrok_url": "https://upstream-evolution-gulp.ngrok-free.dev",
        "custom_url": "https://call-gateway.enterprise.com",
        "active_route": "ngrok"
    }
    save_req = urllib.request.Request(
        f"{base_url}/api/android-gateway/tunnel/config",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    save_res = json.loads(urllib.request.urlopen(save_req).read().decode())
    print("Save Response:", save_res)
    assert save_res.get("status") == "success", "Failed to save multi-endpoint config"
    assert save_res.get("public_https_url") == "https://upstream-evolution-gulp.ngrok-free.dev", "Mismatch in active route"

    # Verify lan-info reflects active route and all configured routes
    req2 = urllib.request.urlopen(f"{base_url}/api/android-gateway/lan-info")
    data2 = json.loads(req2.read().decode())
    print("Updated lan-info public_https_url:", data2.get("public_https_url"))
    print("Updated routes:", list(data2.get("configured_routes", {}).keys()))
    assert data2.get("public_https_url") == "https://upstream-evolution-gulp.ngrok-free.dev", "lan-info did not reflect ngrok route"
    assert "ngrok" in data2.get("configured_routes", {}), "Ngrok not in configured routes"
    assert "cloudflare" in data2.get("configured_routes", {}), "Cloudflare not in configured routes"
    assert "custom" in data2.get("configured_routes", {}), "Custom not in configured routes"
    assert "lan" in data2.get("configured_routes", {}), "LAN not in configured routes"

    print("\n[ALL MULTI-ENDPOINT ROUTING & CLOUDFLARE QUICK TESTS PASSED SUCCESSFULLY!]")

if __name__ == "__main__":
    main()
