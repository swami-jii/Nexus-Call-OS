import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.voice_pipeline.audio_pipeline import create_pipeline
from backend.voice_pipeline.session_manager import session_manager

router = APIRouter(prefix="/ws/twilio", tags=["Twilio WebSocket Audio Stream"])


@router.websocket("/stream/{call_id}")
async def twilio_audio_stream_endpoint(websocket: WebSocket, call_id: str):
    await websocket.accept()

    session = session_manager.get_session(call_id)
    if not session:
        session = session_manager.create_session(call_id=call_id)
    session.status = "in-progress"

    pipeline = create_pipeline(call_id)
    stream_sid = None

    try:
        while True:
            raw_msg = await websocket.receive_text()
            data = json.loads(raw_msg)
            event = data.get("event")

            if event == "start":
                start_info = data.get("start", {})
                stream_sid = start_info.get("streamSid")
                session.stream_sid = stream_sid
                print(f"[TwilioStream] Media Stream started: call={call_id}")

            elif event == "media":
                media_info = data.get("media", {})
                payload_base64 = media_info.get("payload", "")
                if payload_base64:
                    outbound_payload = await pipeline.handle_incoming_media(
                        payload_base64
                    )
                    if outbound_payload and stream_sid:
                        response_msg = {
                            "event": "media",
                            "streamSid": stream_sid,
                            "media": {"payload": outbound_payload},
                        }
                        await websocket.send_text(json.dumps(response_msg))

            elif event == "stop":
                print(f"[TwilioStream] Media Stream stopped: call={call_id}")
                session_manager.end_session(call_id)
                break

    except WebSocketDisconnect:
        print(f"[TwilioStream] Client disconnected: call={call_id}")
        session_manager.end_session(call_id)
    except Exception as e:
        print(f"[TwilioStream] Stream exception for call {call_id}: {e}")
        session_manager.end_session(call_id)
