import asyncio
import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath("."))
from backend.main import app

client = TestClient(app)

def test_api_endpoint_all_methods():
    methods = ["POST", "PUT", "PATCH", "GET", "DELETE"]
    print("\nTesting `/api/webhooks/test-dispatch` for all HTTP Methods:")
    print("=" * 60)
    for method in methods:
        payload = {
            "endpoint_url": "https://httpbin.org/anything",
            "http_method": method,
            "auth_type": "HMAC Signature",
            "auth_secret": "test_hmac_secret_456",
            "test_event_type": "call.completed",
            "verify_ssl": True,
            "timeout_seconds": 15.0
        }
        res = client.post("/api/webhooks/test-dispatch", json=payload)
        data = res.json()
        print(f"[{method}] Router Status: {res.status_code}, Dispatch Success: {data.get('success')}, Target Status: {data.get('status_code')}, Latency: {data.get('latency_ms')}ms")

if __name__ == "__main__":
    test_api_endpoint_all_methods()
