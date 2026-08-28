# Nexus Call OS — Native Android GSM Companion App

Production-grade Android Companion application connecting physical smartphone SIM calls to Nexus Call OS via secure encrypted WebSocket stream.

## 📱 Features

- **Unchanged SIM Number**: Uses the phone's native SIM card; caller sees the original SIM phone number.
- **Auto Answer & Manual Answer**: Uses `TelecomManager` / `InCallService` to auto-answer incoming calls without user interaction.
- **Low-Latency Audio Streaming**: Captures 16kHz PCM audio from `VOICE_COMMUNICATION` microphone source with hardware Echo Cancellation (AEC), Noise Suppression (NS), and Automatic Gain Control (AGC).
- **Instant Barge-In**: Flushes audio buffer immediately when caller interruption is detected.
- **Auto-Reconnect & Keepalive**: Automatically reconnects after Wi-Fi/cellular network switch or server reboot.
- **Pairing System**: Pairs securely with Nexus Call OS via QR Code or single-use secret token.

---

## ⚡ OEM Device Compatibility & Battery Optimization Guide

| Manufacturer | Auto-Answer Capability | Audio Routing | Recommended OEM Battery Settings |
|---|---|---|---|
| **Google Pixel (Android 12-14)** | Full (100%) | Native PCM Stream | Settings -> Apps -> Nexus Companion -> Battery -> Unrestricted |
| **Samsung Galaxy (OneUI 5/6)** | Full (100%) | Native PCM Stream | Battery -> Background Usage Limits -> Never Sleeping Apps -> Add Nexus Companion |
| **Xiaomi / Poco (MIUI/HyperOS)** | Supported with permissions | Native PCM Stream | App Info -> Autostart -> ON, Battery Saver -> No Restrictions |
| **OnePlus / Oppo (ColorOS)** | Supported with permissions | Native PCM Stream | Recent Apps -> Lock App, Disable Deep Optimization |

---

## 🔒 Required Android Permissions

- `android.permission.ANSWER_PHONE_CALLS`
- `android.permission.READ_PHONE_STATE`
- `android.permission.RECORD_AUDIO`
- `android.permission.CALL_PHONE`
- `android.permission.SYSTEM_ALERT_WINDOW`
- `android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`
