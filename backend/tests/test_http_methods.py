import asyncio
import sys
import os

# Add project root to sys.path
sys.path.insert(0, os.path.abspath("."))

import pytest
from backend.services.webhook_dispatcher import test_single_webhook_dispatch as _test_single_webhook_dispatch

@pytest.mark.anyio
async def test_all_http_methods():
    methods = ["POST", "PUT", "PATCH", "GET", "DELETE"]
    print("==================================================")
    print("Testing all Webhook HTTP Methods against httpbin.org")
    print("==================================================")
    for method in methods:
        url = "https://httpbin.org/anything"
        print(f"Testing {method} -> {url} ...")
        res = await _test_single_webhook_dispatch(
            endpoint_url=url,
            http_method=method,
            auth_type="HMAC Signature",
            auth_secret="nexus_secret_test_key_123",
            test_event_type="call.completed",
            timeout_sec=15.0
        )
        print(f"[{method}] Success: {res.get('success')}, HTTP Status: {res.get('status_code')}, Latency: {res.get('latency_ms')}ms")
        if not res.get('success'):
            print(f"  Error: {res.get('error_message')}")
        print("--------------------------------------------------")

if __name__ == "__main__":
    asyncio.run(test_all_http_methods())

