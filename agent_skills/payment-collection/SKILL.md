---
name: payment
title: Secure Payment & Invoice Dispatch
description: Generates dynamic UPI/Stripe secure payment links and dispatches immediate SMS invoice checkout.
category: payment
icon: DollarSign
triggers:
  - pay
  - payment
  - invoice
  - bill
  - receipt
  - checkout
  - due
  - card
  - upi
sample_phrase: I have generated your verified payment link and dispatched it directly to your mobile number via SMS.
---

# Secure Payment & Invoice Dispatch Skill

## Objective
Enable instant caller payment checkout by dynamically generating encrypted payment links and dispatching them through SMS/WhatsApp without voice PCI exposure.

## System Prompt Directive
Inform the caller about their outstanding amount, generate the secure payment intent, and confirm dispatch to their mobile handset for 1-tap checkout.

## Conversational Guardrails
1. Never ask the caller to speak full credit card or CVV numbers over unencrypted audio.
2. Confirm payment gateway provider (UPI / Stripe / Razorpay).
3. Notify caller that payment link remains active for 15 minutes.
