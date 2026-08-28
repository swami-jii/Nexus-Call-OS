# SIP Trunks & PBX Interconnection — Operational Guide

SIP Trunks establish direct **IP-to-IP Signaling & Audio Pipelines** connecting existing PBX hardware (FreePBX, Asterisk, Cisco CUCM, Avaya) or wholesale SIP providers to Nexus Call OS.

---

## 🎯 Role in Live Phone Calls & Purpose
Allows your existing office phone system or VoIP trunking provider to route phone calls directly to AI Voice Agents over SIP UDP, TCP, or TLS protocols.

---

## 📌 Kahan Use Hoga? (Where Is This Used?)
- Used when connecting existing company call centers, PBX phone systems, or IP-PBX hardware to AI Voice Agents.

---

## 💡 Real-World Voice Calling Example
- **Scenario**: An enterprise with an existing Asterisk PBX server wants AI Agents to handle overflow inbound call queues.
- **Execution**: A SIP Trunk connects the PBX server (`10.0.4.120:5060`). When call volume spikes, the PBX automatically forwards extra calls over the SIP trunk to Nexus Call OS AI Agents.

---

## 🚀 Project me Kyu Zaroori hai? (Why Is This Critical?)
1. **Zero Enterprise Hardware Wasting**: Connects seamlessly with existing PBX investments without replacing phone hardware.
2. **High Capacity Trunking**: Supports 100+ concurrent call channels over Opus, G.722, or PCMU audio codecs.
3. **Encrypted Media**: Supports TLS 5061 signaling and SRTP media encryption.

---

## 🛠️ Step-by-Step Setup Instructions
1. **SIP Host & Port**: Enter PBX IP address or domain (e.g. `10.0.4.120:5060`).
2. **Transport & Auth**: Select UDP 5060, TCP 5060, or TLS 5061 and enter Digest Username/Password.
3. **Test SIP Ping**: Click `Test SIP Registration` to verify 200 OK latency response.
