# Reusable System Prompt Templates & Versioning — Operational Guide

Prompt Templates serve as the **Personality, Script & Instruction Manual** for all AI Voice Calling Agents in Nexus Call OS.

---

## 🎯 Role in Live Phone Calls & Purpose
Prompt Templates define how an AI Agent behaves on phone calls—its tone of voice, greeting phrases, objection handling rules, and campaign goals.

Centralized templates allow creating standardized scripts once and binding them to multiple phone agents across your workspace.

---

## 📌 Kahan Use Hoga? (Where Is This Used?)
- Used across Outbound Sales Campaigns (cold calling SDRs), 24/7 Inbound Helpline Agents, Patient Scheduling Bots, and Payment Reminder Calls.

---

## 💡 Real-World Voice Calling Example
- **Scenario**: Launching an Outbound Sales Campaign for 500 leads.
- **Execution**: Select the **Outbound Sales SDR Persona Template (v1.0.0)**. The prompt automatically fills dynamic placeholders:
  > *"Hello {{customer_name}}! Calling from {{business_name}} regarding your pending inquiry..."*

---

## 🚀 Project me Kyu Zaroori hai? (Why Is This Critical?)
1. **1-Click Campaign Deployment**: Deploy new voice personas instantly without writing system prompts from scratch.
2. **Version Control**: Track prompt updates (e.g. `v1.0.0` -> `v2.0.0`) with clean semver versioning.
3. **1-Click JSON/TXT Import**: Drag & drop any `.json` or `.txt` prompt file to auto-parse prompt instructions and variables instantly.

---

## 🛠️ Step-by-Step Setup Instructions
1. **Import File or Type Prompt**: Drag & drop a JSON config file or manually enter Template Name and Instructions.
2. **Select Category & SSOT Model**: Choose category (Outbound Sales, Inbound Support) and select Model Compatibility from Tab 1 SSOT models.
3. **Variable Auto-Scanner**: The editor automatically scans for `{{variable_name}}` tags in real time.
