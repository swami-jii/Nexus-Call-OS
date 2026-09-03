package com.nexus.callos.companion.telephony

import android.app.Notification
import android.content.Context
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

class NotificationCallAnswerService : NotificationListenerService() {

    companion object {
        private const val TAG = "NexusNotifAnswer"
        private var instance: NotificationCallAnswerService? = null

        fun triggerCallAnswerAction(context: Context): Boolean {
            val service = instance ?: return false
            try {
                val activeNotifs = service.activeNotifications ?: return false
                for (sbn in activeNotifs) {
                    val notif = sbn.notification ?: continue
                    val category = notif.category
                    val isCall = category == Notification.CATEGORY_CALL ||
                            sbn.packageName.contains("telecom") ||
                            sbn.packageName.contains("dialer") ||
                            sbn.packageName.contains("incall") ||
                            sbn.packageName.contains("phone")

                    if (isCall && notif.actions != null) {
                        for (action in notif.actions) {
                            val title = action.title?.toString()?.lowercase() ?: ""
                            if (title.contains("answer") || title.contains("accept") ||
                                title.contains("receive") || title.contains("उत्तर") ||
                                title.contains("उठाएं") || title.contains("स्वीकार")) {
                                Log.d(TAG, "Found call answer action: \"$title\" in package: ${sbn.packageName}. Triggering...")
                                action.actionIntent.send()
                                return true
                            }
                        }
                        // Fallback: If action exists and is not decline/reject
                        for (action in notif.actions) {
                            val title = action.title?.toString()?.lowercase() ?: ""
                            if (action.actionIntent != null && !title.contains("decline") && !title.contains("reject") && !title.contains("काटें")) {
                                action.actionIntent.send()
                                Log.d(TAG, "Triggered fallback notification action intent: ${action.title}")
                                return true
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Error executing notification call answer: ${e.message}")
            }
            return false
        }
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        instance = this
        Log.d(TAG, "NotificationCallAnswerService connected.")
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        instance = null
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return
        val notif = sbn.notification ?: return
        if (notif.category == Notification.CATEGORY_CALL ||
            sbn.packageName.contains("incallui") ||
            sbn.packageName.contains("dialer")) {
            Log.d(TAG, "Incoming call notification posted by ${sbn.packageName}")
            val prefs = getSharedPreferences("nexus_companion_prefs", Context.MODE_PRIVATE)
            val autoAnswer = prefs.getBoolean("auto_answer_enabled", true)
            val delaySec = prefs.getInt("auto_answer_delay_sec", 3)
            if (autoAnswer) {
                CallAnswerExecutor.executeAutoAnswer(this, delaySec)
            }
        }
    }
}
