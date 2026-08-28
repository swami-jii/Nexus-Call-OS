# Nexus Call OS - Telephony Carriers Integration Guide

Telephony Carriers connect your AI Voice Agents directly to external PSTN phone networks worldwide.

## 🎯 Role in Live Phone Calls
1. Handles inbound phone calls from customers and routes them to AI agents.
2. Dispatches outbound campaign phone calls for sales, reminders, and follow-ups.
3. Supports DTMF touch-tone signals, call recording, transfers, and caller ID spoofing prevention.

## 🛠️ Key Configuration Parameters
- **Provider Type**: Select Cloud Telephony (Twilio, Plivo, Vonage), Direct SIP Carrier (Telnyx, Bandwidth), DID Carrier (Exotel, Voxbone), Local GSM Carrier, or Custom Voice API Provider.
- **Account Credentials**: Paste Account SID / Key and Auth Token / Secret. Credentials are securely encrypted and masked.
- **Custom Endpoint URL**: If using a Custom Provider, specify your Custom Voice API Base URL and Webhook Callback Secret.
- **Pricing Mode**: Choose Paid (per-minute carrier charges) or Free (zero platform charge). Set per-minute and monthly spending limits.

## 🔗 Official Developer API Docs
- **Twilio Voice API**: https://www.twilio.com/docs/voice
- **Telnyx Voice API**: https://developers.telnyx.com/docs/v2/voice
- **Plivo Voice API**: https://www.plivo.com/docs/voice/
- **Vonage Voice API**: https://developer.vonage.com/en/voice/voice-api/overview
