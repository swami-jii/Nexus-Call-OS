# Nexus Call OS - Call Routing & Failover Integration Guide

Call Routing rules control inbound and outbound call dispatching, prioritizing low-cost routes and managing failover backups.

## 🎯 Role in Live Phone Calls
1. Dynamically matches incoming and outgoing phone numbers to designated dispatch trunks.
2. Prioritizes zero-cost local SIM Gateways for initial call attempts.
3. Automatically switches to secondary backup carriers (e.g. Cloud SIP) upon network congestion or 5xx errors.
4. Provides an Interactive Routing Simulator to test call dispatches without placing live calls.

## 🛠️ Key Configuration Parameters
- **Direction & Priority**: Set direction to Inbound, Outbound AI Campaigns, or Bidirectional.
- **Primary Dispatch Route**: Assign primary route (e.g. Samsung Galaxy S22 GSM Gateway #1).
- **Secondary Failover Route**: Assign backup route (e.g. Telnyx Enterprise Voice).
- **Simulator Tracing**: Test call dispatches against live match conditions and inspect latency and cost estimates.

## 🔗 Official Developer API Docs
- **RFC 3263 SIP Server Location**: https://datatracker.ietf.org/doc/html/rfc3263
