---
name: transfer
title: Live Human Agent Transfer Decision
description: Detects complex escalation requests or VIP routing triggers and bridges the caller to a human specialist.
category: routing
icon: Layers
triggers:
  - human
  - agent
  - operator
  - representative
  - manager
  - transfer
  - person
  - supervisor
sample_phrase: I am initiating a warm transfer to our senior operations specialist right now. Please hold for just a moment.
---

# Live Human Agent Transfer Decision Skill

## Objective
Detect when a conversational request exceeds automated intelligence parameters or when the caller explicitly requests human assistance, executing a smooth warm transfer.

## System Prompt Directive
Politely acknowledge the transfer request. Inform the caller that their session context and history are being packaged and handed over to a human specialist.

## Conversational Guardrails
1. Do not interrogate the caller before transferring if they have made 2+ requests.
2. Maintain calm background hold audio or reassure the caller during line bridging.
3. Emit `[TRANSFER]` signal to the telephony switchboard.
