from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from backend.auth.deps import get_current_user
from backend.database.session import get_db
from backend.integrations.deepgram_provider import DeepgramProvider
from backend.integrations.elevenlabs_provider import ElevenLabsProvider
from backend.integrations.llm_provider import GeminiProvider, OpenAIProvider
from backend.integrations.twilio_provider import TwilioProvider
from backend.models.models import User
from backend.integrations.registry_service import registry_service
from backend.voice_pipeline.calling_optimizer import calling_optimizer
from backend.routers.credentials import resolve_credential_key
from backend.integrations.manager import provider_manager

router = APIRouter(prefix="/api/providers", tags=["Voice Provider Layer"])


@router.get("/models")
async def get_provider_models(
    provider: str = "",
    endpoint: str = "",
    api_key: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Dynamically retrieve all available LLM models for the given provider or endpoint."""
    if not provider:
        return {"provider": "", "models": []}
    
    clean_key = (api_key or "").strip()
    if not clean_key or "•" in clean_key or "*" in clean_key or "..." in clean_key:
        resolved = resolve_credential_key(db, str(current_user.organization_id), str(current_user.id), provider)
        if resolved:
            clean_key = resolved

    models = await registry_service.get_llm_models(provider, api_key=clean_key, endpoint=endpoint)
    return {"provider": provider, "models": models}



@router.get("/voices")
async def get_provider_voices(
    provider: str = "",
    api_key: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Dynamically retrieve all available voices for the given voice provider."""
    if not provider:
        return {"provider": "", "voices": []}
        
    clean_key = (api_key or "").strip()
    if not clean_key or "•" in clean_key or "*" in clean_key or "..." in clean_key:
        resolved = resolve_credential_key(db, str(current_user.organization_id), str(current_user.id), provider)
        if resolved:
            clean_key = resolved

    voices = await registry_service.get_voice_models(provider, api_key=clean_key)
    return {"provider": provider, "voices": voices}


@router.get("/health")
async def get_providers_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve health and connection status for all active Voice OS providers."""
    from backend.integrations.health_monitor import ProviderHealthMonitor
    provider_manager.sync_from_database(db, org_id=current_user.organization_id)
    health_status = await provider_manager.get_all_provider_health()
    detailed_health = await ProviderHealthMonitor.get_all_health_statuses()
    return {"status": "online", "providers": health_status, "detailed_capabilities": detailed_health}


@router.post("/test-call")
async def test_telephony_dispatch(
    payload: dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Dispatch a test call through the active Telephony Provider (Twilio)."""
    provider_manager.sync_from_database(db, org_id=current_user.organization_id)
    to_number = payload.get("to_number", "+15550192834")
    from_number = payload.get("from_number", "+18005550199")
    agent_id = payload.get("agent_id", "demo-agent")

    provider = provider_manager.get_telephony_provider()
    result = await provider.initiate_call(
        to_number=to_number, from_number=from_number, agent_id=agent_id
    )
    return result


@router.post("/voices/preview")
async def preview_voice_synthesis(
    payload: dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Synthesize a short preview clip and stream it back directly as audio/mpeg."""
    import httpx
    import os

    provider_name = str(payload.get("provider", "elevenlabs")).lower().strip()
    voice_id = str(payload.get("voice_id", payload.get("voice", ""))).strip()
    raw_text = str(payload.get("text", "Hello, I am ready to handle your calls.")).strip()
    text = calling_optimizer.clean_text_for_calling(raw_text)
    user_lang = str(payload.get("language", "en-US")).strip()
    if not text:
        text = "Hello, I am ready to handle your calls."

    if not voice_id or voice_id in ["dynamic", "__no_fetched_voices__"]:
        raise HTTPException(status_code=400, detail="A valid Voice ID is required for audio synthesis.")

    passed_key = str(payload.get("api_key", "")).strip()
    api_key = passed_key if passed_key and "•" not in passed_key and "*" not in passed_key else resolve_provider_credential(db, str(current_user.organization_id), str(current_user.id), provider_name)

    if not api_key:
        raise HTTPException(status_code=400, detail=f"API Key is missing for provider {provider_name.upper()}.")

    # Raw runtime logging of incoming frontend payload
    print("\n==================================================")
    print("[RAW RUNTIME FRONTEND PAYLOAD RECEIVED]")
    print(f"  • provider: {provider_name}")
    print(f"  • voice_id: {voice_id}")
    print(f"  • model_id: {payload.get('model_id')}")
    print(f"  • language: {user_lang}")
    print(f"  • cleaned_text: '{text}'")
    print("==================================================")

    async with httpx.AsyncClient(timeout=12.0) as client:
        try:
            # 1. ElevenLabs
            if provider_name in ["elevenlabs", "eleven_labs", "eleven-labs"]:
                has_devanagari = any("\u0900" <= char <= "\u097F" for char in text)
                target_model = payload.get("model_id") or ("eleven_multilingual_v2" if has_devanagari or "hi" in user_lang.lower() else "eleven_turbo_v2_5")
                res = await client.post(
                    f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?optimize_streaming_latency=4",
                    headers={"xi-api-key": api_key, "Content-Type": "application/json"},
                    json={
                        "text": text,
                        "model_id": target_model,
                        "voice_settings": {"stability": 0.45, "similarity_boost": 0.85, "style": 0.0, "use_speaker_boost": True}
                    }
                )
                print(f"[TTS PREVIEW RESPONSE] ElevenLabs Status: {res.status_code}")
                if res.status_code == 200:
                    return Response(content=res.content, media_type="audio/mpeg")
                else:
                    raise HTTPException(status_code=res.status_code, detail=f"ElevenLabs error: {res.text}")

            # 2. Google Cloud Speech / TTS
            elif provider_name in ["google", "google_tts", "google-tts", "google_ai_studio", "google_cloud"]:
                parts = voice_id.split("-")
                lang_code = f"{parts[0]}-{parts[1]}" if len(parts) >= 2 else (user_lang if "-" in user_lang else "en-US")
                res = await client.post(
                    f"https://texttospeech.googleapis.com/v1/text:synthesize?key={api_key}",
                    headers={"Content-Type": "application/json"},
                    json={
                        "input": {"text": text},
                        "voice": {"name": voice_id, "languageCode": lang_code},
                        "audioConfig": {"audioEncoding": "MP3", "speakingRate": 1.12}
                    }
                )
                print(f"[TTS PREVIEW RESPONSE] Google Status: {res.status_code}")
                if res.status_code == 200:
                    import base64
                    audio_content = res.json().get("audioContent", "")
                    if audio_content:
                        return Response(content=base64.b64decode(audio_content), media_type="audio/mpeg")
                else:
                    raise HTTPException(status_code=res.status_code, detail=f"Google TTS error: {res.text}")

            # 3. OpenAI TTS
            elif provider_name in ["openai", "openai_tts", "openai-tts"]:
                is_heavy = "heavy" in voice_id.lower()
                res = await client.post(
                    "https://api.openai.com/v1/audio/speech",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={
                        "model": payload.get("model_id") or "tts-1",
                        "input": text,
                        "voice": voice_id.lower(),
                        "speed": 1.15 if is_heavy else 1.10
                    }
                )
                print(f"[TTS PREVIEW RESPONSE] OpenAI Status: {res.status_code}")
                if res.status_code == 200:
                    return Response(content=res.content, media_type="audio/mpeg")
                else:
                    raise HTTPException(status_code=res.status_code, detail=f"OpenAI error: {res.text}")

            # 4. Deepgram Aura Conversational
            elif provider_name in ["deepgram", "deepgram_aura", "deepgram-aura"]:
                res = await client.post(
                    f"https://api.deepgram.com/v1/speak?model={voice_id}&encoding=mp3",
                    headers={"Authorization": f"Token {api_key}", "Content-Type": "application/json"},
                    json={"text": text}
                )
                print(f"[TTS PREVIEW RESPONSE] Deepgram Status: {res.status_code}")
                if res.status_code == 200:
                    return Response(content=res.content, media_type="audio/mpeg")
                else:
                    raise HTTPException(status_code=res.status_code, detail=f"Deepgram error: {res.text}")

            # 5. Azure Speech (Neural TTS)
            elif provider_name in ["azure", "azure_speech", "azure-speech"]:
                region = os.getenv("AZURE_SPEECH_REGION", "eastus")
                parts = voice_id.split("-")
                lang_code = f"{parts[0]}-{parts[1]}" if len(parts) >= 2 else (user_lang if "-" in user_lang else "en-US")
                ssml = f"<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='{lang_code}'><voice xml:lang='{lang_code}' name='{voice_id}'><prosody rate='+12%'>{text}</prosody></voice></speak>"
                
                res = await client.post(
                    f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1",
                    headers={
                        "Ocp-Apim-Subscription-Key": api_key,
                        "Content-Type": "application/ssml+xml",
                        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3"
                    },
                    content=ssml.encode("utf-8")
                )
                print(f"[TTS PREVIEW RESPONSE] Azure Status: {res.status_code}")
                if res.status_code == 200:
                    return Response(content=res.content, media_type="audio/mpeg")
                else:
                    raise HTTPException(status_code=res.status_code, detail=f"Azure Speech error ({res.status_code}): {res.text}")

            # 6. Cartesia Sonic
            elif provider_name in ["cartesia", "cartesia_sonic", "cartesia-sonic"]:
                req_model = str(payload.get("model_id") or payload.get("model") or "sonic-latest").strip()
                if req_model in ["sonic-2.0", "sonic-multilingual", "sonic-english", "sonic"]:
                    req_model = "sonic-latest"

                cartesia_payload = {
                    "model_id": req_model,
                    "transcript": text,
                    "voice": {"mode": "id", "id": voice_id},
                    "output_format": {"container": "mp3", "encoding": "mp3", "sample_rate": 44100}
                }

                res = await client.post(
                    "https://api.cartesia.ai/tts/bytes",
                    headers={"X-API-Key": api_key, "Cartesia-Version": "2024-06-10", "Content-Type": "application/json"},
                    json=cartesia_payload
                )
                if res.status_code == 200:
                    return Response(content=res.content, media_type="audio/mpeg")
                else:
                    raise HTTPException(status_code=res.status_code, detail=f"Cartesia error ({res.status_code}): {res.text}")

            # 7. PlayHT 2.0 Turbo
            elif provider_name in ["playht", "play_ht", "play-ht"]:
                user_id = os.getenv("PLAYHT_USER_ID", "")
                req_model = payload.get("model_id") or "PlayHT2.0-turbo"
                playht_payload = {
                    "text": text,
                    "voice": voice_id,
                    "voice_engine": req_model,
                    "output_format": "mp3"
                }
                print(f"[TTS PREVIEW PLAYHT PAYLOAD] {playht_payload}")
                res = await client.post(
                    "https://api.play.ht/api/v2/tts/stream",
                    headers={"X-User-Id": user_id, "AUTHORIZATION": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json=playht_payload
                )
                print(f"[TTS PREVIEW RESPONSE] PlayHT Status: {res.status_code}")
                if res.status_code == 200:
                    return Response(content=res.content, media_type="audio/mpeg")
                else:
                    raise HTTPException(status_code=res.status_code, detail=f"PlayHT error ({res.status_code}): {res.text}")

            # 8. Fish Audio Realtime
            elif provider_name in ["fish_audio", "fish-audio", "fishaudio"]:
                fish_payload = {
                    "text": text,
                    "reference_id": voice_id,
                    "format": "mp3"
                }
                res = await client.post(
                    "https://api.fish.audio/v1/tts",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json=fish_payload
                )
                print(f"[TTS PREVIEW RESPONSE] Fish Audio Status: {res.status_code}")
                if res.status_code == 200:
                    return Response(content=res.content, media_type="audio/mpeg")
                else:
                    raise HTTPException(status_code=res.status_code, detail=f"Fish Audio error ({res.status_code}): {res.text}")

            # 9. LMNT Realtime
            elif provider_name in ["lmnt", "lmnt_speech", "lmnt-speech"]:
                res = await client.post(
                    "https://api.lmnt.com/v1/ai/speech/bytes",
                    headers={"X-API-Key": api_key, "Content-Type": "application/json"},
                    json={"text": text, "voice": voice_id, "format": "mp3"}
                )
                print(f"[TTS PREVIEW RESPONSE] LMNT Status: {res.status_code}")
                if res.status_code == 200:
                    return Response(content=res.content, media_type="audio/mpeg")
                else:
                    raise HTTPException(status_code=res.status_code, detail=f"LMNT error ({res.status_code}): {res.text}")

            # 10. MiniMax Speech-01
            elif provider_name in ["minimax", "minimax_speech", "minimax-speech"]:
                group_id = os.getenv("MINIMAX_GROUP_ID", "")
                res = await client.post(
                    f"https://api.minimax.chat/v1/t2a_v2?GroupId={group_id}",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={"model": "speech-01", "text": text, "timber_weights": [{"voice_id": voice_id, "weight": 1}]}
                )
                print(f"[TTS PREVIEW RESPONSE] MiniMax Status: {res.status_code}")
                if res.status_code == 200:
                    return Response(content=res.content, media_type="audio/mpeg")
                else:
                    raise HTTPException(status_code=res.status_code, detail=f"MiniMax error ({res.status_code}): {res.text}")

            else:
                raise HTTPException(status_code=400, detail=f"Provider {provider_name} does not support text-to-speech preview.")

        except HTTPException:
            raise
        except Exception as e:
            print(f"[TTS PREVIEW EXCEPTION] {e}")
            raise HTTPException(status_code=500, detail=str(e))



@router.post("/test-tts")
async def test_tts_synthesis(
    payload: dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Synthesize speech using the active TTS Provider (ElevenLabs)."""
    provider_manager.sync_from_database(db, org_id=current_user.organization_id)
    text = payload.get("text", "Hello, welcome to Nexus AI Voice Operating System!")
    voice_id = payload.get("voice_id", "21m00Tcm4TlvDq8ikWAM")

    provider = provider_manager.get_tts_provider()
    audio_bytes = await provider.synthesize_speech(text=text, voice_id=voice_id)
    return {
        "provider": provider.get_provider_name(),
        "voice_id": voice_id,
        "bytes_length": len(audio_bytes),
        "status": "synthesized",
    }


@router.post("/test-llm")
async def test_llm_response(
    payload: dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate conversational AI response using active LLM Provider."""
    provider_manager.sync_from_database(db, org_id=current_user.organization_id)
    system_prompt = payload.get(
        "system_prompt", "You are an AI receptionist for Nexus AI."
    )
    user_input = payload.get("user_input", "What are your business hours?")

    provider = provider_manager.get_llm_provider()
    result = await provider.generate_response(
        system_prompt=system_prompt, user_input=user_input
    )
    return result


@router.post("/switch-provider")
async def switch_provider(
    payload: dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Switch active provider type on the fly (telephony, tts, stt, llm)."""
    category = payload.get("category", "").lower()
    provider_name = payload.get("provider", "").lower()

    if category == "llm":
        if "openai" in provider_name:
            provider_manager.set_llm_provider(OpenAIProvider())
        else:
            provider_manager.set_llm_provider(GeminiProvider())
    elif category == "telephony":
        provider_manager.set_telephony_provider(TwilioProvider())
    elif category == "tts":
        provider_manager.set_tts_provider(ElevenLabsProvider())
    elif category == "stt":
        provider_manager.set_stt_provider(DeepgramProvider())
    else:
        raise HTTPException(status_code=400, detail="Invalid provider category")

    telephony_name = provider_manager.get_telephony_provider().get_provider_name()
    return {
        "message": f"Successfully switched {category} provider to {provider_name}",
        "active_llm": provider_manager.get_llm_provider().get_provider_name(),
        "active_telephony": telephony_name,
        "active_tts": provider_manager.get_tts_provider().get_provider_name(),
        "active_stt": provider_manager.get_stt_provider().get_provider_name(),
    }


@router.get("")
@router.get("/")
async def get_all_providers():
    """Single backend source of truth for provider metadata and documentation."""
    return registry_service.get_provider_catalog()


@router.get("/llm")
async def get_llm_providers():
    all_p = await get_all_providers()
    return {"providers": all_p["llm"]}


@router.get("/voice")
async def get_voice_providers():
    all_p = await get_all_providers()
    return {"providers": all_p["voice"]}


def resolve_provider_credential(db: Session, org_id: str, user_id: str, provider_name: str) -> str:
    """Delegate credential resolution to single backend source of truth in backend.routers.credentials."""
    return resolve_credential_key(db, org_id, user_id, provider_name)


