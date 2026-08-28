package com.nexus.callos.companion.telephony

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.telecom.Call
import android.telecom.InCallService
import android.telecom.VideoProfile
import android.util.Log

class AutoAnswerInCallService : InCallService() {

    companion object {
        private const val TAG = "NexusAutoAnswer"
        private const val PREFS_NAME = "nexus_companion_prefs"
    }

    override fun onCallAdded(call: Call) {
        super.onCallAdded(call)
        Log.d(TAG, "Incoming call received: state=${call.state}")

        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val autoAnswerEnabled = prefs.getBoolean("auto_answer_enabled", true)
        val delaySec = prefs.getInt("auto_answer_delay_sec", 3)

        if (!autoAnswerEnabled) {
            Log.d(TAG, "Auto-answer is DISABLED by user preference.")
            return
        }

        val handler = Handler(Looper.getMainLooper())

        fun attemptAnswer() {
            if (call.state == Call.STATE_RINGING) {
                try {
                    call.answer(VideoProfile.STATE_AUDIO_ONLY)
                    Log.d(TAG, "Call successfully auto-answered after ${delaySec}s delay.")
                } catch (e: Exception) {
                    Log.e(TAG, "Error answering call: ${e.message}", e)
                }
            }
        }

        if (call.state == Call.STATE_RINGING) {
            if (delaySec <= 0) {
                attemptAnswer()
            } else {
                Log.d(TAG, "Scheduling auto-answer in ${delaySec} seconds...")
                handler.postDelayed({ attemptAnswer() }, delaySec * 1000L)
            }
        } else {
            call.registerCallback(object : Call.Callback() {
                override fun onStateChanged(c: Call, state: Int) {
                    if (state == Call.STATE_RINGING) {
                        if (delaySec <= 0) {
                            attemptAnswer()
                        } else {
                            Log.d(TAG, "Call transitioned to RINGING, answering in ${delaySec} seconds...")
                            handler.postDelayed({ attemptAnswer() }, delaySec * 1000L)
                        }
                    }
                }
            })
        }
    }

    override fun onCallRemoved(call: Call) {
        super.onCallRemoved(call)
        Log.d(TAG, "Call ended / removed from telecom stack.")
    }
}
