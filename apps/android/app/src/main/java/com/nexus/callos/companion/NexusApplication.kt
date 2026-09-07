package com.nexus.callos.companion

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.util.Log
import com.nexus.callos.companion.model.GatewayLogEntry
import java.util.concurrent.CopyOnWriteArrayList

class NexusApplication : Application() {

    companion object {
        const val CHANNEL_BRIDGE_SERVICE = "nexus_call_bridge_channel"
        const val CHANNEL_CALL_ALERTS = "nexus_call_alerts_channel"
        private const val MAX_LOGS = 250

        lateinit var instance: NexusApplication
            private set

        private val logsList = CopyOnWriteArrayList<GatewayLogEntry>()
        private var logListener: ((GatewayLogEntry) -> Unit)? = null

        fun log(level: String, tag: String, message: String) {
            val entry = GatewayLogEntry(level = level, tag = tag, message = message)
            logsList.add(entry)
            if (logsList.size > MAX_LOGS) {
                logsList.removeAt(0)
            }
            logListener?.invoke(entry)
            when (level) {
                "ERROR" -> Log.e(tag, message)
                "WARN" -> Log.w(tag, message)
                else -> Log.i(tag, message)
            }
        }

        fun getLogs(): List<GatewayLogEntry> = logsList.toList()

        fun clearLogs() {
            logsList.clear()
        }

        fun setLogListener(listener: ((GatewayLogEntry) -> Unit)?) {
            logListener = listener
        }
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        createNotificationChannels()
        log("INFO", "NexusApp", "Nexus Call OS Gateway initialized successfully.")
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
                ?: return

            val bridgeChannel = NotificationChannel(
                CHANNEL_BRIDGE_SERVICE,
                "GSM Telephony Gateway Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Persistent foreground service maintaining cellular voice bridge"
                setShowBadge(false)
            }

            val alertsChannel = NotificationChannel(
                CHANNEL_CALL_ALERTS,
                "Incoming Cellular Call Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifies when cellular incoming calls are detected and auto-answered"
            }

            notificationManager.createNotificationChannel(bridgeChannel)
            notificationManager.createNotificationChannel(alertsChannel)
        }
    }
}
