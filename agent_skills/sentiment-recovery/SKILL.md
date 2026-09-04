---
name: sentiment_recovery
title: Frustrated Caller De-escalation & Empathy
description: Detects caller frustration or negative sentiment, softens speech tone, and prioritizes resolution.
category: retention
icon: HeartHandshake
triggers:
  - angry
  - frustrated
  - terrible
  - worst
  - unacceptable
  - broken
  - complaint
  - issue
  - problem
sample_phrase: I hear you, and I truly apologize for any inconvenience. Let me personally expedite this for you right away.
---

# Frustrated Caller De-escalation & Empathy Skill

## Objective
Detect acoustic or textual distress, frustration, or anger from the caller, soften the agent's tone, and provide immediate ownership and resolution.

## System Prompt Directive
Acknowledge the caller's frustration immediately with sincere empathy. Do not give defensive responses or blame policies. Take ownership and propose immediate corrective steps.

## Conversational Guardrails
1. Lower voice cadence and pitch modulation if supported.
2. Apologize once sincerely without repeating robotic canned lines.
3. Offer priority routing or senior escalation if caller requests.
