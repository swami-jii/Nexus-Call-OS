package com.nexus.callos.companion.telephony

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.Ringtone
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.core.app.NotificationCompat
import com.nexus.callos.companion.NexusApplication
import com.nexus.callos.companion.R
import com.nexus.callos.companion.ui.MainActivity

object IncomingCallNotifier {

    private const val NOTIFICATION_ID_INCOMING_CALL = 7711
    private var activeRingtone: Ringtone? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private var isRinging = false

    fun startRinging(context: Context, callerNumber: String?) {
        if (isRinging) return
        isRinging = true

        val displayNum = if (!callerNumber.isNullOrBlank()) callerNumber else "Incoming Cellular Call"
        NexusApplication.log("INFO", "IncomingNotifier", "Starting incoming call alert for $displayNum (Screen Wakeup + Ringtone + Vibration + Heads-Up)")

        // 1. Wake Screen
        try {
            val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
            if (powerManager != null) {
                @Suppress("DEPRECATION")
                val wl = powerManager.newWakeLock(
                    PowerManager.SCREEN_BRIGHT_WAKE_LOCK or
                            PowerManager.ACQUIRE_CAUSES_WAKEUP or
                            PowerManager.ON_AFTER_RELEASE,
                    "NexusCallOS:IncomingCallWakeLock"
                )
                wl.acquire(30000L) // 30s max safety timeout
                wakeLock = wl
            }
        } catch (e: Exception) {
            NexusApplication.log("WARN", "IncomingNotifier", "WakeLock acquisition error: ${e.message}")
        }

        // 2. Play Default System Ringtone
        try {
            val ringtoneUri: Uri = RingtoneManager.getActualDefaultRingtoneUri(context, RingtoneManager.TYPE_RINGTONE)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)

            val ringtone = RingtoneManager.getRingtone(context, ringtoneUri)
            if (ringtone != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    ringtone.audioAttributes = AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setLegacyStreamType(AudioManager.STREAM_RING)
                        .build()
                } else {
                    @Suppress("DEPRECATION")
                    ringtone.streamType = AudioManager.STREAM_RING
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    ringtone.isLooping = true
                }
                ringtone.play()
                activeRingtone = ringtone
            }
        } catch (e: Exception) {
            NexusApplication.log("WARN", "IncomingNotifier", "Ringtone playback error: ${e.message}")
        }

        // 3. Start Vibration
        try {
            val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vm?.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            }

            val pattern = longArrayOf(0, 1000, 1000)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 0))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(pattern, 0)
            }
        } catch (e: Exception) {
            NexusApplication.log("WARN", "IncomingNotifier", "Vibration error: ${e.message}")
        }

        // 4. Full-Screen Intent & Heads-Up Notification
        try {
            val fullScreenIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("is_incoming_call", true)
                putExtra("caller_number", displayNum)
            }
            val fullScreenPendingIntent = PendingIntent.getActivity(
                context,
                101,
                fullScreenIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            // Answer Action
            val answerIntent = Intent(context, CallActionReceiver::class.java).apply {
                action = CallActionReceiver.ACTION_ANSWER
            }
            val answerPendingIntent = PendingIntent.getBroadcast(
                context,
                102,
                answerIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            // Decline Action
            val rejectIntent = Intent(context, CallActionReceiver::class.java).apply {
                action = CallActionReceiver.ACTION_REJECT
            }
            val rejectPendingIntent = PendingIntent.getBroadcast(
                context,
                103,
                rejectIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val notif = NotificationCompat.Builder(context, NexusApplication.CHANNEL_CALL_ALERTS)
                .setSmallIcon(android.R.drawable.stat_sys_phone_call)
                .setContentTitle("Incoming GSM Call")
                .setContentText(displayNum)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setFullScreenIntent(fullScreenPendingIntent, true)
                .setContentIntent(fullScreenPendingIntent)
                .setOngoing(true)
                .setAutoCancel(false)
                .addAction(android.R.drawable.ic_menu_call, "Answer", answerPendingIntent)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Decline", rejectPendingIntent)
                .build()

            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            nm?.notify(NOTIFICATION_ID_INCOMING_CALL, notif)

            // Also try to launch Activity directly if possible
            context.startActivity(fullScreenIntent)
        } catch (e: Exception) {
            NexusApplication.log("WARN", "IncomingNotifier", "Notification/Activity launch error: ${e.message}")
        }
    }

    fun stopRinging(context: Context) {
        if (!isRinging) return
        isRinging = false
        NexusApplication.log("INFO", "IncomingNotifier", "Stopping incoming call alert (releasing audio, vibration, and wake lock)")

        // Stop ringtone
        try {
            activeRingtone?.stop()
            activeRingtone = null
        } catch (_: Exception) {}

        // Cancel vibration
        try {
            val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vm?.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            }
            vibrator?.cancel()
        } catch (_: Exception) {}

        // Release WakeLock
        try {
            if (wakeLock?.isHeld == true) {
                wakeLock?.release()
            }
            wakeLock = null
        } catch (_: Exception) {}

        // Cancel Notification
        try {
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            nm?.cancel(NOTIFICATION_ID_INCOMING_CALL)
        } catch (_: Exception) {}
    }
}
