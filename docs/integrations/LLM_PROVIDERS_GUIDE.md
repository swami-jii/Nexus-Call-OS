# Nexus Call OS - LLM Providers Integration Guide

Large Language Models (LLMs) serve as the **Conversational Brain** for all AI voice agents in Nexus Call OS.

## 🎯 Role in Live Phone Calls
During a real-time call:
1. Speech-to-Text engine transcribes caller audio into text.
2. Transcript + Persona System Prompt + Conversation History is sent to the configured LLM Provider.
3. LLM executes function tools (CRM lookup, scheduling) and generates text responses with <250ms latency.
4. Voice Synthesizer (TTS) streams the generated text back as human speech.

## 🛠️ Key Configuration Parameters
- **API Key Secret**: Paste your secret key (e.g., `sk-proj-...`). Pasting a valid key automatically fetches all live models available on your account.
- **Dynamic Strategy (Recommended)**: Automatically selects the fastest, most optimal model for the agent.
- **Fixed Model Lock**: Locks all bound agents to a specific model ID (e.g. `gpt-4o`, `gemini-2.0-flash`).

## 🔗 Official Developer Consoles & API Docs
- **OpenAI Platform**: https://platform.openai.com/docs
- **Anthropic Claude**: https://docs.anthropic.com/
- **Google AI Studio**: https://aistudio.google.com/
- **Groq LPU Acceleration**: https://console.groq.com/docs
- **DeepSeek API**: https://platform.deepseek.com/
