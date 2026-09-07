package com.nexus.callos.companion.telephony

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import com.nexus.callos.companion.NexusApplication

class IncomingCallReceiver : BroadcastReceiver() {

    companion object {
        var onPhoneStateChanged: ((state: String, incomingNumber: String?) -> Unit)? = null
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action == TelephonyManager.ACTION_PHONE_STATE_CHANGED) {
            val stateStr = intent.getStringExtra(TelephonyManager.EXTRA_STATE) ?: return
            val number = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)

            NexusApplication.log("INFO", "PhoneState", "State: $stateStr, Number: ${number ?: "Hidden"}")
            onPhoneStateChanged?.invoke(stateStr, number)

            if (stateStr == TelephonyManager.EXTRA_STATE_RINGING && context != null) {
                AutoAnswerExecutor.handleIncomingCall(context, number)
            }
        }
    }
}
