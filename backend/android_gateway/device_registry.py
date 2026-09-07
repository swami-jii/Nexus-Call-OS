"""
Device Registry Module
Nexus Call OS v2.4 Enterprise

Stores and manages connected companion devices (Android, iOS, Desktop), telemetry,
SIM card configuration, auto-answer toggles, device priority order, and database persistence.
"""

import time
import hashlib
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from backend.database.session import SessionLocal
from backend.models.models import CompanionDevice

logger = logging.getLogger("NexusDeviceRegistry")


def hash_device_token(token: str) -> str:
    """Generate SHA-256 hash of device secret token."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class AndroidDevice:
    def __init__(
        self,
        device_id: str,
        name: str,
        sim_number: str = "",
        carrier_name: str = "",
        os_version: str = "",
        device_type: str = "android",
        organization_id: Optional[str] = None,
        workspace_id: Optional[str] = None,
        auto_answer: bool = True,
        priority: int = 1,
        device_token_hash: Optional[str] = None,
    ):
        self.device_id: str = device_id
        self.name: str = name
        self.sim_number: str = sim_number or ""
        self.carrier_name: str = carrier_name or ""
        self.os_version: str = os_version or ""
        self.device_type: str = device_type
        self.organization_id: Optional[str] = organization_id
        self.workspace_id: Optional[str] = workspace_id
        self.auto_answer: bool = auto_answer
        self.priority: int = priority
        self.device_token_hash: str = device_token_hash or ""
        self.is_online: bool = False
        self.battery_level: int = 0
        self.is_charging: bool = False
        self.signal_dbm: int = 0
        self.network_type: str = ""
        self.latency_ms: int = 0
        self.last_heartbeat: float = 0.0
        self.active_session_id: Optional[str] = None
        self.subscriptions: List[Dict[str, Any]] = []
        self.selected_sub_id: int = -1
        self.call_state: str = "IDLE"
        self.auto_answer_delay_sec: int = 3
        self.outbound_ai_enabled: bool = True
        self.assigned_agent_id: Optional[str] = None
        self.assigned_llm_model: Optional[str] = None
        self.assigned_voice_id: Optional[str] = None
        self.assigned_language: Optional[str] = None

    def update_telemetry(
        self,
        name: Optional[Any] = None,
        os_version: Optional[Any] = None,
        battery_level: Optional[Any] = None,
        is_charging: Optional[Any] = None,
        signal_dbm: Optional[Any] = None,
        network_type: Optional[Any] = None,
        latency_ms: Optional[Any] = None,
        carrier_name: Optional[Any] = None,
        sim_number: Optional[Any] = None,
        subscriptions: Optional[Any] = None,
        selected_sub_id: Optional[Any] = None,
        call_state: Optional[Any] = None,
        auto_answer: Optional[Any] = None,
        auto_answer_delay_sec: Optional[Any] = None,
        outbound_ai_enabled: Optional[Any] = None,
    ) -> None:
        if name and str(name).strip():
            self.name = str(name).strip()
        if os_version and str(os_version).strip():
            self.os_version = str(os_version).strip()
        if battery_level is not None:
            try:
                self.battery_level = int(battery_level)
            except Exception:
                pass
        if is_charging is not None:
            self.is_charging = bool(is_charging)
        if signal_dbm is not None:
            try:
                self.signal_dbm = int(signal_dbm)
            except Exception:
                pass
        if network_type is not None:
            self.network_type = str(network_type)
        if latency_ms is not None:
            try:
                self.latency_ms = int(latency_ms)
            except Exception:
                pass
        if carrier_name is not None and str(carrier_name).strip():
            self.carrier_name = str(carrier_name).strip()
        if sim_number is not None and str(sim_number).strip():
            self.sim_number = str(sim_number).strip()
        if subscriptions is not None and isinstance(subscriptions, list):
            self.subscriptions = subscriptions
        if selected_sub_id is not None:
            try:
                self.selected_sub_id = int(selected_sub_id)
            except Exception:
                pass
        if call_state is not None:
            self.call_state = str(call_state)
        if auto_answer is not None:
            self.auto_answer = bool(auto_answer)
        if auto_answer_delay_sec is not None:
            try:
                self.auto_answer_delay_sec = int(auto_answer_delay_sec)
            except Exception:
                pass
        if outbound_ai_enabled is not None:
            self.outbound_ai_enabled = bool(outbound_ai_enabled)
        self.last_heartbeat = time.time()
        self.is_online = True

    def to_dict(self) -> Dict[str, Any]:
        return {
            "device_id": self.device_id,
            "name": self.name,
            "sim_number": self.sim_number,
            "carrier_name": self.carrier_name,
            "os_version": self.os_version,
            "device_type": self.device_type,
            "organization_id": self.organization_id,
            "workspace_id": self.workspace_id,
            "auto_answer": self.auto_answer,
            "auto_answer_delay_sec": self.auto_answer_delay_sec,
            "outbound_ai_enabled": self.outbound_ai_enabled,
            "priority": self.priority,
            "is_online": self.is_online and (time.time() - self.last_heartbeat < 30),
            "battery_level": self.battery_level,
            "is_charging": self.is_charging,
            "signal_dbm": self.signal_dbm,
            "network_type": self.network_type,
            "latency_ms": self.latency_ms,
            "last_heartbeat": self.last_heartbeat,
            "active_session_id": self.active_session_id,
            "subscriptions": self.subscriptions,
            "selected_sub_id": self.selected_sub_id,
            "call_state": self.call_state,
            "assigned_agent_id": self.assigned_agent_id,
            "assigned_llm_model": self.assigned_llm_model,
            "assigned_voice_id": self.assigned_voice_id,
            "assigned_language": self.assigned_language,
        }




class DeviceRegistry:
    """Central registry tracking paired and connected companion devices with persistent DB backing."""

    def __init__(self):
        self._devices: Dict[str, AndroidDevice] = {}
        self._load_from_db()

    def _load_from_db(self) -> None:
        """Hydrate in-memory cache from database records."""
        try:
            with SessionLocal() as db:
                records = db.query(CompanionDevice).all()
                for rec in records:
                    dev = AndroidDevice(
                        device_id=rec.device_id,
                        name=rec.name,
                        sim_number=rec.sim_number or "",
                        carrier_name=rec.carrier_name or "",
                        os_version=rec.os_version or "",
                        device_type=rec.device_type or "android",
                        organization_id=rec.organization_id,
                        workspace_id=rec.workspace_id,
                        auto_answer=rec.auto_answer if rec.auto_answer is not None else True,
                        priority=rec.priority or 1,
                        device_token_hash=rec.device_token_hash,
                    )
                    dev.battery_level = rec.battery_level if rec.battery_level is not None else 0
                    dev.is_charging = rec.is_charging if rec.is_charging is not None else False
                    dev.signal_dbm = rec.signal_dbm if rec.signal_dbm is not None else 0
                    dev.network_type = rec.network_type or ""
                    dev.latency_ms = rec.latency_ms if rec.latency_ms is not None else 0
                    dev.is_online = False
                    self._devices[rec.device_id] = dev
                logger.info(f"Loaded {len(records)} companion devices from database.")
        except Exception as e:
            logger.warning(f"Could not load companion devices from DB during startup: {e}")

    def register_device(
        self,
        device_id: str,
        name: str,
        sim_number: str = "",
        carrier_name: str = "",
        os_version: str = "",
        device_type: str = "android",
        organization_id: Optional[str] = None,
        workspace_id: Optional[str] = None,
        device_token: Optional[str] = None,
    ) -> AndroidDevice:
        """Registers a device both in-memory and persistently in the database."""
        token_hash = hash_device_token(device_token) if device_token else hash_device_token(f"dev_token_{device_id}")

        device = AndroidDevice(
            device_id=device_id,
            name=name,
            sim_number=sim_number,
            carrier_name=carrier_name,
            os_version=os_version,
            device_type=device_type,
            organization_id=organization_id,
            workspace_id=workspace_id,
            device_token_hash=token_hash,
        )
        device.last_heartbeat = time.time()
        device.is_online = True
        self._devices[device_id] = device

        # Persist to DB
        try:
            with SessionLocal() as db:
                db_device = db.query(CompanionDevice).filter(CompanionDevice.device_id == device_id).first()
                if not db_device:
                    db_device = CompanionDevice(
                        device_id=device_id,
                        name=name,
                        sim_number=sim_number,
                        carrier_name=carrier_name,
                        os_version=os_version,
                        device_type=device_type,
                        organization_id=organization_id,
                        workspace_id=workspace_id,
                        device_token_hash=token_hash,
                        is_online=True,
                        last_heartbeat=datetime.now(timezone.utc),
                    )
                    db.add(db_device)
                else:
                    db_device.name = name
                    db_device.sim_number = sim_number
                    db_device.carrier_name = carrier_name
                    db_device.os_version = os_version
                    db_device.organization_id = organization_id
                    db_device.workspace_id = workspace_id
                    db_device.device_token_hash = token_hash
                    db_device.is_online = True
                    db_device.last_heartbeat = datetime.now(timezone.utc)
                db.commit()
                logger.info(f"Persisted companion device {device_id} ({name}) to database for org {organization_id}")
        except Exception as e:
            logger.error(f"Error persisting companion device to DB: {e}")

        return device

    def authenticate_device(self, device_id: str, device_token: str) -> Optional[AndroidDevice]:
        """Verify device token against stored SHA-256 hash."""
        device = self._devices.get(device_id)
        if not device:
            # Try DB fallback
            try:
                with SessionLocal() as db:
                    rec = db.query(CompanionDevice).filter(CompanionDevice.device_id == device_id).first()
                    if rec:
                        device = AndroidDevice(
                            device_id=rec.device_id,
                            name=rec.name,
                            sim_number=rec.sim_number or "",
                            carrier_name=rec.carrier_name or "",
                            os_version=rec.os_version or "",
                            device_type=rec.device_type or "android",
                            organization_id=rec.organization_id,
                            workspace_id=rec.workspace_id,
                            auto_answer=rec.auto_answer if rec.auto_answer is not None else True,
                            priority=rec.priority or 1,
                            device_token_hash=rec.device_token_hash,
                        )
                        self._devices[device_id] = device
            except Exception as e:
                logger.warning(f"Error querying DB for device {device_id}: {e}")

        if not device or not device.device_token_hash:
            return None

        incoming_hash = hash_device_token(device_token)
        if incoming_hash == device.device_token_hash:
            device.is_online = True
            device.last_heartbeat = time.time()
            return device

        return None

    def mark_online(self, device_id: str) -> Optional[AndroidDevice]:
        dev = self._devices.get(device_id)
        if dev:
            dev.is_online = True
            dev.last_heartbeat = time.time()
            self._sync_status_to_db(device_id, is_online=True)
        return dev

    def disconnect_device(self, device_id: str) -> Optional[AndroidDevice]:
        device = self._devices.get(device_id)
        if device:
            device.is_online = False
            device.last_heartbeat = 0
            self._sync_status_to_db(device_id, is_online=False)
        return device

    def quick_connect_device(
        self,
        device_id: str = "mobile-device-primary",
        name: str = "Connected Mobile Gateway",
        sim_number: str = "",
        carrier_name: str = "",
        organization_id: Optional[str] = None,
        workspace_id: Optional[str] = None,
    ) -> AndroidDevice:
        device = self._devices.get(device_id)
        if not device:
            device = self.register_device(
                device_id=device_id,
                name=name,
                sim_number=sim_number,
                carrier_name=carrier_name,
                os_version="",
                organization_id=organization_id,
                workspace_id=workspace_id,
                device_token=f"quick_token_{device_id}",
            )
        device.is_online = True
        device.last_heartbeat = time.time()
        if not device.os_version:
            device.os_version = "Android 11 (API 30)"
        if not device.network_type:
            device.network_type = "Wi-Fi (LAN Active) / 4G"
        if not device.battery_level:
            device.battery_level = 89
        if not device.signal_dbm:
            device.signal_dbm = -75
        self._sync_status_to_db(device_id, is_online=True)
        return device

    def get_device(self, device_id: str) -> Optional[AndroidDevice]:
        return self._devices.get(device_id)

    def list_devices(self, organization_id: Optional[str] = None) -> List[Dict[str, Any]]:
        devices = sorted(self._devices.values(), key=lambda d: d.priority)
        if organization_id:
            devices = [d for d in devices if d.organization_id == organization_id or d.organization_id is None]
        return [d.to_dict() for d in devices]

    def set_auto_answer(self, device_id: str, auto_answer: bool) -> bool:
        device = self._devices.get(device_id)
        if device:
            device.auto_answer = auto_answer
            try:
                with SessionLocal() as db:
                    db_dev = db.query(CompanionDevice).filter(CompanionDevice.device_id == device_id).first()
                    if db_dev:
                        db_dev.auto_answer = auto_answer
                        db.commit()
            except Exception as e:
                logger.error(f"Failed to update auto_answer in DB: {e}")
            return True
        return False

    def rename_device(self, device_id: str, new_name: str) -> bool:
        device = self._devices.get(device_id)
        if device:
            device.name = new_name
            try:
                with SessionLocal() as db:
                    db_dev = db.query(CompanionDevice).filter(CompanionDevice.device_id == device_id).first()
                    if db_dev:
                        db_dev.name = new_name
                        db.commit()
            except Exception as e:
                logger.error(f"Failed to update device name in DB: {e}")
            return True
        return False

    def set_auto_answer_delay(self, device_id: str, delay_sec: int) -> bool:
        device = self._devices.get(device_id)
        if device:
            device.auto_answer_delay_sec = max(0, min(30, delay_sec))
            return True
        return False

    def set_outbound_ai(self, device_id: str, enabled: bool) -> bool:
        device = self._devices.get(device_id)
        if device:
            device.outbound_ai_enabled = enabled
            return True
        return False

    def delete_device(self, device_id: str) -> bool:
        self._devices.pop(device_id, None)
        try:
            with SessionLocal() as db:
                db_dev = db.query(CompanionDevice).filter(CompanionDevice.device_id == device_id).first()
                if db_dev:
                    db.delete(db_dev)
                    db.commit()
        except Exception as e:
            logger.error(f"Failed to delete device {device_id} from DB: {e}")
        return True

    def flush_devices(self) -> bool:
        self._devices.clear()
        try:
            with SessionLocal() as db:
                db.query(CompanionDevice).delete()
                db.commit()
        except Exception as e:
            logger.error(f"Failed to flush companion devices from DB: {e}")
        return True

    def _sync_status_to_db(self, device_id: str, is_online: bool) -> None:
        try:
            with SessionLocal() as db:
                db_dev = db.query(CompanionDevice).filter(CompanionDevice.device_id == device_id).first()
                if db_dev:
                    db_dev.is_online = is_online
                    db_dev.last_heartbeat = datetime.now(timezone.utc) if is_online else None
                    db.commit()
        except Exception as e:
            logger.debug(f"Could not sync status to DB for device {device_id}: {e}")


