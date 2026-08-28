# System & Prompt Variables Registry — Operational Guide

The Variables Registry manages **Dynamic Customer Placeholders & Secret Tokens** used across AI voice prompts, scripts, and API tool integrations.

---

## 🎯 Role in Live Phone Calls & Purpose
Variables allow AI Voice Agents to personalize conversations for each caller dynamically instead of speaking generic, robotic sentences.

---

## 📌 Kahan Use Hoga? (Where Is This Used?)
- Used in call greetings, payment reminder calls, appointment verifications, and custom tool parameters (`{{customer_name}}`, `{{pending_amount}}`, `{{due_date}}`).

---

## 💡 Real-World Voice Calling Example
- **Scenario**: Outbound bill collection campaign dialing 1,000 customers.
- **Execution**: The AI Agent dynamically replaces variables during the live phone call:
  > *"Namaste Rahul ji! Calling from City Clinic to remind you that your bill of ₹2,500 is due on 15th August."*

---

## 🚀 Project me Kyu Zaroori hai? (Why Is This Critical?)
1. **Hyper-Personalized Calls**: Makes AI Agent calls feel 100% natural and human-like.
2. **Encrypted Secret Storage**: Sensitive API keys and auth tokens are masked with secure reveal toggles.
3. **Flexible Scopes**: Supports Workspace, Agent, Campaign, and Contact level variable scopes.

---

## 🛠️ Step-by-Step Setup Instructions
1. **Define Variable Key**: Enter key identifier (e.g. `customer_name`, `due_date`).
2. **Select Data Type & Scope**: Choose String, Number, Date, Boolean, or Secret across Workspace or Campaign scope.
3. **Set Default Value**: Provide fallback default value if caller attribute is missing.
