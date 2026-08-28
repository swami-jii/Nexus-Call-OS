# Business Working Hours & After-Hours Routing — Operational Guide

Working Hours define your organization's **Operating Schedules, Shift Schedules, and After-Hours Call Rules**.

---

## 🎯 Role in Live Phone Calls & Purpose
Calls received during business hours are handled normally by AI Voice Agents or routed to live staff. Calls received after-hours automatically trigger designated after-hours rules (e.g. 24/7 AI Emergency Receptionist, Voicemail Recording, or WhatsApp Bot trigger).

---

## 📌 Kahan Use Hoga? (Where Is This Used?)
- Used for inbound call routing evaluation based on local time and office schedules.

---

## 💡 Real-World Voice Calling Example
- **Scenario**: Patient calls a clinic at 10:00 PM on Sunday.
- **Execution**: The system evaluates Working Hours, sees the clinic is closed, and activates the **24/7 AI Emergency Receptionist**. The AI Agent answers immediately, books a Monday morning appointment, and sends an SMS confirmation.

---

## 🚀 Project me Kyu Zaroori hai? (Why Is This Critical?)
1. **Never Miss a Lead**: Ensures callers receive immediate AI assistance even at 2 AM.
2. **Flexible Shift Config**: Supports 24/7 hotline toggles, custom shifts, and Daylight Saving Time (DST).
3. **Custom After-Hours Actions**: Trigger custom webhooks or emergency call forwards.

---

## 🛠️ Step-by-Step Setup Instructions
1. **Set Timezone**: Choose timezone from 50+ worldwide IANA timezones.
2. **Set Weekly Schedule**: Configure opening and closing times for Monday to Sunday.
3. **Choose After-Hours Action**: Select 24/7 AI Receptionist, Forward to Emergency Line, or Voicemail.
