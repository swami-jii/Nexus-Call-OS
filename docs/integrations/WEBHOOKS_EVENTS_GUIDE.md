# Webhook Endpoints & Realtime Events — Integration & Architecture Guide

## Overview & Architecture
The **Webhooks & Events Registry** broadcasts real-time telemetry, call disposition outcomes, audio recording URLs, and customer interaction events to external backend services and CRMs.

---

## Endpoint & Security Specifications

### 1. HTTP Methods & Auth Types
- **HTTP Methods**: `POST`, `PUT`, `GET`, `DELETE`.
- **Authentication Modes**: None, Bearer Token, API Key Header, Basic Auth, HMAC SHA-256 Signature.

### 2. Supported System Events
- `call.started` — Fired when call connects to PSTN carrier or SIP trunk.
- `call.answered` — Fired when human caller answers the line.
- `call.completed` — Fired on call termination with final disposition and call duration.
- `call.failed` — Fired on network error or busy signal.
- `agent.started` — Fired when AI agent initializes LLM context.
- `appointment.created` — Fired when an appointment booking tool executes.
- `contact.created` / `contact.updated` — Fired on CRM lead updates.

### 3. Delivery Settings & Testing
- **Timeout & Retries**: Configure HTTP timeout (e.g. 10s), retry attempts (up to 5), and exponential backoff retry delays.
- **Interactive Webhook Tester**: Trigger a sample event trace to inspect HTTP status codes and response latencies in real time.
