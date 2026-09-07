package com.nexus.callos.companion.service

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Binder
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.nexus.callos.companion.NexusApplication
import com.nexus.callos.companion.audio.CallAudioManager
import com.nexus.callos.companion.model.CallSession
import com.nexus.callos.companion.model.CallState
import com.nexus.callos.companion.network.WebSocketBridgeClient
import com.nexus.callos.companion.telephony.CompanionInCallService
import com.nexus.callos.companion.telephony.HardwareTelemetryManager
import com.nexus.callos.companion.telephony.SimSubscriptionManager
import com.nexus.callos.companion.ui.MainActivity

class CallBridgeForegroundService : Service() {

    enum class ConnectionState {
        DISCONNECTED,
        CONNECTING,
        CONNECTED,
        ERROR
    }

    companion object {
        const val ACTION_START = "ACTION_START"
        const val ACTION_STOP = "ACTION_STOP"
        const val NOTIFICATION_ID = 9021

        var instance: CallBridgeForegroundService? = null
            private set

        var connectionState: ConnectionState = ConnectionState.DISCONNECTED
            private set

        var onConnectionStateChanged: ((ConnectionState, String?) -> Unit)? = null
            set(value) {
                field = value
                value?.invoke(connectionState, null)
            }

        var onConfigUpdated: (() -> Unit)? = null
    }

    private val binder = LocalBinder()

    lateinit var telemetryManager: HardwareTelemetryManager
        private set
    lateinit var simManager: SimSubscriptionManager
        private set
    lateinit var audioManager: CallAudioManager
        private set
    var wsClient: WebSocketBridgeClient? = null
        private set

    inner class LocalBinder : Binder() {
        fun getService(): CallBridgeForegroundService = this@CallBridgeForegroundService
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        telemetryManager = HardwareTelemetryManager(this)
        simManager = SimSubscriptionManager(this)
        audioManager = CallAudioManager(this)

        setupListeners()
        NexusApplication.log("INFO", "BridgeService", "Foreground Telephony Service created.")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action
        if (action == ACTION_STOP) {
            stopForegroundService()
            return START_NOT_STICKY
        }

        setConnectionState(ConnectionState.CONNECTING, "Connecting to Nexus Gateway...")
        startInForeground()

        val serverUrl = intent?.getStringExtra("server_url")
            ?: getSharedPreferences("nexus_device_prefs", Context.MODE_PRIVATE)
                .getString("server_url", "")
            ?: ""

        val deviceId = telemetryManager.getSnapshot().deviceId
        val deviceToken = getSharedPreferences("nexus_device_prefs", Context.MODE_PRIVATE)
            .getString("device_token", "dev_token_$deviceId") ?: "dev_token_$deviceId"

        if (wsClient == null) {
            val telPrefs = getSharedPreferences("nexus_telephony_prefs", Context.MODE_PRIVATE)
            wsClient = WebSocketBridgeClient(
                deviceId = deviceId,
                deviceToken = deviceToken,
                telemetryProvider = {
                    val tel = telemetryManager.getSnapshot()
                    val subs = simManager.getActiveSubscriptions()
                    val selSub = simManager.getSelectedSubscriptionId()
                    val autoAns = telPrefs.getBoolean("auto_answer_enabled", true)
                    val delaySec = telPrefs.getInt("auto_answer_delay_sec", 3)
                    val outboundAi = telPrefs.getBoolean("outbound_ai_enabled", true)
                    Triple(tel, Pair(subs, selSub), Triple(autoAns, delaySec, outboundAi))
                },
                onRemoteSettingChanged = { key, value ->
                    val editor = telPrefs.edit()
                    when (value) {
                        is Boolean -> editor.putBoolean(key, value)
                        is Int -> editor.putInt(key, value)
                        is String -> editor.putString(key, value)
                    }
                    editor.apply()
                }
            ).apply {
                onAiAudioReceived = { pcmBytes ->
                    audioManager.writePlaybackChunk(pcmBytes)
                }
                onLatencyUpdated = { latencyMs ->
                    telemetryManager.updateLatency(latencyMs)
                }
                onConfigUpdated = {
                    Companion.onConfigUpdated?.invoke()
                }
                onStateChanged = { wsState, reason ->
                    val mapped = when (wsState) {
                        WebSocketBridgeClient.State.DISCONNECTED -> ConnectionState.DISCONNECTED
                        WebSocketBridgeClient.State.CONNECTING -> ConnectionState.CONNECTING
                        WebSocketBridgeClient.State.CONNECTED -> ConnectionState.CONNECTED
                        WebSocketBridgeClient.State.ERROR -> ConnectionState.ERROR
                    }
                    setConnectionState(mapped, reason)
                }
            }
        }

        if (!serverUrl.isNullOrBlank()) {
            wsClient?.connect(serverUrl)
        }

        return START_STICKY
    }

    private fun setConnectionState(state: ConnectionState, reason: String?) {
        connectionState = state
        when (state) {
            ConnectionState.CONNECTED -> updateNotification("Gateway Online • Connected to Nexus OS")
            ConnectionState.CONNECTING -> updateNotification("Gateway Connecting...")
            ConnectionState.ERROR -> updateNotification("Gateway Connection Error")
            ConnectionState.DISCONNECTED -> cancelNotification()
        }
        onConnectionStateChanged?.invoke(state, reason)
    }

    private fun setupListeners() {
        audioManager.onAudioChunkCaptured = { pcmChunk ->
            wsClient?.sendAudioFrame(pcmChunk)
        }

        CompanionInCallService.onCallSessionChanged = { session ->
            handleCallSessionChange(session)
        }
    }

    private fun handleCallSessionChange(session: CallSession) {
        when (session.state) {
            CallState.RINGING -> {
                updateNotification("Incoming Call: ${session.callerNumber ?: "Unknown"}")
            }
            CallState.CONNECTED -> {
                updateNotification("Call Active: ${session.callerNumber ?: "Unknown"}")
                wsClient?.sendCallActive(session.callerNumber)
                audioManager.startCapture()
                audioManager.initPlayback()
            }
            CallState.IDLE -> {
                updateNotification("Gateway Online • Ready for Calls")
                audioManager.stopCapture()
                audioManager.stopPlayback()
                val duration = if (session.startTimeMs > 0) {
                    (System.currentTimeMillis() - session.startTimeMs) / 1000L
                } else 0L
                wsClient?.sendCallEnded(duration)
            }
            else -> {}
        }
    }

    private fun startInForeground() {
        val notification = createNotification("Gateway Initializing...")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL or ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun createNotification(statusText: String): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, NexusApplication.CHANNEL_BRIDGE_SERVICE)
            .setContentTitle("Nexus Call OS Gateway")
            .setContentText(statusText)
            .setSmallIcon(android.R.drawable.stat_sys_phone_call)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    private fun updateNotification(statusText: String) {
        val notification = createNotification(statusText)
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? android.app.NotificationManager
        manager?.notify(NOTIFICATION_ID, notification)
    }

    private fun cancelNotification() {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? android.app.NotificationManager
        manager?.cancel(NOTIFICATION_ID)
    }

    private fun stopForegroundService() {
        wsClient?.disconnect()
        audioManager.stopCapture()
        audioManager.stopPlayback()
        setConnectionState(ConnectionState.DISCONNECTED, "Service stopped")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }
        cancelNotification()
        stopSelf()
        NexusApplication.log("INFO", "BridgeService", "Foreground service stopped.")
    }

    override fun onBind(intent: Intent?): IBinder = binder

    override fun onDestroy() {
        super.onDestroy()
        setConnectionState(ConnectionState.DISCONNECTED, "Service destroyed")
        instance = null
    }
}
