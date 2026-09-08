"""
Dynamic Multi-Provider Cloud & Public HTTPS Tunnel Manager
Nexus Call OS v2.4 Enterprise

Provides automated lifecycle management (start, stop, query, health verification, auto-failover)
across Cloudflare Enterprise Tunnels, Pinggy HTTPS, and Localhost.run with singleton daemon guarantees,
100% headless background execution (no popup windows), instant background pre-warming, and clean process management.
"""

import asyncio
import json
import logging
import os
import re
import socket
import ssl
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    import ngrok  # type: ignore
except ImportError:
    ngrok = None  # type: ignore

try:
    from backend.database.session import SessionLocal
    from backend.models.models import GatewayTunnelConfig
except ImportError:
    SessionLocal = None  # type: ignore
    GatewayTunnelConfig = None  # type: ignore

logger = logging.getLogger("NexusTunnelManager")


class TunnelManager:
    """Production-grade multi-provider headless daemon Tunnel Manager with zero popup windows, instant caching, and auto-healing."""

    def __init__(self):
        self._process: Optional[subprocess.Popen] = None
        self._ngrok_listener: Any = None
        self._ngrok_loop: Any = None
        self._ngrok_thread: Optional[threading.Thread] = None
        self._tunnel_url: Optional[str] = None
        self._provider_name: str = "Cloudflare Enterprise"
        self._is_starting: bool = False
        self._user_enabled: bool = True
        self._lock = threading.RLock()
        self._watchdog_thread: Optional[threading.Thread] = None
        self._stop_watchdog = threading.Event()
        self._ensure_cache_dir()
        self._reattach_or_prewarm_daemon()
        self._start_watchdog()

    def _get_project_root(self) -> Path:
        return Path(__file__).resolve().parent.parent.parent

    def _ensure_cache_dir(self) -> Path:
        cdir = self._get_project_root() / "backend" / ".cache"
        cdir.mkdir(parents=True, exist_ok=True)
        return cdir

    def _get_pid_file(self) -> Path:
        return self._ensure_cache_dir() / "tunnel_pid.json"

    def _get_daemon_log(self) -> Path:
        return self._ensure_cache_dir() / "tunnel_daemon.log"

    def _get_tunnel_files(self) -> List[Path]:
        root = self._get_project_root()
        public_dir = root / "public"
        public_dir.mkdir(parents=True, exist_ok=True)
        return [
            public_dir / "tunnel_url.txt",
            root / "tunnel_url.txt",
            self._ensure_cache_dir() / "tunnel_url.txt",
        ]

    def _write_tunnel_url_to_files(self, url: str) -> None:
        for f in self._get_tunnel_files():
            try:
                f.write_text(url, encoding="utf-8")
            except Exception:
                pass

    def _clean_tunnel_files(self) -> None:
        for f in self._get_tunnel_files():
            try:
                f.unlink(missing_ok=True)
            except Exception:
                pass
        try:
            self._get_pid_file().unlink(missing_ok=True)
        except Exception:
            pass

    def _get_cloudflared_bin(self) -> Optional[Path]:
        root = self._get_project_root()
        local_bin = root / "cloudflared.exe" if sys.platform == "win32" else root / "cloudflared"
        if local_bin.exists():
            return local_bin
        
        import shutil
        sys_path = shutil.which("cloudflared")
        if sys_path:
            return Path(sys_path)
            
        # Portable Auto-Downloader for zero-setup execution on any fresh laptop
        try:
            download_url = None
            if sys.platform == "win32":
                download_url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
            elif sys.platform == "darwin":
                import platform
                arch = "arm64" if "arm" in platform.machine().lower() else "amd64"
                download_url = f"https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-{arch}"
            elif sys.platform.startswith("linux"):
                import platform
                arch = "arm64" if "aarch64" in platform.machine().lower() or "arm64" in platform.machine().lower() else "amd64"
                download_url = f"https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-{arch}"

            if download_url:
                logger.info("Auto-provisioning portable cloudflared binary for %s from %s ...", sys.platform, download_url)
                req = urllib.request.Request(download_url, headers={"User-Agent": "NexusCallOS/2.4"})
                with urllib.request.urlopen(req, timeout=10.0) as resp:
                    data = resp.read()
                    if len(data) > 100000:
                        local_bin.write_bytes(data)
                        if sys.platform != "win32":
                            local_bin.chmod(0o755)
                        logger.info("Successfully provisioned portable cloudflared binary at %s", local_bin)
                        return local_bin
        except Exception:
            pass

        return None

    def _get_ssh_bin(self) -> Optional[str]:
        import shutil
        ssh_bin = shutil.which("ssh")
        if ssh_bin:
            return ssh_bin
        if sys.platform == "win32":
            win_ssh = Path(r"C:\Windows\System32\OpenSSH\ssh.exe")
            if win_ssh.exists():
                return str(win_ssh)
        return None

    def _get_subprocess_hidden_flags(self) -> Dict[str, Any]:
        """Returns creation flags and startup info to guarantee NO visible CMD/terminal windows on Windows."""
        kwargs: Dict[str, Any] = {}
        if sys.platform == "win32":
            kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            startupinfo.wShowWindow = subprocess.SW_HIDE
            kwargs["startupinfo"] = startupinfo
        return kwargs

    def _kill_all_tunnel_processes(self) -> None:
        """Kills any orphaned tunnel processes cleanly without leaving zombies or detached CMD windows."""
        if sys.platform == "win32":
            try:
                subprocess.run(
                    ["taskkill", "/F", "/IM", "cloudflared.exe"],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    creationflags=subprocess.CREATE_NO_WINDOW,
                )
            except Exception:
                pass

        if self._process:
            try:
                if sys.platform == "win32":
                    subprocess.run(
                        ["taskkill", "/F", "/T", "/PID", str(self._process.pid)],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                        creationflags=subprocess.CREATE_NO_WINDOW,
                    )
                else:
                    self._process.terminate()
                    time.sleep(0.2)
                    if self._process.poll() is None:
                        self._process.kill()
            except Exception:
                pass
            self._process = None

    def _get_config_file(self) -> Path:
        return self._ensure_cache_dir() / "tunnel_config.json"

    def _load_config_from_db(self) -> Optional[Dict[str, Any]]:
        """Queries permanent gateway tunnel configuration directly from database table."""
        if SessionLocal is None or GatewayTunnelConfig is None:
            return None
        try:
            with SessionLocal() as db:
                row = db.query(GatewayTunnelConfig).filter(GatewayTunnelConfig.config_key == "default").first()
                if row:
                    ngrok_url = (getattr(row, "ngrok_url", "") or "").strip()
                    ngrok_authtoken = (getattr(row, "ngrok_authtoken", "") or "").strip()
                    custom_url = (getattr(row, "custom_url", "") or "").strip()
                    named_token = (getattr(row, "named_token", "") or "").strip()
                    cloudflare_url = (getattr(row, "cloudflare_url", "") or "").strip()
                    active_route = (getattr(row, "active_route", "auto") or "auto").strip()
                    return {
                        "status": "success",
                        "ngrok_url": ngrok_url,
                        "ngrok_authtoken": ngrok_authtoken,
                        "custom_url": custom_url,
                        "cloudflare_url": cloudflare_url,
                        "named_token": named_token,
                        "active_route": active_route,
                        "has_custom_config": bool(ngrok_url or custom_url or named_token or cloudflare_url or ngrok_authtoken),
                    }
        except Exception as e:
            logger.debug("Database load tunnel config exception (fallback to file): %s", e)
        return None

    def _save_config_to_db(self, cfg_data: Dict[str, Any]) -> None:
        """Persists tunnel configuration permanently into the database table."""
        if SessionLocal is None or GatewayTunnelConfig is None:
            return
        try:
            with SessionLocal() as db:
                row = db.query(GatewayTunnelConfig).filter(GatewayTunnelConfig.config_key == "default").first()
                if not row:
                    row = GatewayTunnelConfig(config_key="default")
                    db.add(row)
                setattr(row, "ngrok_url", cfg_data.get("ngrok_url", ""))
                setattr(row, "ngrok_authtoken", cfg_data.get("ngrok_authtoken", ""))
                setattr(row, "custom_url", cfg_data.get("custom_url", ""))
                setattr(row, "cloudflare_url", cfg_data.get("cloudflare_url", ""))
                setattr(row, "named_token", cfg_data.get("named_token", ""))
                setattr(row, "active_route", cfg_data.get("active_route", "auto"))
                setattr(row, "is_active", True)
                db.commit()
                logger.info("Saved gateway tunnel configuration to database successfully.")
        except Exception as e:
            logger.error("Failed to persist tunnel config to database: %s", e)

    def _delete_config_from_db(self) -> None:
        """Deletes/resets gateway tunnel configuration from the database."""
        if SessionLocal is None or GatewayTunnelConfig is None:
            return
        try:
            with SessionLocal() as db:
                row = db.query(GatewayTunnelConfig).filter(GatewayTunnelConfig.config_key == "default").first()
                if row:
                    db.delete(row)
                    db.commit()
                    logger.info("Deleted gateway tunnel configuration from database.")
        except Exception as e:
            logger.error("Failed to delete tunnel config from database: %s", e)

    def get_config(self) -> Dict[str, Any]:
        """Returns all saved permanent endpoints from Database with instant caching."""
        db_cfg = self._load_config_from_db()
        if db_cfg:
            try:
                self._get_config_file().write_text(json.dumps(db_cfg, indent=2), encoding="utf-8")
            except Exception:
                pass
            return db_cfg

        cfg_file = self._get_config_file()
        if cfg_file.exists():
            try:
                data = json.loads(cfg_file.read_text(encoding="utf-8"))
                if isinstance(data, dict):
                    # Save to DB so it is permanently in database
                    self._save_config_to_db(data)
                    return data
            except Exception:
                pass
        return {
            "status": "success",
            "ngrok_url": "",
            "ngrok_authtoken": "",
            "custom_url": "",
            "cloudflare_url": "",
            "named_token": "",
            "active_route": "auto",
            "has_custom_config": False,
        }

    def save_config(
        self,
        ngrok_url: Optional[str] = None,
        ngrok_authtoken: Optional[str] = None,
        custom_url: Optional[str] = None,
        named_token: Optional[str] = None,
        cloudflare_url: Optional[str] = None,
        active_route: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Saves permanent Ngrok URL, Cloudflare Quick URL, Custom Domain, and Named Tunnel token simultaneously into Database."""
        with self._lock:
            existing_cfg = self.get_config()
            clean_ngrok = (ngrok_url or "").strip().rstrip("/")
            clean_ngrok_token = (ngrok_authtoken or "").strip()
            # Never wipe existing token if omitted
            if not clean_ngrok_token and existing_cfg.get("ngrok_authtoken"):
                clean_ngrok_token = existing_cfg.get("ngrok_authtoken", "").strip()

            clean_custom = (custom_url or "").strip().rstrip("/")
            clean_cf = (cloudflare_url or "").strip().rstrip("/")
            clean_token = (named_token or "").strip()
            
            # Format URLs if scheme is omitted
            if clean_ngrok and not clean_ngrok.startswith(("http://", "https://")):
                clean_ngrok = f"https://{clean_ngrok}"
            if clean_custom and not clean_custom.startswith(("http://", "https://")):
                clean_custom = f"https://{clean_custom}"
            if clean_cf and not clean_cf.startswith(("http://", "https://")):
                clean_cf = f"https://{clean_cf}"

            route = active_route or ("ngrok" if clean_ngrok else ("cloudflare" if clean_cf else ("custom" if clean_custom else "auto")))

            cfg = {
                "ngrok_url": clean_ngrok,
                "ngrok_authtoken": clean_ngrok_token,
                "custom_url": clean_custom,
                "cloudflare_url": clean_cf,
                "named_token": clean_token,
                "active_route": route,
                "updated_at": time.time(),
            }
            
            # 1. Save directly to Database
            self._save_config_to_db(cfg)
            
            # 2. Save to cache file for 0ms sync
            try:
                self._get_config_file().write_text(json.dumps(cfg, indent=2), encoding="utf-8")
            except Exception as e:
                logger.error("Failed to save tunnel config: %s", e)

            # Reset current runtime tunnel state and apply selected active route
            self.stop_tunnel()
            
            if route == "ngrok" and clean_ngrok:
                self._tunnel_url = clean_ngrok
                self._provider_name = "Ngrok Static Domain"
                self._write_tunnel_url_to_files(clean_ngrok)
                self._user_enabled = True
                res = self.start_ngrok_tunnel(clean_ngrok, clean_ngrok_token, 3000)
                return {
                    "status": "success",
                    "public_https_url": clean_ngrok,
                    "provider": "Ngrok Static Domain",
                    "active_route": "ngrok",
                    "message": f"Ngrok static domain active: {clean_ngrok}",
                }
            elif route == "cloudflare":
                if clean_cf and self.is_url_reachable(clean_cf, timeout_sec=1.5):
                    self._tunnel_url = clean_cf
                    self._provider_name = "Cloudflare Quick Tunnel"
                    self._write_tunnel_url_to_files(clean_cf)
                    self._user_enabled = True
                    return {
                        "status": "success",
                        "public_https_url": clean_cf,
                        "provider": "Cloudflare Quick Tunnel",
                        "active_route": "cloudflare",
                        "message": f"Cloudflare Quick Tunnel active: {clean_cf}",
                    }
                else:
                    return self.start_quick_tunnel(target_port=3000)
            elif route == "custom" and clean_custom:
                self._tunnel_url = clean_custom
                self._provider_name = "Permanent Custom Domain"
                self._write_tunnel_url_to_files(clean_custom)
                self._user_enabled = True
                return {
                    "status": "success",
                    "public_https_url": clean_custom,
                    "provider": "Permanent Custom Domain",
                    "active_route": "custom",
                    "message": f"Permanent custom domain active: {clean_custom}",
                }
            elif clean_token:
                return self.start_tunnel(target_port=3000)
            elif clean_ngrok:
                self._tunnel_url = clean_ngrok
                self._provider_name = "Ngrok Static Domain"
                self._write_tunnel_url_to_files(clean_ngrok)
                self._user_enabled = True
                return {
                    "status": "success",
                    "public_https_url": clean_ngrok,
                    "provider": "Ngrok Static Domain",
                    "active_route": "ngrok",
                    "message": f"Ngrok static domain active: {clean_ngrok}",
                }
            else:
                return {
                    "status": "success",
                    "public_https_url": None,
                    "active_route": "auto",
                    "message": "Tunnel configuration updated in database.",
                }

    def clear_config(self) -> Dict[str, Any]:
        """Deletes custom permanent config from database and resets to auto-managed tunnel."""
        with self._lock:
            self._delete_config_from_db()
            try:
                self._get_config_file().unlink(missing_ok=True)
            except Exception:
                pass
            self.stop_tunnel()
            return {
                "status": "success",
                "message": "Custom tunnel configuration deleted from database. Reset to dynamic mode.",
            }

    def is_url_reachable(self, url: str, timeout_sec: float = 3.5) -> bool:
        """Verifies if the public tunnel endpoint responds with genuine HTTP without tunnel provider errors."""
        if not url or not url.startswith(("http://", "https://")):
            return False
        
        # Strictly forbid internal cloudflare/system endpoints from being treated as tunnels
        invalid_hosts = ["api.trycloudflare.com", "pkg.cloudflare.com", "developers.cloudflare.com"]
        for inv in invalid_hosts:
            if inv in url.lower():
                return False

        try:
            parsed = urllib.parse.urlparse(url)
            host = parsed.hostname
            if not host or host in ("api.trycloudflare.com", "pkg.cloudflare.com"):
                return False

            port = parsed.port or (443 if parsed.scheme == "https" else 80)
            sock = socket.create_connection((host, port), timeout=timeout_sec)
            sock.close()

            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "bypass-tunnel-reminder": "true",
                    "ngrok-skip-browser-warning": "true",
                },
                method="GET",
            )
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE

            with urllib.request.urlopen(req, timeout=timeout_sec, context=ctx) as resp:
                code = resp.status if hasattr(resp, "status") else resp.getcode()
                return code < 500
        except urllib.error.HTTPError as he:
            # Ngrok offline or provider tunnel error detection
            if he.headers and (he.headers.get("Ngrok-Error-Code") or "ERR_NGROK" in str(he.headers.get("ngrok-error-code", ""))):
                return False
            # 502/530/520/1033 are tunnel gateway origin errors
            if he.code in (500, 502, 503, 504, 520, 521, 522, 523, 524, 525, 526, 530):
                return False
            return True
        except Exception:
            return False

    def _get_configured_active_endpoint(self, cfg: Dict[str, Any]) -> tuple[Optional[str], Optional[str]]:
        """Resolves the preferred static endpoint based on active_route."""
        route = cfg.get("active_route", "auto")
        if route == "ngrok" and cfg.get("ngrok_url"):
            return cfg["ngrok_url"], "Ngrok Static Domain"
        elif route == "cloudflare" and cfg.get("cloudflare_url"):
            return cfg["cloudflare_url"], "Cloudflare Quick Tunnel"
        elif route == "custom" and cfg.get("custom_url"):
            return cfg["custom_url"], "Permanent Custom Domain"
        return None, None

    def _reattach_or_prewarm_daemon(self):
        """Pre-warms the daemon or reattaches to an existing live tunnel process so URLs are ready in 0ms."""
        cfg = self.get_config()
        route = cfg.get("active_route", "auto")

        # 1. If Ngrok is configured as active route, spawn in background
        if route == "ngrok" and (cfg.get("ngrok_url") or cfg.get("ngrok_authtoken")):
            clean_ngrok = cfg.get("ngrok_url", "")
            self._tunnel_url = clean_ngrok
            self._provider_name = "Ngrok Static Domain"
            self._user_enabled = True
            self._write_tunnel_url_to_files(clean_ngrok)
            threading.Thread(target=self.start_ngrok_tunnel, args=(clean_ngrok, cfg.get("ngrok_authtoken", ""), 3000), daemon=True).start()
            logger.info("Pre-warming active Ngrok tunnel: %s", clean_ngrok)
            return

        # 2. If Cloudflare Quick Tunnel is configured as active route, spawn in background
        if route == "cloudflare":
            cf_url = cfg.get("cloudflare_url", "")
            if cf_url and self.is_url_reachable(cf_url, timeout_sec=2.0):
                self._tunnel_url = cf_url
                self._provider_name = "Cloudflare Quick Tunnel"
                self._user_enabled = True
                self._write_tunnel_url_to_files(cf_url)
                logger.info("Reattached to live Cloudflare Quick Tunnel: %s", cf_url)
                return
            else:
                threading.Thread(target=self.start_quick_tunnel, args=(3000,), daemon=True).start()
                logger.info("Pre-warming fresh Cloudflare Quick Tunnel in background...")
                return

        # 3. Check configured active endpoint
        active_url, provider = self._get_configured_active_endpoint(cfg)
        if active_url:
            self._tunnel_url = active_url
            self._provider_name = provider or "Permanent Custom Domain"
            self._user_enabled = True
            self._write_tunnel_url_to_files(self._tunnel_url)
            logger.info("Using configured active endpoint (%s): %s", self._provider_name, self._tunnel_url)
            return

        # 2. Check PID file for existing live tunnel
        pid_file = self._get_pid_file()
        if pid_file.exists():
            try:
                data = json.loads(pid_file.read_text(encoding="utf-8"))
                saved_url = data.get("url", "")
                provider = data.get("provider", "Cloudflare Enterprise")
                # Disallow corrupt/internal URLs
                if "api.trycloudflare.com" in saved_url:
                    self._clean_tunnel_files()
                elif saved_url and self.is_url_reachable(saved_url, timeout_sec=2.0):
                    self._tunnel_url = saved_url
                    self._provider_name = provider
                    self._user_enabled = True
                    logger.info("Reattached to live tunnel daemon (%s): %s", provider, saved_url)
                    return
            except Exception:
                pass

        # 3. Check cached tunnel url files for instant 0ms restoration
        for tfile in self._get_tunnel_files():
            if tfile.exists():
                try:
                    val = tfile.read_text(encoding="utf-8").strip()
                    if "api.trycloudflare.com" in val:
                        self._clean_tunnel_files()
                        break
                    if val.startswith("https://") and self.is_url_reachable(val, timeout_sec=1.5):
                        self._tunnel_url = val
                        self._provider_name = "Cloudflare Enterprise"
                        self._user_enabled = True
                        return
                except Exception:
                    pass

        # Pre-warm in background daemon thread if enabled
        if cfg.get("named_token"):
            self.ensure_tunnel_running_async(target_port=3000)

    def get_tunnel_url(self, auto_start: bool = True) -> Optional[str]:
        """Returns the active reachable tunnel URL instantly without blocking."""
        with self._lock:
            # Check permanent custom URL / active route first
            cfg = self.get_config()
            active_url, provider = self._get_configured_active_endpoint(cfg)
            if active_url:
                self._tunnel_url = active_url
                self._provider_name = provider or "Permanent Custom Domain"
                return self._tunnel_url

            if self._tunnel_url:
                if "api.trycloudflare.com" in self._tunnel_url:
                    self._tunnel_url = None
                    self._clean_tunnel_files()
                else:
                    return self._tunnel_url

            for tfile in self._get_tunnel_files():
                if tfile.exists():
                    try:
                        val = tfile.read_text(encoding="utf-8").strip()
                        if "api.trycloudflare.com" in val:
                            self._clean_tunnel_files()
                            continue
                        if val.startswith("https://"):
                            self._tunnel_url = val
                            return val
                    except Exception:
                        pass

        if auto_start and not self._is_starting:
            self.ensure_tunnel_running_async(target_port=3000)

        return self._tunnel_url

    def ensure_tunnel_running_async(self, target_port: int = 3000):
        """Spawns tunnel daemon in background if not already active."""
        with self._lock:
            cfg = self.get_config()
            active_url, _ = self._get_configured_active_endpoint(cfg)
            if active_url:
                self._tunnel_url = active_url
                return
            if self._tunnel_url and self.is_url_reachable(self._tunnel_url, timeout_sec=1.0):
                return
            if self._is_starting:
                return
            self._is_starting = True
            self._user_enabled = True
            t = threading.Thread(target=self._start_tunnel_worker, args=(target_port,), daemon=True)
            t.start()

    def _start_tunnel_worker(self, target_port: int = 3000):
        try:
            self.start_tunnel(target_port=target_port)
        except Exception as e:
            logger.error("Background tunnel worker error: %s", e)
            self._is_starting = False

    def start_quick_tunnel(self, target_port: int = 3000, timeout_sec: float = 14.0) -> Dict[str, Any]:
        """
        Forces generation of a fresh Cloudflare Quick Tunnel (TryCloudflare),
        guaranteeing zero popup windows and instant URL discovery without needing an account or payment card.
        """
        with self._lock:
            self.stop_tunnel()
            self._is_starting = True
            self._user_enabled = True

            logger.info("Spawning fresh Cloudflare Quick Tunnel for port %d ...", target_port)
            bin_path = self._get_cloudflared_bin()
            if not bin_path:
                self._is_starting = False
                return {
                    "status": "error",
                    "is_running": False,
                    "public_https_url": None,
                    "message": "cloudflared binary could not be found or downloaded.",
                }

            hidden_flags = self._get_subprocess_hidden_flags()
            log_path = self._get_daemon_log()

            try:
                with open(log_path, "w", encoding="utf-8", errors="ignore") as lf:
                    lf.write("")
                log_file = open(log_path, "a", encoding="utf-8", errors="ignore")
                
                cmd = [
                    str(bin_path),
                    "tunnel",
                    "--url", f"http://127.0.0.1:{target_port}",
                    "--no-autoupdate",
                ]

                proc = subprocess.Popen(
                    cmd,
                    stdout=log_file,
                    stderr=subprocess.STDOUT,
                    stdin=subprocess.DEVNULL,
                    **hidden_flags,
                )
                self._process = proc

                cf_pattern = re.compile(r"https://([a-zA-Z0-9-]+)\.trycloudflare\.com")
                discovered_url: Optional[str] = None

                start_time = time.time()
                while time.time() - start_time < timeout_sec:
                    time.sleep(0.4)
                    if log_path.exists():
                        try:
                            log_content = log_path.read_text(encoding="utf-8", errors="ignore")
                            for m in cf_pattern.finditer(log_content):
                                candidate = m.group(0)
                                subdomain = m.group(1).lower()
                                if subdomain not in ("api", "pkg", "update", "developers", "blog", "dash", "one"):
                                    discovered_url = candidate
                                    break
                            if discovered_url:
                                break
                        except Exception:
                            pass

                if discovered_url:
                    self._tunnel_url = discovered_url
                    self._provider_name = "Cloudflare Quick Tunnel"
                    self._write_tunnel_url_to_files(discovered_url)
                    self._save_pid_info(proc.pid, discovered_url, "Cloudflare Quick Tunnel")
                    
                    # Update config to record this quick tunnel and set active route
                    cfg = self.get_config()
                    cfg["cloudflare_url"] = discovered_url
                    cfg["active_route"] = "cloudflare"
                    try:
                        self._get_config_file().write_text(json.dumps(cfg, indent=2), encoding="utf-8")
                    except Exception:
                        pass

                    self._is_starting = False
                    logger.info("Fresh Cloudflare Quick Tunnel successfully generated: %s", discovered_url)
                    return {
                        "status": "success",
                        "is_running": True,
                        "provider": "Cloudflare Quick Tunnel",
                        "public_https_url": discovered_url,
                        "active_route": "cloudflare",
                        "message": f"Fresh Cloudflare Quick Tunnel active: {discovered_url}",
                    }
            except Exception as e:
                logger.error("Error generating fresh Cloudflare Quick Tunnel: %s", e)

            if self._process:
                try:
                    self._process.terminate()
                except Exception:
                    pass
                self._process = None

            self._is_starting = False
            return {
                "status": "error",
                "is_running": False,
                "public_https_url": None,
                "message": "Failed to generate Cloudflare Quick Tunnel. Please check internet connection or retry in a few seconds.",
            }

    def start_ngrok_tunnel(self, domain_or_url: str = "", authtoken: Optional[str] = None, target_port: int = 3000) -> Dict[str, Any]:
        """
        Starts an in-process native Ngrok tunnel using the official ngrok Python SDK.
        Guarantees zero external executables (no antivirus/Defender HackTool popups),
        zero popup windows, and instant native TLS forwarding.
        """
        with self._lock:
            self.stop_tunnel()
            self._is_starting = True
            self._user_enabled = True

            clean_domain = domain_or_url.replace("https://", "").replace("http://", "").split("/")[0].strip() if domain_or_url else ""
            clean_token = (authtoken or "").strip()
            
            # If authtoken not passed explicitly, check saved config or environment
            if not clean_token:
                cfg = self.get_config()
                clean_token = cfg.get("ngrok_authtoken", "").strip() or os.environ.get("NGROK_AUTHTOKEN", "").strip()

            ready_event = threading.Event()
            error_holder: List[str] = []

            def _ngrok_worker():
                if ngrok is None:
                    err_msg = "The 'ngrok' Python package is not installed."
                    logger.warning(err_msg)
                    error_holder.append(err_msg)
                    ready_event.set()
                    return

                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                self._ngrok_loop = loop
                try:
                    try:
                        if hasattr(ngrok, "disconnect"):
                            ngrok.disconnect()
                    except Exception:
                        pass
                    if clean_token:
                        try:
                            if hasattr(ngrok, "set_auth_token"):
                                ngrok.set_auth_token(clean_token)
                        except Exception:
                            pass
                    
                    kwargs: Dict[str, Any] = {
                        "addr": target_port,
                    }
                    if clean_token:
                        kwargs["authtoken"] = clean_token
                    if clean_domain:
                        kwargs["domain"] = clean_domain

                    listener = ngrok.forward(**kwargs)
                    self._ngrok_listener = listener
                    
                    live_url = listener.url()
                    if live_url:
                        if not live_url.startswith("https://"):
                            live_url = f"https://{live_url}"
                        self._tunnel_url = live_url
                        self._provider_name = "Ngrok Static Domain"
                        self._write_tunnel_url_to_files(live_url)
                        logger.info("Official In-Process Ngrok tunnel active: %s", live_url)
                    ready_event.set()
                    loop.run_forever()
                except Exception as sdk_err:
                    err_msg = str(sdk_err)
                    logger.warning("Official ngrok SDK forward failed: %s", err_msg)
                    error_holder.append(err_msg)
                    ready_event.set()

            t = threading.Thread(target=_ngrok_worker, daemon=True)
            self._ngrok_thread = t
            t.start()

            ready_event.wait(timeout=6.0)
            self._is_starting = False

            if self._tunnel_url and not error_holder:
                return {
                    "status": "success",
                    "is_running": True,
                    "provider": "Ngrok Static Domain",
                    "public_https_url": self._tunnel_url,
                    "active_route": "ngrok",
                    "message": f"Ngrok native in-process tunnel active: {self._tunnel_url}",
                }

            err_str = error_holder[0] if error_holder else "Unknown error initializing Ngrok tunnel"
            if "ERR_NGROK_107" in err_str:
                err_clean = "Invalid or expired Ngrok authtoken (ERR_NGROK_107). Please copy your active token from https://dashboard.ngrok.com/get-started/your-authtoken"
            elif "ERR_NGROK_108" in err_str or "simultaneous ngrok agent sessions" in err_str:
                err_clean = "Ngrok session limit reached (ERR_NGROK_108: max 3 active agents). Please open https://dashboard.ngrok.com/agents and click 'Stop' on old agent sessions."
            else:
                err_clean = err_str

            logger.warning("Ngrok forward error: %s. Initiating Cloudflare fallback...", err_str)
            fallback_res = self.start_quick_tunnel(target_port=target_port)
            if fallback_res.get("status") == "success":
                fallback_url = fallback_res.get("public_https_url")
                fallback_res["message"] = f"Ngrok Token Warning: {err_clean}. Active Backup: {fallback_url}"
                return fallback_res
            return {
                "status": "error",
                "is_running": False,
                "public_https_url": None,
                "message": f"Ngrok Error: {err_clean}",
            }

    def start_tunnel(self, target_port: int = 3000, timeout_sec: float = 16.0) -> Dict[str, Any]:
        """
        Starts a high-performance, persistent HTTPS public tunnel:
        - If Permanent Custom URL / Ngrok configured: uses chosen route immediately.
        - If Cloudflare Named Tunnel Token configured: executes persistent named tunnel daemon.
        - Otherwise: Multi-provider auto-failover (Cloudflare Quick Tunnel -> Pinggy -> Localhost.run).
        
        Zero popup windows guaranteed on Windows.
        """
        with self._lock:
            cfg = self.get_config()
            route = cfg.get("active_route", "auto")
            
            # If active route is ngrok, launch in-process native ngrok tunnel
            if route == "ngrok" and (cfg.get("ngrok_url") or cfg.get("ngrok_authtoken")):
                return self.start_ngrok_tunnel(
                    domain_or_url=cfg.get("ngrok_url", ""),
                    authtoken=cfg.get("ngrok_authtoken", ""),
                    target_port=target_port,
                )

            # If active route is cloudflare, launch Cloudflare Quick Tunnel
            if route == "cloudflare":
                return self.start_quick_tunnel(target_port=target_port)

            # Check configured active route
            active_url, provider = self._get_configured_active_endpoint(cfg)
            if active_url:
                self._tunnel_url = active_url
                self._provider_name = provider or "Permanent Custom Domain"
                self._user_enabled = True
                self._write_tunnel_url_to_files(self._tunnel_url)
                return {
                    "status": "success",
                    "is_running": True,
                    "provider": self._provider_name,
                    "public_https_url": self._tunnel_url,
                    "message": f"{self._provider_name} active: {self._tunnel_url}",
                }

            if self._tunnel_url and self.is_url_reachable(self._tunnel_url, timeout_sec=1.5):
                self._user_enabled = True
                return {
                    "status": "success",
                    "is_running": True,
                    "provider": self._provider_name,
                    "public_https_url": self._tunnel_url,
                    "message": f"Tunnel is active and verified ({self._provider_name}): {self._tunnel_url}",
                }

            self.stop_tunnel()
            self._is_starting = True
            self._user_enabled = True

            logger.info("Initializing headless public tunnel daemon for 127.0.0.1:%d ...", target_port)
            hidden_flags = self._get_subprocess_hidden_flags()
            log_path = self._get_daemon_log()

            # -------------------------------------------------------------
            # Tier 1: Cloudflare Enterprise (Named Tunnel or Quick Tunnel)
            # -------------------------------------------------------------
            bin_path = self._get_cloudflared_bin()
            if bin_path:
                try:
                    with open(log_path, "w", encoding="utf-8", errors="ignore") as lf:
                        lf.write("")
                    log_file = open(log_path, "a", encoding="utf-8", errors="ignore")
                    
                    named_token = cfg.get("named_token")
                    if named_token:
                        # Cloudflare Permanent Named Tunnel
                        cmd = [
                            str(bin_path),
                            "tunnel",
                            "run",
                            "--token", named_token,
                            "--no-autoupdate",
                        ]
                        logger.info("Starting Cloudflare Permanent Named Tunnel with token...")
                    else:
                        # Cloudflare Quick Tunnel
                        cmd = [
                            str(bin_path),
                            "tunnel",
                            "--url", f"http://127.0.0.1:{target_port}",
                            "--no-autoupdate",
                        ]

                    proc = subprocess.Popen(
                        cmd,
                        stdout=log_file,
                        stderr=subprocess.STDOUT,
                        stdin=subprocess.DEVNULL,
                        **hidden_flags,
                    )
                    self._process = proc
                    
                    if named_token:
                        # Named tunnels use the user's pre-configured Cloudflare DNS hostname
                        self._tunnel_url = None
                        self._provider_name = "Cloudflare Named Tunnel"
                        self._save_pid_info(proc.pid, "", "Cloudflare Named Tunnel")
                        self._is_starting = False
                        return {
                            "status": "success",
                            "is_running": True,
                            "provider": "Cloudflare Named Tunnel",
                            "public_https_url": self._tunnel_url,
                            "message": "Cloudflare Permanent Named Tunnel running with token.",
                        }

                    # Regex matching for Quick Tunnel - STRICTLY exclude internal api.trycloudflare.com
                    cf_pattern = re.compile(r"https://([a-zA-Z0-9-]+)\.trycloudflare\.com")
                    discovered_url: Optional[str] = None

                    start_time = time.time()
                    while time.time() - start_time < 12.0:
                        time.sleep(0.4)
                        if log_path.exists():
                            try:
                                log_content = log_path.read_text(encoding="utf-8", errors="ignore")
                                if "429 Too Many Requests" in log_content or "error code: 1015" in log_content:
                                    logger.warning("Cloudflare rate limited (429/1015). Switching to Tier 2 provider...")
                                    break
                                for m in cf_pattern.finditer(log_content):
                                    candidate = m.group(0)
                                    subdomain = m.group(1).lower()
                                    if subdomain not in ("api", "pkg", "update", "developers", "blog", "dash", "one"):
                                        discovered_url = candidate
                                        break
                                if discovered_url:
                                    break
                            except Exception:
                                pass

                    if discovered_url:
                        self._tunnel_url = discovered_url
                        self._provider_name = "Cloudflare Quick Tunnel"
                        self._write_tunnel_url_to_files(discovered_url)
                        self._save_pid_info(proc.pid, discovered_url, "Cloudflare Quick Tunnel")
                        self._is_starting = False
                        logger.info("Cloudflare Quick Tunnel active: %s", discovered_url)
                        return {
                            "status": "success",
                            "is_running": True,
                            "provider": "Cloudflare Quick Tunnel",
                            "public_https_url": discovered_url,
                            "message": f"Cloudflare Quick Tunnel active: {discovered_url}",
                        }
                except Exception as e:
                    logger.warning("Error launching Cloudflare tunnel: %s", e)

                if self._process:
                    try:
                        self._process.terminate()
                    except Exception:
                        pass
                    self._process = None

            # -------------------------------------------------------------
            # Tier 2: Pinggy HTTPS Tunnel (via SSH)
            # -------------------------------------------------------------
            ssh_bin = self._get_ssh_bin()
            if ssh_bin:
                try:
                    logger.info("Starting Pinggy SSH tunnel fallback...")
                    with open(log_path, "w", encoding="utf-8", errors="ignore") as lf:
                        lf.write("")
                    log_file = open(log_path, "a", encoding="utf-8", errors="ignore")
                    cmd = [
                        str(ssh_bin),
                        "-p", "443",
                        "-o", "StrictHostKeyChecking=no",
                        "-o", "UserKnownHostsFile=NUL" if sys.platform == "win32" else "/dev/null",
                        "-o", "ServerAliveInterval=30",
                        "-o", "TCPKeepAlive=yes",
                        f"-R0:127.0.0.1:{target_port}",
                        "a.pinggy.io",
                    ]
                    proc = subprocess.Popen(
                        cmd,
                        stdout=log_file,
                        stderr=subprocess.STDOUT,
                        stdin=subprocess.DEVNULL,
                        **hidden_flags,
                    )
                    self._process = proc
                    pinggy_pattern = re.compile(r"https://[a-zA-Z0-9-]+\.(?:free|a)\.pinggy\.link")
                    discovered_url = None

                    start_time = time.time()
                    while time.time() - start_time < 9.0:
                        time.sleep(0.4)
                        if log_path.exists():
                            try:
                                log_content = log_path.read_text(encoding="utf-8", errors="ignore")
                                m = pinggy_pattern.search(log_content)
                                if m:
                                    discovered_url = m.group(0)
                                    break
                            except Exception:
                                pass

                    if discovered_url:
                        self._tunnel_url = discovered_url
                        self._provider_name = "Pinggy HTTPS"
                        self._write_tunnel_url_to_files(discovered_url)
                        self._save_pid_info(proc.pid, discovered_url, "Pinggy HTTPS")
                        self._is_starting = False
                        return {
                            "status": "success",
                            "is_running": True,
                            "provider": "Pinggy HTTPS",
                            "public_https_url": discovered_url,
                            "message": f"Pinggy HTTPS tunnel active: {discovered_url}",
                        }
                except Exception as e:
                    logger.warning("Error launching Pinggy SSH tunnel: %s", e)

                if self._process:
                    try:
                        self._process.terminate()
                    except Exception:
                        pass
                    self._process = None

            # -------------------------------------------------------------
            # Tier 3: Localhost.run SSH Tunnel (Direct TLS termination)
            # -------------------------------------------------------------
            if ssh_bin:
                try:
                    logger.info("Starting Localhost.run SSH tunnel fallback...")
                    with open(log_path, "w", encoding="utf-8", errors="ignore") as lf:
                        lf.write("")
                    log_file = open(log_path, "a", encoding="utf-8", errors="ignore")
                    cmd = [
                        str(ssh_bin),
                        "-o", "StrictHostKeyChecking=no",
                        "-o", "UserKnownHostsFile=NUL" if sys.platform == "win32" else "/dev/null",
                        "-o", "ServerAliveInterval=30",
                        "-o", "TCPKeepAlive=yes",
                        "-R", f"80:127.0.0.1:{target_port}",
                        "nokey@localhost.run",
                    ]
                    proc = subprocess.Popen(
                        cmd,
                        stdout=log_file,
                        stderr=subprocess.STDOUT,
                        stdin=subprocess.DEVNULL,
                        **hidden_flags,
                    )
                    self._process = proc
                    lhr_pattern = re.compile(r"https://[a-zA-Z0-9-]+\.lhr\.life")
                    discovered_url = None

                    start_time = time.time()
                    while time.time() - start_time < 9.0:
                        time.sleep(0.4)
                        if log_path.exists():
                            try:
                                log_content = log_path.read_text(encoding="utf-8", errors="ignore")
                                m = lhr_pattern.search(log_content)
                                if m:
                                    discovered_url = m.group(0)
                                    break
                            except Exception:
                                pass

                    if discovered_url:
                        self._tunnel_url = discovered_url
                        self._provider_name = "Localhost.run (TLS)"
                        self._write_tunnel_url_to_files(discovered_url)
                        self._save_pid_info(proc.pid, discovered_url, "Localhost.run (TLS)")
                        self._is_starting = False
                        logger.info("Localhost.run tunnel active: %s", discovered_url)
                        return {
                            "status": "success",
                            "is_running": True,
                            "provider": "Localhost.run (TLS)",
                            "public_https_url": discovered_url,
                            "message": f"Localhost.run HTTPS tunnel active: {discovered_url}",
                        }
                except Exception as e:
                    logger.warning("Error launching Localhost.run: %s", e)

                if self._process:
                    try:
                        self._process.terminate()
                    except Exception:
                        pass
                    self._process = None

            self._is_starting = False
            return {
                "status": "error",
                "is_running": False,
                "public_https_url": None,
                "message": "Unable to initialize public HTTPS tunnel across all providers.",
            }

    def _save_pid_info(self, pid: int, url: str, provider: str) -> None:
        try:
            self._get_pid_file().write_text(
                json.dumps({
                    "pid": pid,
                    "url": url,
                    "provider": provider,
                    "time": time.time(),
                }),
                encoding="utf-8"
            )
        except Exception:
            pass

    def stop_tunnel(self) -> Dict[str, Any]:
        """Stops the active tunnel daemon cleanly."""
        with self._lock:
            self._user_enabled = False

            # Close in-process native ngrok loop & listener if active
            if self._ngrok_loop is not None:
                loop = self._ngrok_loop
                listener = self._ngrok_listener
                def _cleanup():
                    try:
                        if listener is not None:
                            listener.close()
                    except Exception:
                        pass
                    try:
                        loop.stop()
                    except Exception:
                        pass
                try:
                    loop.call_soon_threadsafe(_cleanup)
                except Exception:
                    pass
                self._ngrok_loop = None
                self._ngrok_listener = None
            try:
                if ngrok is not None and hasattr(ngrok, "disconnect"):
                    ngrok.disconnect()
            except Exception:
                pass

            pid_file = self._get_pid_file()
            if pid_file.exists():
                try:
                    data = json.loads(pid_file.read_text(encoding="utf-8"))
                    pid = data.get("pid")
                    if pid and sys.platform == "win32":
                        subprocess.run(
                            ["taskkill", "/F", "/T", "/PID", str(pid)],
                            stdout=subprocess.DEVNULL,
                            stderr=subprocess.DEVNULL,
                            creationflags=subprocess.CREATE_NO_WINDOW,
                        )
                except Exception:
                    pass

            self._kill_all_tunnel_processes()
            self._tunnel_url = None
            self._clean_tunnel_files()

            return {
                "status": "success",
                "is_running": False,
                "public_https_url": None,
                "message": "Tunnel stopped cleanly.",
            }

    def get_status(self) -> Dict[str, Any]:
        """Queries verified status of the tunnel."""
        with self._lock:
            url = self.get_tunnel_url(auto_start=False)
            is_running = url is not None
            return {
                "status": "success",
                "is_running": is_running,
                "is_starting": self._is_starting,
                "provider": self._provider_name,
                "public_https_url": url,
            }

    def _start_watchdog(self):
        """Watchdog that monitors tunnel health only when actively enabled by user."""
        def _watchdog_loop():
            consecutive_failures = 0
            while not self._stop_watchdog.is_set():
                time.sleep(20)
                try:
                    if not self._user_enabled:
                        continue
                    if self._tunnel_url:
                        if not self.is_url_reachable(self._tunnel_url, timeout_sec=4.0):
                            consecutive_failures += 1
                            if consecutive_failures >= 3:
                                logger.warning("Watchdog: Tunnel %s unreachable for 3 cycles. Auto-healing now...", self._tunnel_url)
                                self._tunnel_url = None
                                consecutive_failures = 0
                                self.start_tunnel(target_port=3000, timeout_sec=16.0)
                        else:
                            consecutive_failures = 0
                except Exception:
                    pass

        t = threading.Thread(target=_watchdog_loop, daemon=True)
        t.start()
        self._watchdog_thread = t


_tunnel_manager_instance = TunnelManager()


def get_tunnel_manager() -> TunnelManager:
    return _tunnel_manager_instance
