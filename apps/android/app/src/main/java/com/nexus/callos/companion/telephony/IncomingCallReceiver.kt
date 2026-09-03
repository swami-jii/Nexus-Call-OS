package com.nexus.callos.companion.telephony

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import android.util.Log

class IncomingCallReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "NexusCallReceiver"
        private const val PREFS_NAME = "nexus_companion_prefs"
    }

    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != TelephonyManager.ACTION_PHONE_STATE_CHANGED &&
            intent?.action != "android.intent.action.PHONE_STATE") {
            return
        }

        val stateStr = intent.getStringExtra(TelephonyManager.EXTRA_STATE) ?: return
        val incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER) ?: "Unknown"

        Log.d(TAG, "[IncomingCallReceiver] State: $stateStr, Number: $incomingNumber")

        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val autoAnswerEnabled = prefs.getBoolean("auto_answer_enabled", true)
        val delaySec = prefs.getInt("auto_answer_delay_sec", 3)

        if (stateStr == TelephonyManager.EXTRA_STATE_RINGING) {
            Log.d(TAG, "[IncomingCallReceiver] Incoming call RINGING. Auto-Answer=$autoAnswerEnabled, Delay=${delaySec}s")
            if (autoAnswerEnabled) {
                CallAnswerExecutor.executeAutoAnswer(context, delaySec)
            }
        }
    }
}
