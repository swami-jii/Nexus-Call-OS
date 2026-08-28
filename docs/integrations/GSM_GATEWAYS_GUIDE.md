# Nexus Call OS - SIM & GSM Gateways Integration Guide

SIM & GSM Gateways enable **Zero-Platform-Charge Calling** using physical carrier SIM cards installed in smartphones or hardware SIM banks.

## 🎯 Role in Live Phone Calls
1. Routes outbound AI campaign calls through physical SIM card mobile plans with zero per-minute platform markup.
2. Supports Android smartphones (via Nexus GSM Companion App), USB 4G LTE modems, and rackmount SIM Box banks.
3. Provides live diagnostics monitoring for cellular signal strength %, SIM slot status, and latency.

## 🛠️ Key Configuration Parameters
- **Device Hardware Type**: Select Android GSM Gateway, USB GSM Dongle, SIM Box Bank, or VoIP GSM Gateway.
- **Gateway IP Host**: Enter gateway device IP and port (e.g. `192.168.1.140:8080`).
- **SIM Slots & Labels**: Map SIM slot labels (e.g. `Jio 5G SIM #1 • Airtel 4G SIM #2`).
- **Zero Platform Charge Mode**: Active calls consume your local mobile SIM plan minutes with zero platform per-minute billing.

## 🔗 Official Developer API Docs
- **Android Telephony API**: https://developer.android.com/reference/android/telephony/TelephonyManager
- **OpenVox GSM Gateway Docs**: https://www.openvox.cn/products/gsm-gateways
- **Dinstar Gateway Setup**: https://www.dinstar.com/gsm-cdma-wcdma-gateways/
