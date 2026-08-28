import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend

# We derive a safe 32-byte url-safe base64 key from JWT_SECRET for fernet
_SECRET = os.getenv("JWT_SECRET", "nexus_super_secret_jwt_key_32_bytes_min_length_123456").encode("utf-8")
_SALT = b"nexus_os_provider_credentials_salt"

def _get_fernet() -> Fernet:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=_SALT,
        iterations=100000,
        backend=default_backend()
    )
    key = base64.urlsafe_b64encode(kdf.derive(_SECRET))
    return Fernet(key)

def encrypt_secret(plain_text: str) -> str:
    if not plain_text:
        return ""
    f = _get_fernet()
    return f.encrypt(plain_text.encode("utf-8")).decode("utf-8")

def decrypt_secret(cipher_text: str) -> str:
    if not cipher_text:
        return ""
    f = _get_fernet()
    try:
        return f.decrypt(cipher_text.encode("utf-8")).decode("utf-8")
    except Exception:
        # Fallback or invalid key
        return ""
