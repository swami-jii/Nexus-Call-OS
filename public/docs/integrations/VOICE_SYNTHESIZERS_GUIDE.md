# Voice Synthesizers (TTS) — Operational Guide

Voice Synthesizers (Text-to-Speech) act as the **Voice & Vocal Cord** of your AI Calling Agents, converting text responses into ultra-realistic human audio.

---

## 🎯 Role in Live Phone Calls
1. The LLM generates a text response (e.g. *"Your appointment is confirmed for tomorrow at 3 PM."*).
2. The TTS Voice Engine streams lifelike human speech back over the telephone line with natural inflection, emotion, and pace.
3. Sub-20ms streaming latency ensures zero awkward silence during live conversations.

---

## 💡 Key Configurations
- **Supported Engines**: ElevenLabs, Cartesia Sonic, PlayHT, Deepgram Aura, OpenAI Voice, or Local Kokoro TTS.
- **Voice Discovery**: Pasting an API key automatically fetches your custom trained/cloned voices.
- **Telephony Audio Codec**: Output set to `u-Law 8kHz` for phone PSTN trunks or `PCM 24kHz` for web streaming.
