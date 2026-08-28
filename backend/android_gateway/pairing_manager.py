"""
Pairing Manager Module
Nexus Call OS v2.4 Enterprise

Handles secure QR code pairing payload generation, pairing token issuance,
HMAC signature verification, tenant association, and anti-replay protection.
"""

import time
import secrets
import hmac
import hashlib
from typing import Dict, Any, Optional, Tuple


class PairingManager:
    """Manages secure companion device pairing tokens and QR code payloads."""

    def __init__(self, secret_key: Optional[str] = None):
        self.secret_key = secret_key or "nexus-companion-pairing-secret-key-v2.4"
        self._active_tokens: Dict[str, Dict[str, Any]] = {}

    def generate_pairing_token(
        self,
        organization_id: Optional[str] = "default-org",
        workspace_id: Optional[str] = "default-workspace",
        label: str = "Android Companion Phone",
        expires_in_seconds: int = 600,
    ) -> Dict[str, Any]:
        """Generate a secure, single-use pairing token bound to an organization and workspace."""
        token_id = f"PAIR-{secrets.token_hex(8)}"
        issued_at = int(time.time())
        expires_at = issued_at + expires_in_seconds

        payload_raw = f"{token_id}:{organization_id}:{workspace_id}:{expires_at}"
        signature = hmac.new(
            self.secret_key.encode("utf-8"),
            payload_raw.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        token_data = {
            "pairing_token": token_id,
            "organization_id": organization_id,
            "workspace_id": workspace_id,
            "label": label,
            "issued_at": issued_at,
            "expires_at": expires_at,
            "signature": signature,
            "qr_payload": {
                "server_url": "/api/android-gateway/pair/exchange",
                "ws_url": "/api/android-gateway/ws/bridge",
                "pairing_token": token_id,
                "signature": signature,
                "organization_id": organization_id,
                "workspace_id": workspace_id,
                "expires_at": expires_at,
            },
            "status": "pending",
        }

        self._active_tokens[token_id] = token_data
        return token_data

    def verify_pairing_token(self, pairing_token: str, signature: str) -> bool:
        """Verify token signature and validity without consuming."""
        token_data = self._active_tokens.get(pairing_token)
        if not token_data or token_data["status"] != "pending":
            return False

        if time.time() > token_data["expires_at"]:
            token_data["status"] = "expired"
            return False

        payload_raw = f"{pairing_token}:{token_data['organization_id']}:{token_data['workspace_id']}:{token_data['expires_at']}"
        expected_sig = hmac.new(
            self.secret_key.encode("utf-8"),
            payload_raw.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected_sig, signature):
            return False

        return True

    def consume_pairing_token(self, pairing_token: str, signature: str) -> Optional[Dict[str, Any]]:
        """Verifies signature, anti-replay state, and consumes token permanently."""
        if not self.verify_pairing_token(pairing_token, signature):
            return None

        token_data = self._active_tokens[pairing_token]
        token_data["status"] = "used"
        return token_data

    def revoke_token(self, pairing_token: str) -> bool:
        if pairing_token in self._active_tokens:
            self._active_tokens[pairing_token]["status"] = "revoked"
            return True
        return False

