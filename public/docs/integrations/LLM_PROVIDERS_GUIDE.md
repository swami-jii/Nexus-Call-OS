# LLM Providers Architecture & Operational Guide

Large Language Models (LLMs) serve as the **Conversational Brain** for all AI Voice Calling Agents in Nexus Call OS.

---

## 🎯 Role in Live Phone Calls
During a real-time voice call:
1. Speech-to-Text (STT) transcribes the caller's spoken voice into text.
2. The transcript, along with the Agent's persona script and conversation context, is sent to the LLM.
3. The LLM understands caller intent, queries Knowledge RAG stores or CRM tools if needed, and generates a conversational response.
4. The Voice Synthesizer (TTS) converts the response back into human voice audio in real time.

---

## 🛠️ Key Settings
- **Single Source of Truth (SSOT)**: Configured LLMs in Tab 1 automatically populate across Prompt Templates and Agent settings.
- **API Key Auto-Fetch**: Pasting an API key secret automatically queries the provider API and lists all active models available on your account.
- **Dynamic Strategy**: Workspace automatically chooses the fastest, most capable model for live calls.
