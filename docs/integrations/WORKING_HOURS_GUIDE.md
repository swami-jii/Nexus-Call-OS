# Business Working Hours & Operating Shifts — Integration & Operating Guide

## Overview & Architecture
**Business Working Hours** define the active operational hours, holidays, weekend shifts, and after-hours routing behaviors for AI Voice Campaigns and Inbound Phone Trunks.

---

## Key Features & Scheduling Controls

### 1. Shift & Schedule Definitions
- **Standard Business Hours**: Mon-Fri 9:00 AM - 6:00 PM.
- **24/7 Always On**: Round-the-clock automated AI availability.
- **Custom Shift Hours**: Define custom daily start/end times per day of week (e.g. Saturday 10 AM - 2 PM, Sunday Closed).
- **Holiday Override Schedules**: Define specific holiday dates (e.g. New Year, Diwali, Christmas) where special holiday greetings play.

### 2. After-Hours Routing Actions
- 🤖 **AI Voicemail & Call Collector**: AI agent greets caller, collects intent, and logs a structured CRM lead.
- 📱 **Forward to Emergency Mobile**: Forwards urgent calls to an on-call manager's phone number.
- 🎙️ **Play Out-of-Office Audio Announcement**: Plays pre-recorded WAV/MP3 greeting and gracefully ends call.
- ✏️ **Custom Action**: Route to after-hours queue or trigger automated SMS follow-up.

---

## Single Source of Truth (SSOT) Integration
Working hours rules auto-evaluate caller timezones in real time to prevent placing outbound calls outside legal TCPA calling hours.
