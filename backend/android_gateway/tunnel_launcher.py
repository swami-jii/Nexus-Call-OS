"""
Nexus Call OS - Production In-Process Native Tunnel Daemon
Executes headless native tunnels (Ngrok SDK, Cloudflare) with zero external blocked binaries.
"""

import argparse
import asyncio
import json
import logging
import os
import socket
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Dict, Optional

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

try:
    import ngrok  # type: ignore
except ImportError:
    ngrok = None  # type: ignore

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("NexusTunnelLauncher")


def run_ngrok(authtoken: str, domain: str, port: int) -> None:
    """Spawns an in-process native Ngrok tunnel forwarder."""
    if ngrok is None:
        logger.error("The 'ngrok' Python package is not installed.")
        return

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    if authtoken:
        try:
            if hasattr(ngrok, "set_auth_token"):
                ngrok.set_auth_token(authtoken)
        except Exception as e:
            logger.warning("Error setting auth token: %s", e)

    clean_domain = domain.replace("https://", "").replace("http://", "").split("/")[0].strip() if domain else ""
    kwargs: Dict[str, Any] = {"addr": port}
    if authtoken:
        kwargs["authtoken"] = authtoken
    if clean_domain:
        kwargs["domain"] = clean_domain

    logger.info("Establishing in-process native Ngrok forward for port %d (domain: %s)...", port, clean_domain)
    try:
        listener = ngrok.forward(**kwargs)
        live_url = listener.url() if hasattr(listener, "url") else str(listener)
        if live_url and not live_url.startswith("https://"):
            live_url = f"https://{live_url}"

        logger.info("NGROK_LIVE_URL: %s", live_url)

        # Write to cached files
        for p in [PROJECT_ROOT / "tunnel_url.txt", PROJECT_ROOT / "public" / "tunnel_url.txt", PROJECT_ROOT / "backend" / ".cache" / "tunnel_url.txt"]:
            try:
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_text(live_url, encoding="utf-8")
            except Exception:
                pass

        # Keep loop running forever
        loop.run_forever()
    except Exception as e:
        logger.error("Failed to forward Ngrok tunnel: %s", e)


def main() -> None:
    parser = argparse.ArgumentParser(description="Nexus Call OS Tunnel Launcher")
    parser.add_argument("--provider", choices=["ngrok"], required=True)
    parser.add_argument("--authtoken", default="")
    parser.add_argument("--domain", default="")
    parser.add_argument("--port", type=int, default=3000)
    args = parser.parse_args()

    if args.provider == "ngrok":
        run_ngrok(args.authtoken, args.domain, args.port)


if __name__ == "__main__":
    main()

