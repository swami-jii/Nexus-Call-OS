# Call Routing & Failover Strategies — Operational Guide

Call Routing rules govern how inbound and outbound calls are dispatched, prioritizing **Zero-Cost Routes** and providing **Automatic Secondary Failover Backups**.

---

## 🎯 Role in Live Phone Calls & Purpose
When an AI Agent places a call, Call Routing rules evaluate primary routes (e.g. Free GSM Gateway SIM) first. If the line is busy, offline, or congested, the system automatically switches to a secondary backup route (e.g. Cloud Telnyx SIP) in <50ms without dropping the call.

---

## 📌 Kahan Use Hoga? (Where Is This Used?)
- Used for high-availability call dispatching across outbound campaigns and inbound customer hotlines.

---

## 💡 Real-World Voice Calling Example
- **Scenario**: Outbound sales campaign dialing out via Android GSM Gateway #1.
- **Execution**: If GSM Gateway #1 line is currently active on another call, the routing rule automatically fails over to Cloud Telnyx SIP in 14ms. The call connects smoothly without failure.

---

## 🚀 Project me Kyu Zaroori hai? (Why Is This Critical?)
1. **100% Call Uptime**: Ensures calls never drop due to carrier congestion or hardware disconnection.
2. **Cost Optimization**: Always attempts free local SIM routes before falling back to paid cloud APIs.
3. **Interactive Simulator**: Test rules visually with the **Call Routing Simulator** in the modal popup.

---

## 🛠️ Step-by-Step Setup Instructions
1. **Rule Name & Direction**: Specify rule name and direction (Inbound, Outbound, Bidirectional).
2. **Primary Route**: Select primary route (e.g. `GSM Gateway #1`).
3. **Secondary Failover Route**: Select secondary failover route (e.g. `Telnyx Enterprise Voice`).
4. **Run Simulation**: Click `Test Routing Simulator` to verify route matching before going live.
