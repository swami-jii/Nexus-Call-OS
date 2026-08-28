# Business & Industry Master Library — Integration & Operating Guide

## Overview & Architecture
The **Business & Industry Master Library** defines the vertical industry classification for AI Voice Agents operating within Nexus Call OS. Setting a business type automatically loads domain-specific vocabulary, compliance guardrails, default prompt personas, and field validation rules.

---

## Supported Industry Verticals
- 🏥 **Hospital & Healthcare**: HIPAA compliance guardrails, medical appointment booking, patient intake, prescription status.
- 🦷 **Dental Clinic**: Hygiene recall schedules, emergency toothache routing, treatment plan reminders.
- 🏡 **Real Estate & Property Management**: Lead qualification, property tour scheduling, tenant maintenance requests.
- 🚗 **Automotive Dealership & Service**: Test drive bookings, vehicle service maintenance reminders, trade-in valuations.
- ⚖️ **Legal & Professional Services**: Case intake consultation, attorney scheduling, confidential client screening.
- 🏨 **Hospitality & Hotel Reservations**: Room bookings, concierge inquiries, event space scheduling.
- 🛍️ **E-Commerce & Retail Support**: Order status lookup, refund requests, delivery tracking.
- 💻 **SaaS & B2B Technology**: Demo bookings, technical support escalation, trial conversion calls.
- 🎓 **Education & Admissions**: Student enrollment inquiries, course counseling, campus visit scheduling.
- 📈 **Financial Services & Wealth Management**: Investment consultation, loan pre-qualification, account status verification.
- ⚙️ **Custom Business Vertical**: User-defined business domain with custom persona prompts and specialized terminology.

---

## Key Configuration Parameters

### 1. Business Category Selection
Choose from the 50+ enterprise business categories or enter a **Custom Business Industry** (e.g. *Solar Panel Installation & Contracting*).

### 2. Industry Terminology & Acronyms
Define industry-specific jargon, acronyms, and phonetic pronunciations so Speech-to-Text (STT) and LLM engines recognize technical terms without misinterpretation.

### 3. Compliance Guardrails
- **Healthcare**: Enforces HIPAA privacy controls and prevents diagnostic medical advice.
- **Financial**: Enforces PCI-DSS and SEC compliance rules during live call sessions.
- **Legal**: Mandates non-attorney disclaimer warnings during intake.

---

## Single Source of Truth (SSOT) Integration
When a Business Type is registered, it becomes immediately available across:
- **AI Voice Agents**: Selected in agent setup to ground persona instructions.
- **Live Call Studio**: Auto-populates industry specific caller context panels.
- **Knowledge Base (RAG)**: Filters document retrieval results by industry domain.
