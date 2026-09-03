---
name: telephony-voice-engine
description: >-
  Enterprise Full-Duplex Telephony Voice Calling Engine.
  Governs VAD noise gating, speech recognition debouncing, dynamic provider LLM invocation
  from active user API integrations, LLM-native multilingual intent & auto-hangup detection
  across 104+ global languages, and dual-sided call audio recording.
---

# Enterprise Telephony Voice Engine Standard (104+ Global Languages)

This skill defines the enterprise-grade, zero-hardcoded conversational telephony standard across Live Call Studio, Android GSM Gateways, and SIP Cloud Telephony.

---

## 1. Dynamic Provider & Integration SSOT
- **Active Integration Architecture**: The voice engine never hardcodes specific LLM providers or models. It dynamically queries and resolves the user's active credentials from the **API & Integrations** subsystem (`LlmProvider`, `ProviderCredential`, `Integration`).
- **Universal Provider Support**: Seamlessly executes across all supported platforms:
  - **Google Gemini** (Gemini 2.5 Flash, Gemini 3.5 Flash, Gemini Pro)
  - **OpenAI** (GPT-4o, GPT-4o-mini, o1/o3-mini)
  - **Anthropic** (Claude 3.5 Sonnet, Claude 3.5 Haiku)
  - **Groq** (Llama 3.3 70B, Mixtral 8x7B)
  - **DeepSeek** (DeepSeek V3, DeepSeek R1)
  - **OpenRouter / Mistral / Self-Hosted vLLM & Ollama**
- **Model Integrity**: The engine always prioritizes the exact LLM model selected in the Agent / Studio configuration as the authoritative Single Source of Truth (SSOT).

---

## 2. 104+ Global Languages Cognitive Comprehension
- **Zero Hardcoding Principle**: Never use static keyword dictionaries or regex word lists. The LLM possesses innate semantic understanding across 104+ global languages and cultural dialects.
- **Dynamic Language Mirroring**: The LLM autonomously identifies the caller's spoken language (Hindi, English, Spanish, Arabic, French, German, Japanese, Russian, Bengali, Tamil, Telugu, Marathi, Gujarati, Punjabi, etc.) and mirrors the identical language and conversational dialect in real time.
- **Natural Spoken Cadence**: Phone responses are structured for voice delivery (1–2 concise conversational sentences, maximum 25 words) without robotic monologues.

---

## 3. Speech-to-Text & Noise Suppression (Caller Channel)
- **VAD Energy Gating**: Prevent single-character acoustic noise, breath sounds, or background clicks from triggering the LLM. Require a minimum threshold of valid speech energy.
- **Conversational Turn Debouncing**: Accumulate streaming voice transcripts in a conversational speech buffer. Allow an 800–900ms silence interval before sending to the LLM so full compound sentences are never fragmented.
- **Sub-50ms Smart Barge-In**: The instant caller speech is detected while the AI is speaking, immediately mute/abort the TTS playback buffer and yield the talking floor to the caller.

---

## 4. LLM-Native Multilingual Call Wrap-Up & Auto-Hangup
- **Cognitive Signal Detection**: The LLM evaluates caller intent semantically across all 104+ languages. When the caller indicates their inquiry is resolved, they want to hang up, or say goodbye in ANY language:
  1. The LLM generates a culturally natural, warm 1-sentence closing farewell in the caller's language.
  2. The LLM appends the telemetry switchboard signal `[HANGUP]` to its response payload.
  3. The telephony router strips `[HANGUP]` before speech synthesis, plays the clean farewell audio, and automatically disconnects the call gracefully (`handleEndCall()`) upon speech completion.

---

## 5. Synchronized Dual-Sided Call Recording
A complete telephony recording must preserve the two-way conversation:
- **Caller Channel**: Microphone PCM audio stream captured via Web Audio `MediaStreamAudioSourceNode`.
- **AI Channel**: Neural TTS synthesized speech stream.
- **Unified Mixer**: `MediaStreamAudioDestinationNode` mixing both tracks in real-time into a unified audio stream (`MediaRecorder`).
- **Persistence**: Persisted to `uploads/recordings/{call_id}.mp3` and surfaced in Post-Call Intelligence and Call History for instant HD playback and download.
