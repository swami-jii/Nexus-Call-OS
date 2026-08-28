# Custom Fields & Metadata Tagging — Integration & Operating Guide

## Overview & Architecture
**Custom Fields & Metadata Tagging** enables defining custom data schemas, dynamic variables (e.g. `{patient_id}`, `{account_balance}`, `{policy_number}`), and CRM sync keys captured during AI voice conversations.

---

## Supported Field Types
- 🔤 **Text / String**: Freeform text input (e.g. Customer Name, Address).
- 🔢 **Number / Currency**: Numerical value or monetary amount.
- 📅 **Date & Time**: ISO formatted timestamp.
- 🔘 **Boolean (True/False)**: Binary flag (e.g. `is_vip_customer`).
- 📋 **Single & Multi Select**: Dropdown choice list.

---

## Key Integration Capabilities
- **Real-Time Variable Injection**: Extracted values are injected into active LLM context and tool calls.
- **CRM Sync Mapping**: Auto-syncs field values to HubSpot, Salesforce, Zoho, or custom Webhooks.
