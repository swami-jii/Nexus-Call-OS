package com.nexus.callos.companion.telephony

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.nexus.callos.companion.MainActivity
import com.nexus.callos.companion.NexusApplication
import com.nexus.callos.companion.R
import com.nexus.callos.companion.audio.AudioRecordManager
import com.nexus.callos.companion.audio.AudioTrackManager
import com.nexus.callos.companion.network.WebSocketBridgeClient

class CallBridgeService : Service() {

    companion object {
        private const val TAG = "NexusBridgeService"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START = "com.nexus.callos.companion.action.START"
        const val ACTION_STOP = "com.nexus.callos.companion.action.STOP"
        const val EXTRA_SERVER_URL = "EXTRA_SERVER_URL"
        const val EXTRA_DEVICE_ID = "EXTRA_DEVICE_ID"
        const val EXTRA_DEVICE_TOKEN = "EXTRA_DEVICE_TOKEN"
    }

    private val binder = LocalBinder()
    private var bridgeClient: WebSocketBridgeClient? = null
    private var recordManager: AudioRecordManager? = null
    private var trackManager: AudioTrackManager? = null
    var isRunning = false
        private set

    var onStateChangedListener: ((WebSocketBridgeClient.ConnectionState, String?) -> Unit)? = null

    inner class LocalBinder : Binder() {
        fun getService(): CallBridgeService = this@CallBridgeService
    }

    override fun onBind(intent: Intent?): IBinder = binder

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopAudioBridge()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }
            else -> {
                val serverUrl = intent?.getStringExtra(EXTRA_SERVER_URL)
                    ?: "ws://192.168.1.34:8000/api/android-gateway/ws/bridge"
                val deviceId = intent?.getStringExtra(EXTRA_DEVICE_ID) ?: "android-primary"
                val deviceToken = intent?.getStringExtra(EXTRA_DEVICE_TOKEN)

                startInForeground()
                startAudioBridge(serverUrl, deviceId, deviceToken)
                return START_STICKY
            }
        }
    }

    private fun startInForeground() {
        val notification = createNotification("Nexus Gateway Active", "Duplex voice bridge connected to Nexus Call OS")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val serviceType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE or ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL
            } else {
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
            }
            startForeground(NOTIFICATION_ID, notification, serviceType)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun startAudioBridge(serverUrl: String, deviceId: String, deviceToken: String?) {
        if (isRunning) return
        isRunning = true
        Log.d(TAG, "Starting Audio Bridge with server: $serverUrl, deviceId: $deviceId")

        trackManager = AudioTrackManager().apply { start() }

        recordManager = AudioRecordManager { pcmData ->
            bridgeClient?.sendAudioChunk(pcmData)
        }.apply { start() }

        bridgeClient = WebSocketBridgeClient(
            serverUrl = serverUrl,
            deviceId = deviceId,
            deviceToken = deviceToken,
            onIncomingAudio = { incomingPcm ->
                trackManager?.writePcm(incomingPcm)
            },
            onStateChanged = { state, detail ->
                onStateChangedListener?.invoke(state, detail)
            }
        ).apply { connect() }
    }


    private fun stopAudioBridge() {
        isRunning = false
        recordManager?.stop()
        recordManager = null
        trackManager?.stop()
        trackManager = null
        bridgeClient?.disconnect()
        bridgeClient = null
        Log.d(TAG, "Audio Bridge stopped")
    }

    private fun createNotification(title: String, text: String): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, NexusApplication.CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(text)
            .setSmallIcon(R.drawable.app_icon)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        stopAudioBridge()
    }
}
