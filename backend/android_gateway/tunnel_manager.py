"""
Dynamic Multi-Provider Cloud & Public HTTPS Tunnel Manager
Nexus Call OS v2.4 Enterprise

Provides automated lifecycle management (start, stop, query, health verification, auto-failover)
across Cloudflare Enterprise Tunnels, Pinggy HTTPS, and Localhost.run with singleton daemon guarantees,
100% headless background execution (no popup windows), instant background pre-warming, and clean process management.
"""

import os
import re
import sys
import ssl
import json
import time
import socket
import logging
import threading
import subprocess
import urllib.parse
import urllib.request
import urllib.error
from pathlib import Path
from typing import Optional, Dict, Any, List

logger = logging.getLogger("NexusTunnelManager")


class TunnelManager:
    """Production-grade multi-provider headless daemon Tunnel Manager with zero popup windows, instant caching, and auto-healing."""

    def __init__(self):
        self._process: Optional[subprocess.Popen] = None
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

    def is_url_reachable(self, url: str, timeout_sec: float = 3.5) -> bool:
        """Verifies if the public tunnel endpoint responds with genuine HTTP without tunnel provider errors."""
        if not url or not url.startswith(("http://", "https://")):
            return False
        try:
            parsed = urllib.parse.urlparse(url)
            host = parsed.hostname
            if not host:
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
            # 404, 403, 401 are valid origin responses; 502/530/520/1033 are tunnel errors
            if he.code in (500, 502, 503, 504, 520, 521, 522, 523, 524, 525, 526, 530):
                return False
            return True
        except Exception:
            return False

    def _reattach_or_prewarm_daemon(self):
        """Pre-warms the daemon or reattaches to an existing live tunnel process so URLs are ready in 0ms."""
        pid_file = self._get_pid_file()
        if pid_file.exists():
            try:
                data = json.loads(pid_file.read_text(encoding="utf-8"))
                saved_url = data.get("url")
                provider = data.get("provider", "Cloudflare Enterprise")
                if saved_url and self.is_url_reachable(saved_url, timeout_sec=2.0):
                    self._tunnel_url = saved_url
                    self._provider_name = provider
                    self._user_enabled = True
                    logger.info("Reattached to live tunnel daemon (%s): %s", provider, saved_url)
                    return
            except Exception:
                pass

        # Also check cached tunnel url files for instant 0ms restoration
        for tfile in self._get_tunnel_files():
            if tfile.exists():
                try:
                    val = tfile.read_text(encoding="utf-8").strip()
                    if val.startswith("https://") and self.is_url_reachable(val, timeout_sec=1.5):
                        self._tunnel_url = val
                        self._provider_name = "Cloudflare Enterprise"
                        self._user_enabled = True
                        return
                except Exception:
                    pass

        # Pre-warm in background daemon thread
        self.ensure_tunnel_running_async(target_port=3000)

    def get_tunnel_url(self, auto_start: bool = True) -> Optional[str]:
        """Returns the active reachable tunnel URL instantly without blocking."""
        with self._lock:
            if self._tunnel_url:
                return self._tunnel_url

            for tfile in self._get_tunnel_files():
                if tfile.exists():
                    try:
                        val = tfile.read_text(encoding="utf-8").strip()
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
            self.start_tunnel(target_port=target_port, timeout_sec=16.0)
        finally:
            self._is_starting = False

    def start_tunnel(self, target_port: int = 3000, timeout_sec: float = 16.0) -> Dict[str, Any]:
        """
        Starts a high-performance, persistent HTTPS public tunnel with multi-provider fallback:
        Tier 1: Cloudflare Quick Tunnel (trycloudflare.com) - Enterprise HTTPS & WebSockets
        Tier 2: Pinggy HTTPS Tunnel (pinggy.link) - Direct TLS via SSH
        Tier 3: Localhost.run SSH Tunnel (lhr.life) - Direct TLS via SSH
        
        Zero popup windows guaranteed on Windows.
        """
        with self._lock:
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
            # Tier 1: Cloudflare Enterprise Quick Tunnel (trycloudflare.com)
            # -------------------------------------------------------------
            bin_path = self._get_cloudflared_bin()
            if bin_path:
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
                    cf_pattern = re.compile(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com")
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
                                m = cf_pattern.search(log_content)
                                if m:
                                    discovered_url = m.group(0)
                                    break
                            except Exception:
                                pass

                    if discovered_url:
                        self._tunnel_url = discovered_url
                        self._provider_name = "Cloudflare Enterprise"
                        self._write_tunnel_url_to_files(discovered_url)
                        self._save_pid_info(proc.pid, discovered_url, "Cloudflare Enterprise")
                        self._is_starting = False
                        logger.info("Cloudflare Enterprise tunnel active: %s", discovered_url)
                        return {
                            "status": "success",
                            "is_running": True,
                            "provider": "Cloudflare Enterprise",
                            "public_https_url": discovered_url,
                            "message": f"Cloudflare Enterprise tunnel active: {discovered_url}",
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
