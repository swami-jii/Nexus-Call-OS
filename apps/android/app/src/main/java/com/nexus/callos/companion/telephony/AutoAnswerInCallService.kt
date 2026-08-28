package com.nexus.callos.companion.telephony

import android.os.Build
import android.telecom.Call
import android.telecom.InCallService
import android.telecom.VideoProfile
import android.util.Log

class AutoAnswerInCallService : InCallService() {

    override fun onCallAdded(call: Call) {
        super.onCallAdded(call)
        Log.d("NexusAutoAnswer", "New call received via SIM")

        if (call.state == Call.STATE_RINGING) {
            call.answer(VideoProfile.STATE_AUDIO_ONLY)
            Log.d("NexusAutoAnswer", "Call automatically answered via Nexus InCallService")
        }
    }

    override fun onCallRemoved(call: Call) {
        super.onCallRemoved(call)
        Log.d("NexusAutoAnswer", "Call removed / ended")
    }
}
