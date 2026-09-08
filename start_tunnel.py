import subprocess
import re
import sys
import os
import json
import time
import urllib.request
from pathlib import Path

def main():
    root_dir = Path(__file__).resolve().parent
    config_file = root_dir / "backend" / ".cache" / "tunnel_config.json"
    
    cfg = {}
    if config_file.exists():
        try:
            cfg = json.loads(config_file.read_text(encoding="utf-8"))
        except Exception:
            pass
            
    active_route = cfg.get("active_route", "auto")
    ngrok_url = cfg.get("ngrok_url", "")
    ngrok_token = cfg.get("ngrok_authtoken", "")
    
    # If Ngrok is configured as active route
    if active_route == "ngrok" or (ngrok_url and active_route != "cloudflare"):
        try:
            import ngrok
            clean_domain = ngrok_url.replace("https://", "").replace("http://", "").split("/")[0].strip() if ngrok_url else ""
            print(f"Starting Ngrok Tunnel for port 3000 (domain: {clean_domain}) ...")
            if ngrok_token:
                try:
                    ngrok.set_auth_token(ngrok_token)
                except Exception:
                    pass
            kwargs = {"addr": 3000}
            if ngrok_token:
                kwargs["authtoken"] = ngrok_token
            if clean_domain:
                kwargs["domain"] = clean_domain
            listener = ngrok.forward(**kwargs)
            live_url = listener.url()
            if not live_url.startswith("https://"):
                live_url = f"https://{live_url}"
            print(f"\n=========================================")
            print(f"  LIVE NGROK PUBLIC TUNNEL READY!        ")
            print(f"  URL: {live_url}")
            print(f"=========================================\n", flush=True)
            for p in [root_dir / "public" / "tunnel_url.txt", root_dir / "tunnel_url.txt", root_dir / "backend" / ".cache" / "tunnel_url.txt"]:
                try:
                    p.parent.mkdir(parents=True, exist_ok=True)
                    p.write_text(live_url, encoding="utf-8")
                except Exception:
                    pass
            while True:
                time.sleep(2)
        except Exception as err:
            print(f"Ngrok launch notice: {err}. Falling back to Cloudflare...", flush=True)

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
    url_pattern = re.compile(r"https://([a-zA-Z0-9-]+)\.trycloudflare\.com")

    for line in proc.stdout:
        print(line, end="", flush=True)
        if not tunnel_url:
            for match in url_pattern.finditer(line):
                candidate = match.group(0)
                subdomain = match.group(1).lower()
                if subdomain not in ("api", "pkg", "update", "developers", "blog", "dash", "one"):
                    tunnel_url = candidate
                    print(f"\n=========================================")
                    print(f"  LIVE CLOUDFLARE PUBLIC TUNNEL READY!   ")
                    print(f"  URL: {tunnel_url}")
                    print(f"=========================================\n", flush=True)
                    for p in [tunnel_file, root_dir / "tunnel_url.txt", root_dir / "backend" / ".cache" / "tunnel_url.txt"]:
                        try:
                            p.write_text(tunnel_url, encoding="utf-8")
                        except Exception:
                            pass
                    break

    if tunnel_url:
        while proc.poll() is None:
            time.sleep(2)

if __name__ == "__main__":
    main()

