# Reusable Prompt Templates & Versioning — Integration & Architecture Guide

## Overview & Architecture
The **Prompt Templates Registry** centralizes reusable system persona prompts, conversation scripts, and guardrail instructions across all workspace AI Voice Agents.

---

## Key Features & Template Controls

### 1. Template Types & Categories
- **System Personas**: Ground the core identity, tone, and goals of outbound SDRs, inbound support agents, or booking assistants.
- **Guardrail Prompts**: Enforce regulatory compliance, off-topic boundaries, and profanity filters.
- **Outbound Campaign Scripts**: Ground automated dialer intro greetings and objection handling.

### 2. Variable Detection & Interpolation
- Prompts support dynamic variable tags formatted as `{{variable_name}}` (e.g. `{{customer_name}}`, `{{business_name}}`, `{{appointment_date}}`).
- The editor automatically scans prompt bodies for variable tags and validates whether the variable exists in the central Variable Registry.

### 3. Version Control & Model Tuning
- **Version Numbering**: Tracks revisions (e.g. `v1.0.0`, `v2.4.0`) to prevent accidental breaking changes during live campaign calls.
- **Model Parameters**: Configures target LLM temperature (e.g. `0.7`), max output tokens (`500`), and structured JSON response schemas.
