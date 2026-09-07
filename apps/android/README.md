# Nexus Call OS — Native Android GSM Gateway (v2.4)

A high-performance, native Android companion application that transforms any Android smartphone (physical SIM, dual SIM, or eSIM) into a real-time cellular telephony voice gateway for **Nexus Call OS**.

---

## Key Architecture & Features

1. **Native Jetpack & Material Dark Theme**:
   - Designed based on the high-tech cybernetic reference interface.
   - 5 full screens: Dashboard, Call Handling, SIM Management, AI Voice Agent, Gateway Settings.
   - Live docked bottom navigation with reactive status badges.

2. **Real Hardware Telemetry (Zero Mock Data)**:
   - Dynamic battery percentage and charging state via `BatteryManager`.
   - Real modem signal strength (`dBm`) and carrier name via `TelephonyManager`.
   - Dynamic network technology detection (5G NR, 4G LTE, 3G HSPA, Wi-Fi).
   - Dynamic device model (`Build.MANUFACTURER`, `Build.MODEL`) and Android OS version.
   - Real-time round-trip latency (RTT) measurement over WebSocket.

3. **Multi-SIM & Embedded eSIM Management**:
   - Dynamic enumeration of active subscriptions via Android's `SubscriptionManager`.
   - Support for single-SIM, dual-SIM, and eSIM profiles.
   - Dynamic display of carrier, phone number (or "Number unavailable"), and slot index.
   - Persistent line selection with instant native telephony configuration updates.

4. **Telecom Call Handling & Auto-Answer Engine**:
   - InCallService (`CompanionInCallService`) for programmatic call answering and termination.
   - Android 10+ `CallScreeningService` for instant caller number detection.
   - Configurable Inbound Auto-Answer toggle with delay countdown ticker (0s, 3s, 5s, 10s).
   - Interactive active call card showing live caller details, elapsed timer, answer, mute, and hang-up controls.

5. **Duplex 16kHz PCM Audio Pipeline**:
   - Microphone input capture via `AudioRecord` (16kHz Linear PCM mono).
   - Audio playback engine via `AudioTrack` with voice communication routing.
   - Full duplex streaming over authenticated WebSocket bridge to Nexus Call OS AI agents.

6. **Backend SSOT Integration**:
   - Centralized consumption of active agents and speech engines via `/api/android-gateway/mobile-overview`.
   - Dynamic token exchange and pairing handshake via `/api/android-gateway/pair/exchange`.
   - Authenticated WebSocket streaming over `/api/android-gateway/ws/bridge`.

7. **Persistent Foreground Service**:
   - `CallBridgeForegroundService` with notification channel and `phoneCall|microphone` type keeps telephony bridge alive when app is backgrounded.

---

## Building Locally

```bash
# Set JDK 17 and Android SDK
set JAVA_HOME=<path_to_jdk_17>
set ANDROID_HOME=<path_to_android_sdk>

# Assemble Debug APK
gradlew.bat assembleDebug
```

Compiled APK is output to: `apps/android/app/build/outputs/apk/debug/app-debug.apk`
