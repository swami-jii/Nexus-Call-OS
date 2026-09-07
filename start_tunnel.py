import subprocess
import re
import sys
import os
import time
import urllib.request
from pathlib import Path

def main():
    root_dir = Path(__file__).resolve().parent
    cloudflared_bin = root_dir / "cloudflared.exe"
    tunnel_file = root_dir / "public" / "tunnel_url.txt"
    tunnel_file.parent.mkdir(parents=True, exist_ok=True)

    if not cloudflared_bin.exists():
        print("ERROR: cloudflared.exe not found at", cloudflared_bin)
        sys.exit(1)

    print("Starting Cloudflare Tunnel to http://127.0.0.1:3000 ...")
    proc = subprocess.Popen(
        [str(cloudflared_bin), "tunnel", "--url", "http://127.0.0.1:3000", "--no-autoupdate"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        encoding="utf-8",
        errors="ignore",
    )

    tunnel_url = None
    url_pattern = re.compile(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com")

    for line in proc.stdout:
        print(line, end="", flush=True)
        if not tunnel_url:
            match = url_pattern.search(line)
            if match:
                tunnel_url = match.group(0)
                print(f"\n=========================================")
                print(f"  LIVE CLOUDFLARE PUBLIC TUNNEL READY!   ")
                print(f"  URL: {tunnel_url}")
                print(f"=========================================\n", flush=True)
                tunnel_file.write_text(tunnel_url, encoding="utf-8")
                break

    if tunnel_url:
        # Keep process alive and verify connectivity
        while proc.poll() is None:
            time.sleep(2)

if __name__ == "__main__":
    main()
