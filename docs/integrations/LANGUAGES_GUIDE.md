# Languages & Locales Master Library — Integration & Operating Guide

## Overview & Architecture
The **Languages & Locales Master Library** provides multi-lingual speech recognition, translation, and text-to-speech synthesis capabilities across 50+ international languages and regional accent variants.

---

## Supported Languages & Accent Locales
- 🇮🇳 **Hindi (India)** `hi-IN`: Standard Hindi speech recognition and natural Indian accent voice synthesis.
- 🇺🇸 **English (United States)** `en-US`: Standard American English with sub-100ms real-time STT & TTS.
- 🇬🇧 **English (United Kingdom)** `en-GB`: British accent speech models and localized vocabulary.
- 🇮🇳 **English (India)** `en-IN`: Indian English accent tuned for seamless bilingual code-switching.
- 🇪🇸 **Spanish (Spain & LATAM)** `es-ES` / `es-MX`: European Spanish and Latin American regional accents.
- 🇫🇷 **French (France & Canada)** `fr-FR` / `fr-CA`: European French and Canadian Québécois speech.
- 🇩🇪 **German (Germany)** `de-DE`: High-precision German speech recognition.
- 🇦🇪 **Arabic (UAE & Gulf)** `ar-AE` / `ar-SA`: Modern Standard Arabic & Khaleeji regional dialects.
- 🇵🇹 **Portuguese (Brazil)** `pt-BR`: Brazilian Portuguese conversational voice synthesis.
- ⚙️ **Custom Language Code & Locale**: Custom IANA language code (e.g. `ta-IN` Tamil, `te-IN` Telugu, `mr-IN` Marathi, `bn-IN` Bengali).

---

## Key Configuration Parameters

### 1. Primary Language Code
Select standard IANA language-locale pairs (e.g. `hi-IN`, `en-US`) or define custom locale codes.

### 2. Code-Switching & Dual-Language Mode
Enables AI agents to dynamically switch between English and regional languages (e.g. Hinglish: mixing Hindi and English seamlessly during a live call).

### 3. Speech Phoneme & Pronunciation Override
Specify phonetic IPA (International Phonetic Alphabet) spellings for brand names, customer names, or specialized local words to prevent TTS mispronunciations.

---

## Single Source of Truth (SSOT) Integration
Configured languages sync automatically across STT speech recognizers, ElevenLabs/Cartesia TTS voices, and AI Agent persona prompts.
