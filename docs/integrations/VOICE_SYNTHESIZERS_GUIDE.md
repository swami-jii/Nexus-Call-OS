# Nexus Call OS - Voice Synthesizer (TTS) Integration Guide

Text-to-Speech (TTS) voice synthesizers convert LLM responses into hyper-realistic human voice streams.

## 🎯 Role in Live Phone Calls
1. Receives streaming text tokens from the LLM brain.
2. Synthesizes lifelike speech audio with human emotion, pauses, and cadences.
3. Streams audio back through PSTN telephone lines or WebRTC web sockets.

## 🛠️ Key Configuration Parameters
- **Voice Library Auto-Fetch**: Queries provider API to list all trained, cloned, and built-in voice IDs.
- **Audio Output Format**: `PCM 24kHz` for studio quality or `u-Law 8kHz` for phone lines.
- **Stability & Expressiveness**: Controls emotional cadence and speech speed.

## 🔗 Official Developer Consoles & API Docs
- **ElevenLabs TTS**: https://docs.elevenlabs.io/
- **Cartesia Sonic**: https://docs.cartesia.ai/
- **PlayHT**: https://docs.play.ht/
