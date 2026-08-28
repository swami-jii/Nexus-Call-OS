# Webhook Endpoints & Realtime Telemetry Events — Operational Guide

Webhooks serve as the **Automation Bridge & Data Dispatcher** connecting Nexus Call OS to external CRMs, databases, and third-party tools (Salesforce, HubSpot, Zapier, Custom Backends).

---

## 🎯 Role in Live Phone Calls & Purpose
Webhooks automatically send real-time event notifications during and after phone calls:
- `call.started`: Triggered when an inbound call connects or outbound call dials out.
- `call.completed`: Sends complete call recording URLs, transcript text, call duration, sentiment, and resolution codes when a call ends.
- `appointment.created`: Triggered when an AI Agent schedules a booking during a live call.

---

## 📌 Kahan Use Hoga? (Where Is This Used?)
- Used for instant CRM synchronization, sending automated post-call SMS/WhatsApp confirmations, and pushing call logs into internal databases.

---

## 💡 Real-World Voice Calling Example
- **Scenario**: AI Agent finishes a 3-minute customer support call and books a follow-up appointment.
- **Execution**: The `call.completed` webhook fires instantly, sending call recording links, transcript text, and the booked appointment time directly to your Salesforce CRM and Google Calendar.

---

## 🚀 Project me Kyu Zaroori hai? (Why Is This Critical?)
1. **100% Automated Post-Call Workflows**: Zero manual data copy-pasting required by human staff.
2. **Enterprise Security**: Supports Bearer Tokens, API Key Headers, and HMAC SHA-256 Signature Verification.
3. **Exponential Retry Policy**: Automatic retry delivery logic prevents lost call records during server downtime.

---

## 🛠️ Step-by-Step Setup Instructions
1. **Enter Endpoint URL**: Input your destination HTTPS webhook URL.
2. **Select Authentication Method**: Choose None, Bearer Token, API Key Header, or HMAC Secret.
3. **Subscribe to Events**: Select events to listen to (`call.completed`, `contact.updated`).
4. **Test Webhook**: Click `Test Webhook` to send a sample payload and verify HTTP 200 OK responses.
