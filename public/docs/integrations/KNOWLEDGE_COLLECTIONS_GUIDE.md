# Knowledge Collections & Vector RAG — Operational Guide

Knowledge Collections act as the **Real-Time Knowledge Brain & Document Memory** for all AI Voice Agents in Nexus Call OS.

---

## 🎯 Role in Live Phone Calls & Purpose
When an AI Voice Agent is on a live phone call with a customer, the caller may ask specific questions about business pricing, clinic policies, or service manuals. 

Knowledge Collections convert uploaded PDFs, FAQs, and websites into vector embeddings so the AI Agent can ground its answers in verified company documents in real time.

---

## 📌 Kahan Use Hoga? (Where Is This Used?)
- Used during live inbound and outbound phone conversations when the caller asks questions about company procedures, pricing plans, cancellation rules, or trouble-resolution FAQs.

---

## 💡 Real-World Voice Calling Example
- **Scenario**: Customer calls a dental clinic and asks: *"Aapki appointment cancellation fee kitni hai aur insurance claim kaise process hoga?"*
- **Execution**: The AI Voice Agent queries the indexed clinic SOP document in less than **18 milliseconds**, retrieves the exact chunk, and responds in natural human voice: *"Our cancellation fee is waived if cancelled 24 hours in advance, and insurance claims are submitted automatically at check-in."*

---

## 🚀 Project me Kyu Zaroori hai? (Why Is This Critical?)
1. **Eliminates LLM Hallucinations**: Prevents AI agents from inventing fake prices or wrong policies.
2. **Instant Sub-Second Retrieval**: RAG vector lookup takes <20ms, ensuring zero awkward delays during phone calls.
3. **1-Click Document Grounding**: Businesses can upload any PDF or website URL to train their voice agents immediately.

---

## 🛠️ Step-by-Step Setup Instructions
1. **Upload Documents**: Upload physical PDF, DOCX, TXT, CSV files or enter a website URL.
2. **Select Chunking Strategy**: Choose `Recursive Character (1024 tokens)` for standard text docs.
3. **Select SSOT Embedding Model**: Pulled dynamically from Tab 1 active configured embedding providers (e.g. OpenAI `text-embedding-3-small`).
4. **Test Retrieval**: Test vector search inside the popup modal to verify cosine match scores and snippets before going live.
