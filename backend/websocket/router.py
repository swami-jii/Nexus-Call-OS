from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.websocket.connection_manager import ws_manager

ws_router = APIRouter()


@ws_router.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_json(
                {
                    "type": "telemetry_ack",
                    "received": data,
                    "status": "connected",
                    "latency_ms": 320,
                }
            )
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


@ws_router.websocket("/ws/call-stream/{call_id}")
async def websocket_call_stream(websocket: WebSocket, call_id: str):
    await ws_manager.connect(websocket)
    try:
        while True:
            audio_data = await websocket.receive_bytes()
            # Echo audio chunk or send transcript chunk
            await websocket.send_json(
                {
                    "call_id": call_id,
                    "speaker": "agent",
                    "transcript": "Audio stream received successfully.",
                    "bytes_received": len(audio_data),
                    "confidence": 0.98,
                }
            )
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
