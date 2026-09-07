package com.nexus.callos.companion.telephony

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.nexus.callos.companion.NexusApplication

class CallActionReceiver : BroadcastReceiver() {

    companion object {
        const val ACTION_ANSWER = "com.nexus.callos.companion.ACTION_ANSWER_CALL"
        const val ACTION_REJECT = "com.nexus.callos.companion.ACTION_REJECT_CALL"
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        val ctx = context ?: return
        val action = intent?.action ?: return
        NexusApplication.log("INFO", "CallActionReceiver", "Received incoming call notification action: $action")

        when (action) {
            ACTION_ANSWER -> {
                IncomingCallNotifier.stopRinging(ctx)
                CompanionInCallService.answerCurrentCall()
            }
            ACTION_REJECT -> {
                IncomingCallNotifier.stopRinging(ctx)
                CompanionInCallService.disconnectCurrentCall()
            }
        }
    }
}
