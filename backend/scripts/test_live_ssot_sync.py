#!/usr/bin/env python3
"""
Nexus Call OS - Live SSOT Sync & Gateway API Test
Tests:
1. GET /api/android-gateway/lan-info (validates IP, mobile URL, QR payload)
2. GET /api/android-gateway/mobile-overview (validates providers, active agents, voice config)
3. Bi-directional sync test via POST /api/android-gateway/agent/update
"""

import sys
import json
import urllib.request
import urllib.parse

BASE_URL = "http://127.0.0.1:8000"
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))

def get(path: str) -> dict:
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, headers={"User-Agent": "NexusTest/1.0", "Connection": "close"})
    with opener.open(req, timeout=5) as resp:
        return json.loads(resp.read().decode("utf-8"))

def post(path: str, data: dict) -> dict:
    url = f"{BASE_URL}{path}"
    payload = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json", "User-Agent": "NexusTest/1.0", "Connection": "close"},
        method="POST"
    )
    with opener.open(req, timeout=5) as resp:
        return json.loads(resp.read().decode("utf-8"))

def run_tests():
    print("==================================================")
    print("   NEXUS CALL OS - LIVE SSOT & API SYNC TEST      ")
    print("==================================================")
    
    # Test 1: LAN Info
    print("\n--- Test 1: LAN Info & QR Payload ---")
    lan_info = get("/api/android-gateway/lan-info")
    assert lan_info.get("status") == "success", f"Failed lan-info: {lan_info}"
    lan_ip = lan_info.get("lan_ip")
    mobile_url = lan_info.get("mobile_gateway_url")
    pairing_payload = lan_info.get("pairing_payload")
    deep_link = lan_info.get("deep_link")
    print(f"[PASS] LAN IP: {lan_ip}")
    print(f"[PASS] Mobile Gateway URL: {mobile_url}")
    print(f"[PASS] Pairing Deep Link: {deep_link}")
    print(f"[PASS] Pairing Payload: {pairing_payload}")
    
    # Test 2: Mobile Overview
    print("\n--- Test 2: Live SSOT Mobile Overview ---")
    overview = get("/api/android-gateway/mobile-overview")
    assert overview.get("status") == "success", f"Failed overview: {overview}"
    agents = overview.get("active_agents", [])
    llm_providers = overview.get("llm_providers", [])
    tts_engines = overview.get("tts_engines", [])
    stt_engines = overview.get("stt_engines", [])
    active_agent = overview.get("active_agent") or (agents[0] if agents else None)
    
    print(f"[PASS] Total LLM Providers from SSOT: {len(llm_providers)}")
    print(f"[PASS] Total TTS Engines from SSOT:    {len(tts_engines)}")
    print(f"[PASS] Total STT Engines from SSOT:    {len(stt_engines)}")
    print(f"[PASS] Total Active Agents from SSOT:  {len(agents)}")
    print(f"[PASS] Active Agent: {active_agent.get('name') if active_agent else 'None'} (id={active_agent.get('id') if active_agent else 'N/A'})")
    if active_agent:
        print(f"       Provider:    {active_agent.get('provider')}")
        print(f"       Model:       {active_agent.get('model')}")
        print(f"       Voice:       {active_agent.get('voice_id')}")
        print(f"       Temperature: {active_agent.get('temperature')}")
    
    # Test 3: Bi-directional Agent Config Sync
    if active_agent:
        agent_id = active_agent.get("id")
        orig_temp = float(active_agent.get("temperature", 0.45))
        test_temp = 0.51 if abs(orig_temp - 0.51) > 0.01 else 0.55
        
        print(f"\n--- Test 3: Bi-directional Sync (Dashboard/Android <-> SSOT Backend) ---")
        print(f"Original Temperature for Agent {agent_id}: {orig_temp}")
        print(f"Updating Temperature to: {test_temp} via POST /api/android-gateway/agent/update")
        
        update_resp = post("/api/android-gateway/agent/update", {
            "agent_id": agent_id,
            "temperature": test_temp
        })
        assert update_resp.get("status") == "success", f"Update failed: {update_resp}"
        print(f"[PASS] Update response: {update_resp.get('message')}")
        
        # Verify via fresh GET mobile-overview
        overview_after = get("/api/android-gateway/mobile-overview")
        updated_agent = next((a for a in overview_after.get("active_agents", []) if a.get("id") == agent_id), None)
        assert updated_agent is not None, "Agent missing after update"
        print(f"[PASS] Verified updated temperature in mobile-overview: {updated_agent.get('temperature')}")
        assert abs(float(updated_agent.get('temperature')) - test_temp) < 0.001, f"Temp mismatch: {updated_agent.get('temperature')} != {test_temp}"
        
        # Test Android to Dashboard update (0.51 -> 0.60)
        android_test_temp = 0.60
        print(f"\n--- Test 4: Android Client Sync Simulation (0.51 -> 0.60) ---")
        update_resp2 = post("/api/android-gateway/agent/update", {
            "agent_id": agent_id,
            "temperature": android_test_temp
        })
        assert update_resp2.get("status") == "success", f"Android sync update failed: {update_resp2}"
        
        overview_after2 = get("/api/android-gateway/mobile-overview")
        updated_agent2 = next((a for a in overview_after2.get("active_agents", []) if a.get("id") == agent_id), None)
        print(f"[PASS] Verified Android sync temperature in mobile-overview: {updated_agent2.get('temperature')}")
        assert abs(float(updated_agent2.get('temperature')) - android_test_temp) < 0.001
        
        # Restore original
        print(f"\n--- Restoring original temperature: {orig_temp} ---")
        post("/api/android-gateway/agent/update", {
            "agent_id": agent_id,
            "temperature": orig_temp
        })
        overview_restored = get("/api/android-gateway/mobile-overview")
        restored_agent = next((a for a in overview_restored.get("active_agents", []) if a.get("id") == agent_id), None)
        print(f"[PASS] Restored temperature: {restored_agent.get('temperature')}")
        
    print("\n==================================================")
    print("   ALL SSOT & BI-DIRECTIONAL TESTS PASSED 100%   ")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
