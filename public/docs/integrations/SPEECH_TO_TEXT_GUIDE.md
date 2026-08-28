# Speech-to-Text (STT) Recognition — Operational Guide

Speech-to-Text (STT) engines act as the **Ears** of your AI Voice Calling Agents, converting spoken caller audio into text with sub-150ms latency.

---

## 🎯 Role in Live Phone Calls
As the caller speaks into their telephone:
1. The voice audio stream is captured via PSTN phone trunks or WebRTC.
2. The STT engine transcribes the spoken words into text in real time.
3. Features like **Speaker Diarization** distinguish between the caller's voice and the AI agent's voice.
4. Cleaned transcripts are instantly forwarded to the LLM.

---

## 💡 Key Configurations
- **Supported Engines**: Deepgram, OpenAI Whisper, AssemblyAI, Google Speech, Azure Speech, or Local Faster-Whisper servers.
- **Audio Telephony Codecs**: `PCM 8kHz` for traditional phone calls, `Opus 16kHz` for high-definition web calls.
