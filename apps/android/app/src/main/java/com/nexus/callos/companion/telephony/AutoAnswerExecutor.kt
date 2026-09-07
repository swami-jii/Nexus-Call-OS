package com.nexus.callos.companion.telephony

import android.content.Context
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.telecom.TelecomManager
import androidx.core.content.ContextCompat
import com.nexus.callos.companion.NexusApplication

object AutoAnswerExecutor {

    private val mainHandler = Handler(Looper.getMainLooper())
    private var pendingAnswerRunnable: Runnable? = null

    var onCountdownTick: ((Int) -> Unit)? = null

    fun handleIncomingCall(context: Context, callerNumber: String?) {
        val prefs = context.getSharedPreferences("nexus_telephony_prefs", Context.MODE_PRIVATE)
        val isAutoAnswerEnabled = prefs.getBoolean("auto_answer_enabled", true)
        val delaySec = prefs.getInt("auto_answer_delay_sec", 3)

        if (!isAutoAnswerEnabled) {
            NexusApplication.log("INFO", "AutoAnswer", "Auto-answer is OFF. Call ringing normally.")
            return
        }

        cancelPendingAnswer()

        NexusApplication.log("INFO", "AutoAnswer", "Auto-answer triggered. Delay: ${delaySec}s for $callerNumber")

        if (delaySec <= 0) {
            executeAnswer(context)
            return
        }

        var remaining = delaySec
        onCountdownTick?.invoke(remaining)

        pendingAnswerRunnable = object : Runnable {
            override fun run() {
                remaining--
                if (remaining > 0) {
                    onCountdownTick?.invoke(remaining)
                    mainHandler.postDelayed(this, 1000L)
                } else {
                    onCountdownTick?.invoke(0)
                    executeAnswer(context)
                }
            }
        }
        mainHandler.postDelayed(pendingAnswerRunnable!!, 1000L)
    }

    fun cancelPendingAnswer() {
        pendingAnswerRunnable?.let {
            mainHandler.removeCallbacks(it)
            pendingAnswerRunnable = null
        }
    }

    fun executeAnswer(context: Context) {
        NexusApplication.log("INFO", "AutoAnswer", "Executing programmatic call pick-up...")

        // Strategy 1: Active InCallService
        if (CompanionInCallService.answerCurrentCall()) {
            NexusApplication.log("INFO", "AutoAnswer", "Call answered via CompanionInCallService.")
            return
        }

        // Strategy 2: TelecomManager.acceptRingingCall() (Android 8.0+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val telecom = context.getSystemService(Context.TELECOM_SERVICE) as? TelecomManager
            if (telecom != null && ContextCompat.checkSelfPermission(
                    context,
                    android.Manifest.permission.ANSWER_PHONE_CALLS
                ) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                try {
                    telecom.acceptRingingCall()
                    NexusApplication.log("INFO", "AutoAnswer", "Call answered via TelecomManager.acceptRingingCall()")
                    return
                } catch (e: Exception) {
                    NexusApplication.log("WARN", "AutoAnswer", "TelecomManager.acceptRingingCall failed: ${e.message}")
                }
            }
        }

        NexusApplication.log("WARN", "AutoAnswer", "Could not automatically answer. Ensure Default Phone App role is granted.")
    }
}
