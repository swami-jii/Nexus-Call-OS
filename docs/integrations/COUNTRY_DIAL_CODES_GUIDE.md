# 📞 Sovereign Country Dial Codes & Telephony Carrier Routing Guide

## Overview & Architecture
The **Country Dial Codes Directory** is the Single Source of Truth (SSOT) for sovereign international dialing prefixes, ISO 3166-1 alpha-2/3 identifiers, and E.164 outbound telephony carrier routing across Nexus Call OS.

It covers all **243 sovereign nations and territories** extracted from official AT&T and ITU-T specifications.

---

## 🎯 Key Features & Capabilities

1. **⚡ 1-Click Country Auto-Fill**:
   - Selecting any nation from the catalog automatically sets:
     - International Dial Code (e.g. `+91`, `+1`, `+971`, `+44`, `+1 684`)
     - ISO Alpha-2 & Alpha-3 Codes (`IN` / `IND`, `US` / `USA`, `AE` / `ARE`)
     - Flag Emoji
     - Geographic Region (`India`, `Asia-Pacific`, `Europe`, `Middle East & Africa`, `Americas & Caribbean`)
     - Default Outbound Carrier Route

2. **⚡ Add All 243 Sovereign Codes**:
   - Use the toolbar button **"⚡ Add All 243 Sovereign Codes"** to instantly apply all 243 country dial codes to your workspace with 1 click.

3. **📞 Live Call Studio Softphone Keypad Sync**:
   - Selecting a country or entering a phone number auto-detects the country flag and formats the dialer prefix in real-time.

4. **🛰️ Multi-Carrier Route Assignment**:
   - Map countries to specific routes:
     - Direct PSTN / GSM Companion SIM (Zero-Charge Calling)
     - Twilio Elastic SIP Trunk (Global Low Latency)
     - Telnyx Global Carrier Route
     - Wholesale PJSIP Trunk

---

## 🛠️ Configuration Fields

| Field Name | Type | Description | Example |
|---|---|---|---|
| `country_name` | String | Sovereign country name | `United Arab Emirates` |
| `dial_code` | String | E.164 international dial prefix | `+971` |
| `iso2` | String (2) | ISO 3166-1 alpha-2 code | `AE` |
| `iso3` | String (3) | ISO 3166-1 alpha-3 code | `ARE` |
| `flag` | String | Regional indicator emoji | `🇦🇪` |
| `region` | Enum | Geographic continent/region | `Middle East & Africa` |
| `carrier_route`| String | Assigned telephony trunk | `Direct PSTN / GSM Route` |
| `status` | Enum | Active / Draft / Archived | `Active` |

---

## 🔗 Official Standards & Specifications
- [ITU-T E.164 International Public Telecommunication Numbering Plan](https://www.itu.int/rec/T-REC-E.164)
- [ISO 3166 Country Codes](https://www.iso.org/iso-3166-country-codes.html)
- [AT&T Global Dialing Reference](https://www.att.com/international/long-distance/)
