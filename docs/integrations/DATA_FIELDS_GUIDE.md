# Reusable Entity Data Fields — Integration & Architecture Guide

## Overview & Architecture
The **Data Fields Registry** defines structured, reusable data attributes across workspace entities (Contacts, Calls, Agents, Campaigns, Workflows, Appointments).

---

## Entity Bindings & Data Types

### 1. Entity Bindings
- **Contact Entity**: Extends lead profile fields (e.g. `dental_insurance_provider`).
- **Call Entity**: Extends call metadata (e.g. `call_quality_rating`).
- **Agent Entity**: Extends agent configuration attributes.
- **Campaign & Workflow**: Extends automated pipeline attributes.

### 2. Supported Data Types
- Text String, Number, Boolean, Date, DateTime, Email, Phone, URL, Select Dropdown, Multi Select, JSON.

### 3. Capabilities & Attributes
- **Searchable**: Enables indexing field values in CRM search.
- **Filterable**: Enables filtering records in workspace tables.
- **Predefined Options**: Defines allowed options for Select & Multi Select fields with custom option support.
