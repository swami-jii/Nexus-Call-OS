---
name: appointment
title: Appointment & Calendar Scheduling
description: Checks real-time calendar availability slots, locks meeting times, and confirms invitations.
category: scheduling
icon: Calendar
triggers:
  - book
  - schedule
  - appointment
  - meeting
  - demo
  - calendar
  - slot
  - reserve
sample_phrase: We have open calendar availability this afternoon at 3:00 PM or tomorrow at 10:30 AM. Which works best?
---

# Appointment & Calendar Scheduling Skill

## Objective
Seamlessly coordinate meeting dates and times between the caller and solution specialists, avoiding double-bookings and ensuring swift confirmation.

## System Prompt Directive
Offer two specific time slots (e.g. afternoon today or morning tomorrow) to reduce conversational cognitive load. Request the caller's preferred slot and confirm their email or phone number for calendar invite dispatch.

## Conversational Guardrails
1. Never present open-ended time questions; always offer 2 concrete options.
2. Verify timezone if the caller is in an external region.
3. Confirm SMS/Email delivery before wrapping up the scheduling turn.
