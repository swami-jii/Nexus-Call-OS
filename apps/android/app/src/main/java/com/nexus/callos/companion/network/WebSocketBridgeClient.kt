package com.nexus.callos.companion.network

import android.os.Build
import android.util.Log
import kotlinx.coroutines.*
import okhttp3.*
import okio.ByteString
import okio.ByteString.Companion.toByteString
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class WebSocketBridgeClient(
    private val serverUrl: String,
    private val deviceId: String = "android-primary",
    private val deviceToken: String? = null,
    private val onIncomingAudio: (ByteArray) -> Unit,
    private val onStateChanged: (state: ConnectionState, detail: String?) -> Unit = { _, _ -> }
) {

    enum class ConnectionState {
        DISCONNECTED,
        CONNECTING,
        CONNECTED,
        RECONNECTING
    }

    companion object {
        private const val TAG = "NexusWSBridge"
        private const val NORMAL_CLOSURE_STATUS = 1000
    }

    private val client = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .pingInterval(15, TimeUnit.SECONDS)
        .build()

    private var webSocket: WebSocket? = null
    private var isManualDisconnect = false
    private var reconnectScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var heartbeatJob: Job? = null
    private var reconnectAttempts = 0

    fun connect() {
        isManualDisconnect = false
        onStateChanged(ConnectionState.CONNECTING, "Connecting to Nexus Call OS...")
        Log.d(TAG, "Connecting to Nexus Call OS: $serverUrl (device: $deviceId)")

        // Append query params if not in url
        val targetUrl = if (serverUrl.contains("device_id=")) {
            serverUrl
        } else {
            val delimiter = if (serverUrl.contains("?")) "&" else "?"
            val tokenParam = if (!deviceToken.isNullOrBlank()) "&token=$deviceToken" else ""
            "$serverUrl${delimiter}device_id=$deviceId$tokenParam"
        }

        val requestBuilder = Request.Builder().url(targetUrl)
        if (!deviceToken.isNullOrBlank()) {
            requestBuilder.addHeader("Authorization", "Bearer $deviceToken")
            requestBuilder.addHeader("X-Device-Token", deviceToken)
        }

        val request = requestBuilder.build()

        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(ws: WebSocket, response: Response) {
                reconnectAttempts = 0
                Log.d(TAG, "WebSocket transport connected. Sending AUTH handshake...")

                // Send authentication & device handshake frame
                val authFrame = JSONObject().apply {
                    put("event", "AUTH")
                    put("device_id", deviceId)
                    put("device_token", deviceToken ?: "")
                    put("platform", "android")
                    put("os_version", Build.VERSION.RELEASE)
                    put("model", Build.MODEL)
                }
                ws.send(authFrame.toString())
                startHeartbeat(ws)
            }

            override fun onMessage(ws: WebSocket, bytes: ByteString) {
                onIncomingAudio(bytes.toByteArray())
            }

            override fun onMessage(ws: WebSocket, text: String) {
                Log.d(TAG, "Received frame: $text")
                try {
                    val json = JSONObject(text)
                    val eventType = json.optString("type")
                    val eventName = json.optString("event")

                    if (eventType == "AUTH_SUCCESS" || eventName == "AUTH_SUCCESS") {
                        Log.d(TAG, "Device $deviceId authenticated successfully with Nexus Call OS!")
                        onStateChanged(ConnectionState.CONNECTED, "Online & Authenticated (Bridge Active)")
                    } else if (eventType == "AUTH_ERROR" || eventName == "AUTH_ERROR") {
                        val err = json.optString("error", "Authentication failed")
                        Log.e(TAG, "Auth failed: $err")
                        onStateChanged(ConnectionState.DISCONNECTED, "Auth Failed: $err")
                    } else if (eventType == "PONG") {
                        // Heartbeat ACK
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "Failed to parse text frame", e)
                }
            }

            override fun onClosing(ws: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WebSocket closing: $code / $reason")
                ws.close(NORMAL_CLOSURE_STATUS, null)
            }

            override fun onClosed(ws: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WebSocket closed: $code / $reason")
                stopHeartbeat()
                if (!isManualDisconnect) {
                    scheduleReconnect("Connection closed ($code)")
                } else {
                    onStateChanged(ConnectionState.DISCONNECTED, "Disconnected")
                }
            }

            override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "WebSocket failure: ${t.message}")
                stopHeartbeat()
                if (!isManualDisconnect) {
                    scheduleReconnect(t.message)
                } else {
                    onStateChanged(ConnectionState.DISCONNECTED, t.message)
                }
            }
        })
    }

    private fun startHeartbeat(ws: WebSocket) {
        heartbeatJob?.cancel()
        heartbeatJob = reconnectScope.launch {
            while (isActive) {
                delay(10000)
                try {
                    val ping = JSONObject().apply {
                        put("event", "PING")
                        put("device_id", deviceId)
                        put("battery_level", 95)
                        put("is_charging", true)
                        put("signal_dbm", -70)
                        put("network_type", "5G")
                        put("latency_ms", 18)
                    }
                    ws.send(ping.toString())
                } catch (e: Exception) {
                    Log.w(TAG, "Error sending telemetry heartbeat", e)
                }
            }
        }
    }

    private fun stopHeartbeat() {
        heartbeatJob?.cancel()
        heartbeatJob = null
    }

    fun sendAudioChunk(pcmChunk: ByteArray): Boolean {
        return webSocket?.send(pcmChunk.toByteString()) ?: false
    }

    fun sendEvent(event: JSONObject): Boolean {
        return webSocket?.send(event.toString()) ?: false
    }

    private fun scheduleReconnect(errorDetail: String? = null) {
        if (isManualDisconnect) return
        reconnectAttempts++
        val delayMs = minOf(1000L * (1 shl minOf(reconnectAttempts, 5)), 30000L)
        onStateChanged(ConnectionState.RECONNECTING, "Reconnecting in ${delayMs / 1000}s (Attempt $reconnectAttempts)")
        Log.d(TAG, "Scheduling reconnect in $delayMs ms (attempt $reconnectAttempts)")

        reconnectScope.launch {
            delay(delayMs)
            if (!isManualDisconnect) {
                connect()
            }
        }
    }

    fun disconnect() {
        isManualDisconnect = true
        stopHeartbeat()
        reconnectScope.cancel()
        reconnectScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
        webSocket?.close(NORMAL_CLOSURE_STATUS, "Service stopped by user")
        webSocket = null
        onStateChanged(ConnectionState.DISCONNECTED, "Disconnected")
        Log.d(TAG, "WebSocket Bridge Disconnected manually")
    }
}

