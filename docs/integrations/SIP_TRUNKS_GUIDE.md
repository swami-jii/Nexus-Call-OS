# Nexus Call OS - SIP Trunks Integration Guide

SIP Trunks establish direct IP-to-IP signaling and media pipelines between existing PBX infrastructure and Nexus Call OS.

## 🎯 Role in Live Phone Calls
1. Bypasses PSTN APIs for direct low-latency SIP trunking with internal PBX systems (Asterisk, FreePBX, Cisco CUCM, Avaya).
2. Supports encrypted voice audio streaming over TLS signaling and SRTP media payload.
3. Provides high-throughput channel capacity for enterprise call centers.

## 🛠️ Key Configuration Parameters
- **SIP Host / IP**: Enter PBX host domain or IP address (e.g. `10.0.4.120` or `sip.nexus.internal`).
- **Transport Protocol**: Select UDP Port 5060 (Low Latency), TCP 5060, TLS 5061 (Encrypted), or SRTP.
- **Digest Authentication**: Configure Digest Username and Password required by your PBX firewall.
- **Codecs & Capacity**: Specify audio codecs (Opus 16kHz, G.722, PCMU 8kHz) and Max Concurrent Call capacity.

## 🔗 Official Developer API Docs
- **RFC 3261 SIP Specification**: https://datatracker.ietf.org/doc/html/rfc3261
- **FreePBX Trunk Setup**: https://wiki.freepbx.org/
- **Asterisk PJSIP Configuration**: https://wiki.asterisk.org/wiki/display/AST/PJSIP+Configuration
