"""
Phase 2 Test Suite — Real Device Pairing, Token Exchange, DB Persistence & Authenticated WebSockets
Nexus Call OS v2.4 Enterprise
"""

import time
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.auth.deps import get_current_user
from backend.android_gateway.pairing_manager import PairingManager
from backend.android_gateway.device_registry import DeviceRegistry, hash_device_token
from backend.android_gateway.android_websocket_bridge import AndroidWebSocketBridgeServer
from backend.database.session import SessionLocal
from backend.models.models import CompanionDevice, Organization, User

client = TestClient(app)


class MockOrgUser:
    def __init__(self, user_id="user-p2-01", org_id="org-p2-alpha", role="admin"):
        self.id = user_id
        self.organization_id = org_id
        self.role = role


@pytest.fixture(autouse=True)
def override_auth_fixture():
    app.dependency_overrides[get_current_user] = lambda: MockOrgUser()
    yield
    app.dependency_overrides.clear()


def test_pairing_token_hmac_and_expiry():
    pm = PairingManager(secret_key="unit-test-secret-key-12345")
    token_info = pm.generate_pairing_token(
        organization_id="org-p2-alpha",
        workspace_id="ws-main",
        label="Pixel 8 Pro Tester",
        expires_in_seconds=300,
    )

    assert "pairing_token" in token_info
    assert "signature" in token_info
    assert token_info["organization_id"] == "org-p2-alpha"
    assert token_info["status"] == "pending"

    # Verification passes with correct signature
    assert pm.verify_pairing_token(token_info["pairing_token"], token_info["signature"]) is True

    # Verification fails with tampered signature
    assert pm.verify_pairing_token(token_info["pairing_token"], "bad_signature_deadbeef") is False


def test_pairing_token_exchange_and_db_persistence():
    # 1. Generate token via API
    res_gen = client.post(
        "/api/android-gateway/pair/generate-token",
        json={"label": "Samsung Galaxy S24 Ultra", "workspace_id": "workspace-01"},
    )
    assert res_gen.status_code == 200
    pdata = res_gen.json()["pairing_data"]
    pairing_token = pdata["pairing_token"]
    signature = pdata["signature"]

    # 2. Companion exchanges token for persistent device_token
    device_id = "samsung-s24-test-01"
    res_exchange = client.post(
        "/api/android-gateway/pair/exchange",
        json={
            "pairing_token": pairing_token,
            "signature": signature,
            "device_id": device_id,
            "name": "Samsung Galaxy S24 Ultra",
            "device_type": "android",
            "sim_number": "+14155552671",
            "carrier_name": "Verizon Wireless",
            "os_version": "Android 14 (OneUI 6.1)",
        },
    )
    assert res_exchange.status_code == 200
    body = res_exchange.json()
    assert body["status"] == "paired"
    assert body["device_id"] == device_id
    assert "device_token" in body
    assert body["device_token"].startswith("nxs_dev_")

    # 3. Verify Anti-Replay: Attempting to reuse same pairing token MUST fail
    res_replay = client.post(
        "/api/android-gateway/pair/exchange",
        json={
            "pairing_token": pairing_token,
            "signature": signature,
            "device_id": "duplicate-device-02",
        },
    )
    assert res_replay.status_code == 400

    # 4. Verify Persistent DB Record
    with SessionLocal() as db:
        db_rec = db.query(CompanionDevice).filter(CompanionDevice.device_id == device_id).first()
        assert db_rec is not None
        assert db_rec.name == "Samsung Galaxy S24 Ultra"
        assert db_rec.carrier_name == "Verizon Wireless"
        assert db_rec.device_token_hash == hash_device_token(body["device_token"])


from backend.routers.android_gateway_router import _device_registry as reg
from fastapi import WebSocketDisconnect

def test_authenticated_websocket_connection_and_telemetry():
    # Register device in active registry
    dev_token = "nxs_dev_super_secret_test_token_999"
    dev_id = "test-companion-ws-01"
    reg.register_device(
        device_id=dev_id,
        name="Pixel 8 Live",
        organization_id="org-p2-alpha",
        device_token=dev_token,
    )

    # 1. Connect with valid token in query param
    with client.websocket_connect(f"/api/android-gateway/ws/bridge?device_id={dev_id}&token={dev_token}") as ws:
        # Expect AUTH_SUCCESS
        auth_res = ws.receive_json()
        assert auth_res.get("event") == "AUTH_SUCCESS" or auth_res.get("type") == "AUTH_SUCCESS"

        # 2. Send Heartbeat / Telemetry frame
        ws.send_json({
            "event": "PING",
            "battery_level": 88,
            "is_charging": True,
            "signal_dbm": -68,
            "network_type": "5G SA",
            "latency_ms": 14,
        })
        pong_res = ws.receive_json()
        assert pong_res.get("type") == "PONG"

        # 3. Verify telemetry updated in registry
        dev = reg.get_device(dev_id)
        assert dev is not None
        assert dev.battery_level == 88
        assert dev.signal_dbm == -68


def test_unauthenticated_websocket_rejection():
    # Device exists in router registry but connection supplies invalid token
    reg.register_device(
        device_id="device-secure-01",
        name="Secure Phone",
        organization_id="org-p2-alpha",
        device_token="correct_token_12345",
    )

    # Connect with wrong token -> Must receive AUTH_ERROR or disconnect
    with pytest.raises(Exception):
        with client.websocket_connect("/api/android-gateway/ws/bridge?device_id=device-secure-01&token=wrong_token") as ws:
            msg = ws.receive_json()
            if msg.get("event") == "AUTH_ERROR" or msg.get("type") == "AUTH_ERROR":
                raise WebSocketDisconnect(code=4001)


def test_tenant_isolation_org_separation():
    reg.register_device(
        device_id="dev-tenant-a",
        name="Tenant A Device",
        organization_id="org-alpha-100",
        device_token="tok_alpha",
    )
    reg.register_device(
        device_id="dev-tenant-b",
        name="Tenant B Device",
        organization_id="org-beta-200",
        device_token="tok_beta",
    )

    # Authenticate as Org Alpha
    app.dependency_overrides[get_current_user] = lambda: MockOrgUser(org_id="org-alpha-100")
    res_a = client.get("/api/android-gateway/devices")
    assert res_a.status_code == 200
    devices_a = [d["device_id"] for d in res_a.json()["devices"]]
    assert "dev-tenant-a" in devices_a
    assert "dev-tenant-b" not in devices_a

    # Authenticate as Org Beta
    app.dependency_overrides[get_current_user] = lambda: MockOrgUser(org_id="org-beta-200")
    res_b = client.get("/api/android-gateway/devices")
    assert res_b.status_code == 200
    devices_b = [d["device_id"] for d in res_b.json()["devices"]]
    assert "dev-tenant-b" in devices_b
    assert "dev-tenant-a" not in devices_b

