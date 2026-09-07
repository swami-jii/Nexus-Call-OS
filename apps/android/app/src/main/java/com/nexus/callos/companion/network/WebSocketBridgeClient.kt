package com.nexus.callos.companion.network

import android.os.Handler
import android.os.Looper
import com.nexus.callos.companion.NexusApplication
import com.nexus.callos.companion.model.DeviceTelemetry
import com.nexus.callos.companion.model.SimSubscriptionInfo
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okio.ByteString
import okio.ByteString.Companion.toByteString
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

class WebSocketBridgeClient(
    private val deviceId: String,
    private val deviceToken: String,
    private val telemetryProvider: (() -> Triple<DeviceTelemetry, Pair<List<SimSubscriptionInfo>, Int>, Triple<Boolean, Int, Boolean>>)? = null,
    private val onRemoteSettingChanged: ((String, Any) -> Unit)? = null
) {

    enum class State {
        DISCONNECTED,
        CONNECTING,
        CONNECTED,
        ERROR
    }

    private val client = OkHttpClient.Builder()
        .pingInterval(15, TimeUnit.SECONDS)
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .build()

    private var webSocket: WebSocket? = null
    private var currentState = State.DISCONNECTED
    private val isManualDisconnect = AtomicBoolean(false)
    private val mainHandler = Handler(Looper.getMainLooper())

    private var currentUrl = ""
    private var pingStartTime = 0L

    var onStateChanged: ((State, String?) -> Unit)? = null
    var onLatencyUpdated: ((Int) -> Unit)? = null
    var onAiAudioReceived: ((ByteArray) -> Unit)? = null
    var onConfigUpdated: (() -> Unit)? = null

    private val pingRunnable = object : Runnable {
        override fun run() {
            if (currentState == State.CONNECTED) {
                sendPing()
                mainHandler.postDelayed(this, 10000L)
            }
        }
    }

    fun connect(wsUrl: String) {
        isManualDisconnect.set(false)
        currentUrl = wsUrl
        updateState(State.CONNECTING, "Connecting to $wsUrl...")

        val cleanUrl = if (!wsUrl.contains("?")) {
            "$wsUrl?device_id=$deviceId&token=$deviceToken"
        } else {
            "$wsUrl&device_id=$deviceId&token=$deviceToken"
        }

        try {
            val request = Request.Builder().url(cleanUrl).build()
            webSocket = client.newWebSocket(request, createListener())
        } catch (e: Exception) {
            NexusApplication.log("ERROR", "WSBridge", "Failed to initialize WebSocket: ${e.message}")
            updateState(State.ERROR, e.message)
            scheduleReconnect()
        }
    }

    fun disconnect() {
        isManualDisconnect.set(true)
        mainHandler.removeCallbacks(pingRunnable)
        try {
            webSocket?.close(1000, "User disconnected")
        } catch (e: Exception) {
            // Ignore
        }
        webSocket = null
        updateState(State.DISCONNECTED, "Disconnected by user")
    }

    fun isConnected(): Boolean = currentState == State.CONNECTED

    private fun createListener() = object : WebSocketListener() {
        override fun onOpen(webSocket: WebSocket, response: Response) {
            NexusApplication.log("INFO", "WSBridge", "WebSocket TCP connection established. Sending AUTH handshake...")
            sendAuthHandshake()
        }

        override fun onMessage(webSocket: WebSocket, text: String) {
            handleTextMessage(text)
        }

        override fun onMessage(webSocket: WebSocket, bytes: ByteString) {
            onAiAudioReceived?.invoke(bytes.toByteArray())
        }

        override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
            NexusApplication.log("INFO", "WSBridge", "WebSocket closing: $code / $reason")
        }

        override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
            NexusApplication.log("INFO", "WSBridge", "WebSocket closed: $code / $reason")
            updateState(State.DISCONNECTED, reason)
            scheduleReconnect()
        }

        override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
            NexusApplication.log("WARN", "WSBridge", "WebSocket transport failure: ${t.message}")
            updateState(State.ERROR, t.message)
            scheduleReconnect()
        }
    }

    private fun handleTextMessage(text: String) {
        try {
            val json = JSONObject(text)
            val type = json.optString("type")
            val event = json.optString("event")

            if (type == "AUTH_SUCCESS" || event == "AUTH_SUCCESS") {
                NexusApplication.log("INFO", "WSBridge", "✓ Authenticated with Nexus OS successfully.")
                updateState(State.CONNECTED, "Online & Connected")
                mainHandler.post(pingRunnable)
            } else if (type == "PONG") {
                if (pingStartTime > 0) {
                    val rtt = (System.currentTimeMillis() - pingStartTime).toInt()
                    onLatencyUpdated?.invoke(rtt)
                }
            } else if (type == "AUTH_ERROR") {
                NexusApplication.log("ERROR", "WSBridge", "Authentication rejected by backend.")
                updateState(State.ERROR, "Authentication failed")
            } else if (event == "SET_AUTO_ANSWER") {
                val autoAns = json.optBoolean("auto_answer", true)
                onRemoteSettingChanged?.invoke("auto_answer", autoAns)
                mainHandler.post { onConfigUpdated?.invoke() }
            } else if (event == "SET_AUTO_ANSWER_DELAY") {
                val delay = json.optInt("delay_sec", 3)
                onRemoteSettingChanged?.invoke("auto_answer_delay_sec", delay)
                mainHandler.post { onConfigUpdated?.invoke() }
            } else if (event == "SET_OUTBOUND_AI") {
                val outbound = json.optBoolean("outbound_ai_enabled", true)
                onRemoteSettingChanged?.invoke("outbound_ai_enabled", outbound)
                mainHandler.post { onConfigUpdated?.invoke() }
            } else if (type == "AGENT_CONFIG_UPDATED" || event == "AGENT_CONFIG_UPDATED" || type == "CONFIG_UPDATE" || event == "CONFIG_UPDATE") {
                NexusApplication.log("INFO", "WSBridge", "Received live AGENT_CONFIG_UPDATED event from Nexus OS.")
                mainHandler.post {
                    onConfigUpdated?.invoke()
                }
            }
        } catch (e: Exception) {
            // Ignore parse errors
        }
    }

    private fun sendAuthHandshake() {
        val payload = JSONObject().apply {
            put("event", "AUTH")
            put("device_token", deviceToken)
            put("device_id", deviceId)
            put("timestamp", System.currentTimeMillis() / 1000)

            telemetryProvider?.invoke()?.let { (telemetry, subsPair, controls) ->
                val (subs, selectedSubId) = subsPair
                val (autoAns, delaySec, outboundAi) = controls

                val subsArray = JSONArray()
                subs.forEach { sub ->
                    subsArray.put(
                        JSONObject().apply {
                            put("sub_id", sub.subId)
                            put("slot_index", sub.slotIndex)
                            put("carrier", sub.carrierName)
                            put("number", sub.number ?: "")
                            put("is_esim", sub.isEsim)
                            put("signal_dbm", sub.signalDbm)
                        }
                    )
                }

                val primaryNum = subs.firstOrNull { it.subId == selectedSubId }?.number
                    ?: subs.firstOrNull { !it.number.isNullOrBlank() }?.number
                    ?: ""

                put("model", "${telemetry.manufacturer} ${telemetry.model}")
                put("name", "${telemetry.manufacturer} ${telemetry.model}")
                put("os_version", telemetry.osVersion)
                put("battery_level", telemetry.batteryLevel)
                put("is_charging", telemetry.isCharging)
                put("network_type", telemetry.networkType)
                put("carrier_name", telemetry.carrierName)
                put("sim_number", primaryNum)
                put("signal_dbm", telemetry.signalDbm)
                put("latency_ms", telemetry.latencyMs)
                put("subscriptions", subsArray)
                put("selected_sub_id", selectedSubId)
                put("auto_answer", autoAns)
                put("auto_answer_delay_sec", delaySec)
                put("outbound_ai_enabled", outboundAi)
            }
        }
        webSocket?.send(payload.toString())
    }

    fun sendTelemetry(telemetry: DeviceTelemetry, subs: List<SimSubscriptionInfo>, selectedSubId: Int) {
        if (currentState != State.CONNECTED) return

        val subsArray = JSONArray()
        subs.forEach { sub ->
            subsArray.put(
                JSONObject().apply {
                    put("sub_id", sub.subId)
                    put("slot_index", sub.slotIndex)
                    put("carrier", sub.carrierName)
                    put("number", sub.number ?: "")
                    put("is_esim", sub.isEsim)
                    put("signal_dbm", sub.signalDbm)
                }
            )
        }

        val primaryNum = subs.firstOrNull { it.subId == selectedSubId }?.number
            ?: subs.firstOrNull { !it.number.isNullOrBlank() }?.number
            ?: ""

        val payload = JSONObject().apply {
            put("event", "TELEMETRY")
            put("model", "${telemetry.manufacturer} ${telemetry.model}")
            put("os_version", telemetry.osVersion)
            put("battery_level", telemetry.batteryLevel)
            put("is_charging", telemetry.isCharging)
            put("network_type", telemetry.networkType)
            put("carrier_name", telemetry.carrierName)
            put("sim_number", primaryNum)
            put("signal_dbm", telemetry.signalDbm)
            put("latency_ms", telemetry.latencyMs)
            put("subscriptions", subsArray)
            put("selected_sub_id", selectedSubId)
        }

        webSocket?.send(payload.toString())
    }

    fun sendCallActive(callerNumber: String?) {
        val payload = JSONObject().apply {
            put("event", "CALL_ACTIVE")
            put("caller_number", callerNumber ?: "Unknown")
            put("timestamp", System.currentTimeMillis() / 1000)
        }
        webSocket?.send(payload.toString())
    }

    fun sendCallEnded(durationSec: Long) {
        val payload = JSONObject().apply {
            put("event", "CALL_ENDED")
            put("duration_sec", durationSec)
            put("timestamp", System.currentTimeMillis() / 1000)
        }
        webSocket?.send(payload.toString())
    }

    fun sendAudioFrame(pcmChunk: ByteArray) {
        if (currentState == State.CONNECTED) {
            webSocket?.send(pcmChunk.toByteString())
        }
    }

    private fun sendPing() {
        pingStartTime = System.currentTimeMillis()
        val payload = JSONObject().apply {
            put("event", "PING")
            put("timestamp", pingStartTime)

            telemetryProvider?.invoke()?.let { (telemetry, subsPair, controls) ->
                val (subs, selectedSubId) = subsPair
                val (autoAns, delaySec, outboundAi) = controls

                val primaryNum = subs.firstOrNull { it.subId == selectedSubId }?.number
                    ?: subs.firstOrNull { !it.number.isNullOrBlank() }?.number
                    ?: ""

                put("model", "${telemetry.manufacturer} ${telemetry.model}")
                put("os_version", telemetry.osVersion)
                put("battery_level", telemetry.batteryLevel)
                put("is_charging", telemetry.isCharging)
                put("network_type", telemetry.networkType)
                put("carrier_name", telemetry.carrierName)
                put("sim_number", primaryNum)
                put("signal_dbm", telemetry.signalDbm)
                put("latency_ms", telemetry.latencyMs)
                put("auto_answer", autoAns)
                put("auto_answer_delay_sec", delaySec)
                put("outbound_ai_enabled", outboundAi)
            }
        }
        webSocket?.send(payload.toString())
    }

    private fun updateState(newState: State, msg: String?) {
        currentState = newState
        mainHandler.post {
            onStateChanged?.invoke(newState, msg)
        }
    }

    private fun scheduleReconnect() {
        if (isManualDisconnect.get() || currentUrl.isBlank()) return
        mainHandler.postDelayed({
            if (!isManualDisconnect.get() && currentState != State.CONNECTED) {
                NexusApplication.log("INFO", "WSBridge", "Attempting automatic reconnection...")
                connect(currentUrl)
            }
        }, 5000L)
    }
}
