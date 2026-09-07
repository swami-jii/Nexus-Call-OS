package com.nexus.callos.companion.telephony

import android.content.Context
import android.os.Build
import android.telecom.Call
import android.telecom.CallScreeningService
import androidx.annotation.RequiresApi
import com.nexus.callos.companion.NexusApplication

@RequiresApi(Build.VERSION_CODES.N)
class CallScreeningServiceImpl : CallScreeningService() {

    companion object {
        var onScreeningCallDetected: ((String) -> Unit)? = null
    }

    override fun onScreenCall(callDetails: Call.Details) {
        val caller = try {
            callDetails.handle?.schemeSpecificPart ?: "Unknown"
        } catch (e: Exception) {
            "Unknown"
        }

        NexusApplication.log("INFO", "Screening", "CallScreeningService screening call from: $caller")
        onScreeningCallDetected?.invoke(caller)

        val prefs = getSharedPreferences("nexus_telephony_prefs", Context.MODE_PRIVATE)
        val autoRejectUnknown = prefs.getBoolean("auto_reject_unknown", false)

        val isUnknownCaller = caller == "Unknown" || caller.isBlank() ||
                caller.startsWith("Private", ignoreCase = true) ||
                caller.startsWith("Withheld", ignoreCase = true) ||
                caller.startsWith("+000") ||
                caller == "RESTRICTED"

        val shouldReject = autoRejectUnknown && isUnknownCaller

        val response = if (shouldReject) {
            NexusApplication.log("WARN", "Screening", "Call from $caller rejected by CallScreeningService policy: Auto-reject unknown is ON.")
            CallResponse.Builder()
                .setDisallowCall(true)
                .setRejectCall(true)
                .setSkipCallLog(false)
                .setSkipNotification(true)
                .build()
        } else {
            CallResponse.Builder()
                .setDisallowCall(false)
                .setRejectCall(false)
                .setSkipCallLog(false)
                .setSkipNotification(false)
                .build()
        }

        respondToCall(callDetails, response)
    }
}
