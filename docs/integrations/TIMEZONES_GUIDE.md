# Worldwide Timezones & Regional Schedules — Integration & Operating Guide

## Overview & Architecture
The **Timezones & Regional Schedules Library** supports 50+ IANA timezone identifiers (Asia/Kolkata, America/New_York, Europe/London, Asia/Dubai, etc.) to ensure accurate call scheduling, appointment calendar booking, and time-aware conversations.

---

## Supported Timezone Regions
- 🇮🇳 **Asia/Kolkata (IST +05:30)**: India Master Standard Time.
- 🇺🇸 **America/New_York (EST -05:00)**: US East Coast.
- 🇺🇸 **America/Chicago (CST -06:00)**: US Central.
- 🇺🇸 **America/Los_Angeles (PST -08:00)**: US West Coast.
- 🇬🇧 **Europe/London (GMT/BST +00:00)**: UK & GMT Standard.
- 🇪🇺 **Europe/Paris & Berlin (CET +01:00)**: Central Europe.
- 🇦🇪 **Asia/Dubai (GST +04:00)**: UAE & Gulf Cooperation Council.
- 🇸🇬 **Asia/Singapore (SGT +08:00)**: Singapore & Southeast Asia.
- 🇦🇺 **Australia/Sydney (AEST +10:00)**: Australia Eastern Time.
- 🌐 **UTC (Coordinated Universal Time +00:00)**: Global normalized standard.

---

## Key Configuration Parameters
- **Automatic DST Adjustments**: Automatically calculates Daylight Saving Time offsets.
- **Calendar Appointment Alignment**: Maps caller relative dates (e.g. *"tomorrow at 3 PM"*) to absolute UTC timestamps matching business Google/Outlook Calendars.
