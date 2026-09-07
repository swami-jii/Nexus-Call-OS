package com.nexus.callos.companion.telephony

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.telecom.Call
import android.telecom.CallAudioState
import android.telecom.InCallService
import android.telecom.TelecomManager
import android.telecom.VideoProfile
import androidx.core.content.ContextCompat
import com.nexus.callos.companion.NexusApplication
import com.nexus.callos.companion.model.CallSession
import com.nexus.callos.companion.model.CallState

class CompanionInCallService : InCallService() {

    companion object {
        var instance: CompanionInCallService? = null
            private set

        var activeCall: Call? = null
            private set

        var isCurrentCallIncoming: Boolean = true
            private set

        var onCallSessionChanged: ((CallSession) -> Unit)? = null
        var onAudioStateChanged: ((CallAudioState) -> Unit)? = null

        fun placeOutgoingCall(context: Context, number: String, subId: Int = -1): Boolean {
            val hasCallPermission = ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.CALL_PHONE
            ) == PackageManager.PERMISSION_GRANTED

            if (!hasCallPermission) {
                NexusApplication.log("WARN", "InCallService", "CALL_PHONE permission not granted to place call.")
                val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$number")).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(dialIntent)
                return false
            }

            return try {
                isCurrentCallIncoming = false
                val telecomManager = context.getSystemService(Context.TELECOM_SERVICE) as? TelecomManager
                val uri = Uri.fromParts("tel", number, null)

                if (telecomManager != null && (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)) {
                    val extras = Bundle()
                    if (subId != -1) {
                        extras.putInt("android.telecom.extra.SUBSCRIPTION_ID", subId)
                    }
                    telecomManager.placeCall(uri, extras)
                    NexusApplication.log("INFO", "InCallService", "Placed cellular outgoing call to: $number via TelecomManager (subId=$subId)")
                } else {
                    val callIntent = Intent(Intent.ACTION_CALL, uri).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                        if (subId != -1) {
                            putExtra("com.android.phone.extra.slot", subId)
                        }
                    }
                    context.startActivity(callIntent)
                    NexusApplication.log("INFO", "InCallService", "Placed cellular outgoing call to: $number via ACTION_CALL")
                }

                onCallSessionChanged?.invoke(
                    CallSession(
                        state = CallState.DIALING,
                        callerNumber = number,
                        isIncoming = false,
                        startTimeMs = System.currentTimeMillis()
                    )
                )
                true
            } catch (e: Exception) {
                NexusApplication.log("ERROR", "InCallService", "Failed to place outgoing call: ${e.message}")
                try {
                    val fallbackIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$number")).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    context.startActivity(fallbackIntent)
                } catch (e2: Exception) {
                    // Ignore
                }
                false
            }
        }

        fun answerCurrentCall(): Boolean {
            val call = activeCall ?: return false
            return try {
                call.answer(VideoProfile.STATE_AUDIO_ONLY)
                NexusApplication.log("INFO", "InCallService", "Programmatic call.answer() executed successfully.")
                true
            } catch (e: Exception) {
                NexusApplication.log("ERROR", "InCallService", "Failed to answer call: ${e.message}")
                false
            }
        }

        fun disconnectCurrentCall(): Boolean {
            val call = activeCall ?: return false
            return try {
                call.disconnect()
                NexusApplication.log("INFO", "InCallService", "Programmatic call.disconnect() executed.")
                true
            } catch (e: Exception) {
                NexusApplication.log("ERROR", "InCallService", "Failed to disconnect call: ${e.message}")
                false
            }
        }

        fun setMuted(muted: Boolean) {
            val svc = instance ?: return
            try {
                svc.setMuted(muted)
                NexusApplication.log("INFO", "InCallService", "Set call mute state: $muted")
            } catch (e: Exception) {
                NexusApplication.log("WARN", "InCallService", "Set mute failed: ${e.message}")
            }
        }

        fun isMuted(): Boolean {
            return instance?.callAudioState?.isMuted ?: false
        }

        fun setSpeaker(enabled: Boolean) {
            val svc = instance ?: return
            val targetRoute = if (enabled) CallAudioState.ROUTE_SPEAKER else CallAudioState.ROUTE_EARPIECE
            try {
                svc.setAudioRoute(targetRoute)
                NexusApplication.log("INFO", "InCallService", "Set audio route: ${if (enabled) "SPEAKER" else "EARPIECE"}")
            } catch (e: Exception) {
                NexusApplication.log("WARN", "InCallService", "Audio route failed: ${e.message}")
            }
        }

        fun isSpeakerOn(): Boolean {
            return instance?.callAudioState?.route == CallAudioState.ROUTE_SPEAKER
        }

        fun playDtmf(digit: Char) {
            val call = activeCall ?: return
            try {
                call.playDtmfTone(digit)
                call.stopDtmfTone()
                NexusApplication.log("INFO", "InCallService", "Played DTMF tone: $digit")
            } catch (e: Exception) {
                NexusApplication.log("WARN", "InCallService", "DTMF failed: ${e.message}")
            }
        }

        fun startDtmfTone(digit: Char) {
            val call = activeCall ?: return
            try {
                call.playDtmfTone(digit)
            } catch (e: Exception) {
                NexusApplication.log("WARN", "InCallService", "startDtmfTone failed: ${e.message}")
            }
        }

        fun stopDtmfTone() {
            val call = activeCall ?: return
            try {
                call.stopDtmfTone()
            } catch (e: Exception) {
                NexusApplication.log("WARN", "InCallService", "stopDtmfTone failed: ${e.message}")
            }
        }

        fun toggleHold(): Boolean {
            val call = activeCall ?: return false
            return try {
                if (call.state == Call.STATE_HOLDING) {
                    call.unhold()
                    NexusApplication.log("INFO", "InCallService", "Call unheld.")
                    false
                } else {
                    call.hold()
                    NexusApplication.log("INFO", "InCallService", "Call put on hold.")
                    true
                }
            } catch (e: Exception) {
                NexusApplication.log("WARN", "InCallService", "Hold toggle failed: ${e.message}")
                false
            }
        }
    }

    private val callCallback = object : Call.Callback() {
        override fun onStateChanged(call: Call, state: Int) {
            super.onStateChanged(call, state)
            val callerNumber = getCallerNumber(call)
            when (state) {
                Call.STATE_RINGING -> {
                    isCurrentCallIncoming = true
                    NexusApplication.log("INFO", "InCallService", "Call RINGING: $callerNumber")
                    IncomingCallNotifier.startRinging(this@CompanionInCallService, callerNumber)
                    onCallSessionChanged?.invoke(
                        CallSession(
                            state = CallState.RINGING,
                            callerNumber = callerNumber,
                            isIncoming = true,
                            startTimeMs = System.currentTimeMillis()
                        )
                    )
                    AutoAnswerExecutor.handleIncomingCall(this@CompanionInCallService, callerNumber)
                }
                Call.STATE_DIALING, Call.STATE_CONNECTING -> {
                    isCurrentCallIncoming = false
                    IncomingCallNotifier.stopRinging(this@CompanionInCallService)
                    NexusApplication.log("INFO", "InCallService", "Call DIALING/CONNECTING: $callerNumber")
                    onCallSessionChanged?.invoke(
                        CallSession(
                            state = CallState.DIALING,
                            callerNumber = callerNumber,
                            isIncoming = false,
                            startTimeMs = System.currentTimeMillis()
                        )
                    )
                }
                Call.STATE_ACTIVE -> {
                    NexusApplication.log("INFO", "InCallService", "Call ACTIVE / CONNECTED: $callerNumber")
                    IncomingCallNotifier.stopRinging(this@CompanionInCallService)
                    AutoAnswerExecutor.cancelPendingAnswer()
                    onCallSessionChanged?.invoke(
                        CallSession(
                            state = CallState.CONNECTED,
                            callerNumber = callerNumber,
                            isIncoming = isCurrentCallIncoming,
                            isMuted = isMuted(),
                            isSpeakerOn = isSpeakerOn(),
                            startTimeMs = System.currentTimeMillis()
                        )
                    )
                }
                Call.STATE_HOLDING -> {
                    NexusApplication.log("INFO", "InCallService", "Call HOLDING: $callerNumber")
                    IncomingCallNotifier.stopRinging(this@CompanionInCallService)
                    onCallSessionChanged?.invoke(
                        CallSession(
                            state = CallState.HOLDING,
                            callerNumber = callerNumber,
                            isIncoming = isCurrentCallIncoming,
                            isOnHold = true
                        )
                    )
                }
                Call.STATE_DISCONNECTED -> {
                    NexusApplication.log("INFO", "InCallService", "Call DISCONNECTED")
                    IncomingCallNotifier.stopRinging(this@CompanionInCallService)
                    AutoAnswerExecutor.cancelPendingAnswer()
                    onCallSessionChanged?.invoke(
                        CallSession(state = CallState.IDLE)
                    )
                    activeCall = null
                }
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        NexusApplication.log("INFO", "InCallService", "CompanionInCallService created and registered with Telecom.")
    }

    override fun onDestroy() {
        super.onDestroy()
        IncomingCallNotifier.stopRinging(this)
        instance = null
        activeCall = null
    }

    override fun onCallAdded(call: Call) {
        super.onCallAdded(call)
        activeCall = call
        call.registerCallback(callCallback)
        val callerNumber = getCallerNumber(call)
        val state = call.state
        NexusApplication.log("INFO", "InCallService", "New call added to Telecom stack: $callerNumber (state=$state)")

        when (state) {
            Call.STATE_RINGING -> {
                isCurrentCallIncoming = true
                IncomingCallNotifier.startRinging(this, callerNumber)
                onCallSessionChanged?.invoke(
                    CallSession(
                        state = CallState.RINGING,
                        callerNumber = callerNumber,
                        isIncoming = true,
                        startTimeMs = System.currentTimeMillis()
                    )
                )
                AutoAnswerExecutor.handleIncomingCall(this, callerNumber)
            }
            Call.STATE_DIALING, Call.STATE_CONNECTING -> {
                isCurrentCallIncoming = false
                IncomingCallNotifier.stopRinging(this)
                onCallSessionChanged?.invoke(
                    CallSession(
                        state = CallState.DIALING,
                        callerNumber = callerNumber,
                        isIncoming = false,
                        startTimeMs = System.currentTimeMillis()
                    )
                )
            }
            Call.STATE_ACTIVE -> {
                IncomingCallNotifier.stopRinging(this)
                onCallSessionChanged?.invoke(
                    CallSession(
                        state = CallState.CONNECTED,
                        callerNumber = callerNumber,
                        isIncoming = isCurrentCallIncoming,
                        startTimeMs = System.currentTimeMillis()
                    )
                )
            }
        }
    }

    override fun onCallAudioStateChanged(audioState: CallAudioState) {
        super.onCallAudioStateChanged(audioState)
        NexusApplication.log(
            "INFO",
            "InCallService",
            "Audio state changed: muted=${audioState.isMuted}, route=${audioState.route}"
        )
        onAudioStateChanged?.invoke(audioState)
    }

    override fun onCallRemoved(call: Call) {
        super.onCallRemoved(call)
        if (activeCall == call) {
            activeCall = null
        }
        call.unregisterCallback(callCallback)
        IncomingCallNotifier.stopRinging(this)
        AutoAnswerExecutor.cancelPendingAnswer()
        NexusApplication.log("INFO", "InCallService", "Call removed from Telecom stack.")
        onCallSessionChanged?.invoke(CallSession(state = CallState.IDLE))
    }

    private fun getCallerNumber(call: Call): String {
        return try {
            val handle = call.details?.handle
            handle?.schemeSpecificPart ?: "Unknown Caller"
        } catch (e: Exception) {
            "Unknown Caller"
        }
    }
}
