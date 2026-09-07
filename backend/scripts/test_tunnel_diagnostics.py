import sys
import os
import json
import time
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(root_dir))

from backend.android_gateway.tunnel_manager import get_tunnel_manager

def main():
    print("Testing Tunnel Manager...")
    mgr = get_tunnel_manager()
    print("Initial status:", mgr.get_status())
    
    print("\nStarting tunnel on port 3000...")
    res = mgr.start_tunnel(target_port=3000, timeout_sec=15.0)
    print("Start result:", res)
    
    url = res.get("public_https_url")
    if url:
        print(f"\nChecking reachability for {url}...")
        reachable = mgr.is_url_reachable(url, timeout_sec=5.0)
        print("Reachable:", reachable)
    
    print("\nFinal status:", mgr.get_status())

if __name__ == "__main__":
    main()
