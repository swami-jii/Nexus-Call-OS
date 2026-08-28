import base64
import hashlib
import hmac
import json
import time
from datetime import datetime, timedelta
from typing import Any

from backend.core.config import settings


def hash_password(password: str) -> str:
    """Hashes a password using SHA-256 with salt."""
    salt = "nexus_os_salt_2026"
    return hashlib.sha256(f"{salt}:{password}".encode()).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored hash."""
    return hash_password(plain_password) == hashed_password


def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _base64url_decode(data_str: str) -> bytes:
    padding = "=" * (4 - (len(data_str) % 4))
    return base64.urlsafe_b64decode(data_str + padding)


def create_access_token(
    subject: str | Any,
    expires_delta: timedelta | None = None,
    roles: list | None = None,
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": str(subject),
        "exp": int(expire.timestamp()),
        "iat": int(datetime.utcnow().timestamp()),
        "roles": roles or ["operator"],
        "type": "access",
    }

    encoded_header = _base64url_encode(json.dumps(header).encode("utf-8"))
    encoded_payload = _base64url_encode(json.dumps(payload).encode("utf-8"))

    signing_input = f"{encoded_header}.{encoded_payload}".encode()
    signature = hmac.new(
        settings.JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256
    ).digest()
    encoded_signature = _base64url_encode(signature)

    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"


def create_refresh_token(
    subject: str | Any, expires_delta: timedelta | None = None
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": str(subject),
        "exp": int(expire.timestamp()),
        "iat": int(datetime.utcnow().timestamp()),
        "type": "refresh",
    }

    encoded_header = _base64url_encode(json.dumps(header).encode("utf-8"))
    encoded_payload = _base64url_encode(json.dumps(payload).encode("utf-8"))

    signing_input = f"{encoded_header}.{encoded_payload}".encode()
    signature = hmac.new(
        settings.JWT_REFRESH_SECRET.encode("utf-8"), signing_input, hashlib.sha256
    ).digest()
    encoded_signature = _base64url_encode(signature)

    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"


def decode_token(token: str, is_refresh: bool = False) -> dict[str, Any] | None:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None

        encoded_header, encoded_payload, encoded_signature = parts
        signing_input = f"{encoded_header}.{encoded_payload}".encode()

        secret = settings.JWT_REFRESH_SECRET if is_refresh else settings.JWT_SECRET
        expected_sig = _base64url_encode(
            hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
        )

        if not hmac.compare_digest(encoded_signature, expected_sig):
            return None

        payload = json.loads(_base64url_decode(encoded_payload).decode("utf-8"))

        if payload.get("exp", 0) < time.time():
            return None

        return payload
    except Exception:
        return None
