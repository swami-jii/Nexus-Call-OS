"""
Automated Test Suite for Android GSM Gateway Subsystem
Nexus Call OS v2.4 Enterprise
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.auth.deps import get_current_user
from backend.android_gateway.pairing_manager import PairingManager
from backend.android_gateway.device_registry import DeviceRegistry
from backend.android_gateway.android_provider_adapter import AndroidCompanionProviderAdapter

client = TestClient(app)


class MockUser:
    id = "test-android-user"
    organization_id = "test-org-id"
    role = "super_admin"


@pytest.fixture(autouse=True)
def override_auth():
    app.dependency_overrides[get_current_user] = lambda: MockUser()
    yield
    app.dependency_overrides.clear()


def test_pairing_token_generation_and_verification():
    pm = PairingManager(secret_key="test-secret-key-998877")
    token_data = pm.generate_pairing_token(label="Pixel 8 Test Phone", expires_in_seconds=300)

    assert "pairing_token" in token_data
    assert "signature" in token_data
    assert token_data["status"] == "pending"

    # Verify and consume token
    consumed = pm.consume_pairing_token(token_data["pairing_token"], token_data["signature"])
    assert consumed is not None

    # Token cannot be re-used (anti-replay)
    is_reused_valid = pm.consume_pairing_token(token_data["pairing_token"], token_data["signature"])
    assert is_reused_valid is None



def test_device_registry_lifecycle():
    reg = DeviceRegistry()
    device = reg.register_device(
        device_id="android-test-99",
        name="Galaxy S24 Ultra",
        sim_number="+18005559999",
        carrier_name="T-Mobile",
    )

    assert device.device_id == "android-test-99"
    assert device.auto_answer is True

    # Set auto answer
    reg.set_auto_answer("android-test-99", False)

    devices = reg.list_devices()
    target = next((d for d in devices if d["device_id"] == "android-test-99"), None)
    assert target is not None
    assert target["auto_answer"] is False


import asyncio


def test_android_provider_adapter():
    from backend.routers.android_gateway_router import _device_registry
    _device_registry.register_device(
        device_id="android-test-99",
        name="Android Companion Test",
    )
    async def run():
        adapter = AndroidCompanionProviderAdapter(session_id="test_session_android_01")
        connected = await adapter.connect({"device_id": "android-test-99"})
        assert connected is True
        assert adapter.is_connected is True

        answered = await adapter.answer_call()
        assert answered is True

        hungup = await adapter.hangup()
        assert hungup is True
        assert adapter.is_connected is False

    asyncio.run(run())


def test_android_gateway_api_endpoints():
    # 1. Generate pairing token endpoint
    res_pair = client.post(
        "/api/android-gateway/pair/generate-token",
        json={"label": "Secondary Android SIM"},
    )
    assert res_pair.status_code == 200
    assert "pairing_data" in res_pair.json()

    # 2. Register/connect test device
    res_qc = client.post(
        "/api/android-gateway/devices/quick-connect",
        json={"device_id": "android-test-endpoint-01", "name": "Pixel Test Device"},
    )
    assert res_qc.status_code == 200

    # 3. List devices
    res_devs = client.get("/api/android-gateway/devices")
    assert res_devs.status_code == 200
    assert "devices" in res_devs.json()
    assert len(res_devs.json()["devices"]) >= 1

    # 4. Health telemetry endpoint
    res_health = client.get("/api/android-gateway/health")
    assert res_health.status_code == 200
    health = res_health.json()
    assert "status" in health
    assert "oem_battery_guidance" in health

