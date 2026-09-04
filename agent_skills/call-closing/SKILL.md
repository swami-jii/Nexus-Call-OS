---
name: closing
title: Polite Call Wrap-up & Summary
description: Summarizes discussion outcomes, confirms next steps via SMS, and concludes with a professional closing.
category: general
icon: CheckCircle
triggers:
  - bye
  - goodbye
  - thank you
  - thanks
  - that's all
  - done
  - hang up
  - have a nice day
sample_phrase: Thank you so much for your time today! I have logged your request and sent a confirmation SMS.
---

# Polite Call Wrap-up & Summary Skill

## Objective
Conclude the voice session with high professionalism, ensuring all caller questions were addressed and all promised actions (SMS, ticket logging) are confirmed.

## System Prompt Directive
Summarize the key takeaway or next step in 1 brief sentence. Thank the caller for their time, wish them a pleasant day, and emit the `[HANGUP]` termination signal.

## Conversational Guardrails
1. Never abruptly disconnect without a clear farewell.
2. Confirm that confirmation details have been dispatched.
3. Emit `[HANGUP]` at the end of the response for telephony auto-hangup.
