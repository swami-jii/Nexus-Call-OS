# Departments & Escalation Transfer Routing — Integration & Operating Guide

## Overview & Architecture
**Departments & Escalation Transfer Routing** defines internal organizational divisions (Sales, Customer Support, Billing, Technical Escalations) and their live SIP/PSTN call transfer endpoints.

---

## Supported Transfer Strategies
- 👥 **Round-Robin Agent Distribution**: Distributes transfers evenly among available team agents.
- ⚡ **First-Available Ring All**: Rings all department extension numbers simultaneously; connects to the first agent who answers.
- 🛡️ **Manager Priority Escalation**: Routes VIP callers directly to a designated department lead or supervisor.
- 🤖 **AI Pre-Screening & Hand-off**: AI agent pre-qualifies the call intent, gathers caller notes, and performs a warm transfer with live screen-pop context.
- ✏️ **Custom Transfer Strategy**: User-defined transfer script or PBX queue integration.

---

## Key Configuration Parameters
- **Department Manager / Lead**: Assigned contact lead for escalation alerts.
- **Transfer Destination**: Extension number, SIP URI (e.g. `sip:sales@company.com`), or PSTN phone number.
- **Warm Transfer Speech Summary**: Transmits structured JSON call summary to human agent prior to audio bridge connection.
