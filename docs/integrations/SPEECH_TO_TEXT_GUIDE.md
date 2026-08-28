# Nexus Call OS - Speech-to-Text (STT) Integration Guide

Speech-to-Text (STT) engines perform real-time speech recognition for live phone streams.

## 🎯 Role in Live Phone Calls
1. Captures raw audio packets from PSTN telephone trunks (Twilio, Telnyx, Plivo) or WebRTC browser callers.
2. Performs continuous stream transcription with sub-150ms latency.
3. Emits word-level timestamps for instant user barge-in (interruption) detection.

## 🛠️ Key Configuration Parameters
- **Telephony Audio Codec**: `PCM 8kHz` for PSTN phone lines, `Opus 16kHz` for HD browser sessions.
- **Speaker Diarization**: Identifies agent vs caller channels.
- **Smart Formatting**: Formats dates, numbers, and phone numbers automatically.

## 🔗 Official Developer Consoles & API Docs
- **Deepgram ASR**: https://developers.deepgram.com/
- **OpenAI Whisper**: https://platform.openai.com/docs/guides/speech-to-text
- **AssemblyAI**: https://docs.assemblyai.com/
