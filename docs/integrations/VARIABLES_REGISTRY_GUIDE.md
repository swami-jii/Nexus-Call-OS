# System & Prompt Variables Registry — Integration & Architecture Guide

## Overview & Architecture
The **Variables Registry** manages reusable dynamic interpolation tokens (`{{customer_name}}`, `{{business_name}}`, `{{appointment_date}}`) used across LLM prompts, tool definitions, and webhook payloads.

---

## Key Configuration Parameters

### 1. Variable Data Types
- `String` — Standard textual value.
- `Number` — Integer or decimal numerical value.
- `Boolean` — `true` / `false` flag.
- `Date` & `DateTime` — Standardized ISO timestamp.
- `JSON` — Structured JSON object or array payload.
- `Secret` — Masked sensitive token (API keys, authentication secrets).

### 2. Variable Scopes
- **Workspace**: Global defaults accessible across all agents.
- **Organization**: Company-level configuration settings.
- **Agent**: Specific to individual AI Voice Agent personas.
- **Campaign**: Bound to automated outbound dialer campaigns.
- **Workflow**: Scoped within voice workflow execution nodes.
- **Contact & Call**: Dynamically populated per individual caller.
