# Custom Fields & Dynamic Metadata Tags — Operational Guide

Custom Fields allow creating **Custom Business Metadata Attributes** for Contacts, Calls, Agents, and Workflows without modifying database schemas.

---

## 🎯 Role in Live Phone Calls & Purpose
Every business has unique data requirements. A medical clinic needs to store insurance carrier names, while a logistics company needs to store tracking numbers.

Custom Fields allow defining custom attributes that your AI Voice Agent can automatically extract and fill during call conversations.

---

## 📌 Kahan Use Hoga? (Where Is This Used?)
- Used for saving caller metadata, filtering campaign leads, and syncing custom entity fields directly to CRM systems (HubSpot, Salesforce, Zoho).

---

## 💡 Real-World Voice Calling Example
- **Scenario**: A dental clinic tracking patient insurance details.
- **Execution**: The AI Agent asks the caller: *"Which insurance provider do you have?"* The caller responds *"Delta Dental"*. The AI Agent automatically saves `insurance_carrier = "Delta Dental"` into the patient's custom field record.

---

## 🚀 Project me Kyu Zaroori hai? (Why Is This Critical?)
1. **Enterprise CRM Flexibility**: Allows enterprise clients to track custom business parameters easily.
2. **Dynamic UI Input Controls**: Automatically renders custom input fields when "Custom..." is selected in dropdowns.
3. **Seamless Export**: Custom field attributes are exported clean in call logs and reports.

---

## 🛠️ Step-by-Step Setup Instructions
1. **Field Key & Display Name**: Enter field key (e.g. `insurance_carrier`) and display label.
2. **Select Entity & Data Type**: Choose Entity Binding (Contacts, Calls, Agents) and Data Type (Text, Number, Date, Boolean, Dropdown Options).
3. **Set Constraints**: Check Required, Searchable, Filterable, or Sortable flags.
