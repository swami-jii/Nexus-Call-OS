# Nexus Call OS - Call Dispositions Integration Guide

Call Dispositions standardize post-call resolution outcomes for CRM pipelines, AI analytics, and automated workflows.

## 🎯 Role in Live Phone Calls
1. Classifies call outcomes upon call termination (e.g. Connected, Appointment Booked, Callback Scheduled, DNC).
2. Triggers post-call webhooks to synchronize CRM lead statuses (HubSpot, Salesforce, Zoho).
3. Provides color-coded visual badges for quick agent analytics and campaign reporting.

## 🛠️ Key Configuration Parameters
- **Label & Code**: Define human-readable Disposition Label (e.g. Appointment Booked) and unique Code (e.g. DEMO_BOOKED).
- **Outcome Category**: Map to category (Connected, Sales, Follow-up, Failed, AI Completed, Compliance DNC, Other).
- **Badge Color**: Set hex color for visual UI badging.
- **Webhook Event Secret**: Webhooks broadcast disposition payload events to external endpoints.

## 🔗 Official Developer API Docs
- **HubSpot CRM Call API**: https://developers.hubspot.com/docs/api/crm/calls
