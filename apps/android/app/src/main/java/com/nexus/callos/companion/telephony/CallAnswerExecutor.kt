package com.nexus.callos.companion.telephony

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.telecom.TelecomManager
import android.telecom.VideoProfile
import android.util.Log
import android.view.KeyEvent
import androidx.core.content.ContextCompat

object CallAnswerExecutor {

    private const val TAG = "CallAnswerExecutor"

    /**
     * Multi-Strategy Auto-Answer Engine:
     * 1. InCallService Active Call (Direct telecom answer)
     * 2. TelecomManager.acceptRingingCall (Android 8.0+)
     * 3. Notification Call Answer Action (Universal Samsung / Xiaomi / Vivo PendingIntent trigger)
     * 4. AudioManager MediaKeyEvents (HeadsetHook & Call keys)
     * 5. Runtime Shell Input KeyEvents
     */
    fun executeAutoAnswer(context: Context, delaySec: Int = 3) {
        val handler = Handler(Looper.getMainLooper())

        fun performSingleAnswerAttempt(attemptIndex: Int) {
            Log.d(TAG, "[ExecuteAutoAnswer] Attempt #$attemptIndex: Initiating multi-strategy call pickup sequence...")

            // Strategy 1: InCallService active call answer (Direct Telecom Layer)
            try {
                val inCall = AutoAnswerInCallService.currentRingingCall
                if (inCall != null) {
                    inCall.answer(VideoProfile.STATE_AUDIO_ONLY)
                    Log.d(TAG, "[Strategy 1] InCallService.answer() executed successfully.")
                    return
                }
            } catch (e: Exception) {
                Log.w(TAG, "[Strategy 1] InCallService failed: ${e.message}")
            }

            // Strategy 2: Universal Accessibility Node & Swipe Engine
            try {
                val answeredViaA11y = NexusAccessibilityAutoAnswerService.tryAnswerViaAccessibility(context)
                if (answeredViaA11y) {
                    Log.d(TAG, "[Strategy 2] Answered via Accessibility Node/Gesture Engine!")
                    return
                }
            } catch (e: Exception) {
                Log.w(TAG, "[Strategy 2] Accessibility answer failed: ${e.message}")
            }

            // Strategy 3: Universal Notification Action Trigger (Samsung One UI / Xiaomi / Vivo)
            try {
                val answeredViaNotif = NotificationCallAnswerService.triggerCallAnswerAction(context)
                if (answeredViaNotif) {
                    Log.d(TAG, "[Strategy 3] Answered via Notification Action PendingIntent!")
                    return
                }
            } catch (e: Exception) {
                Log.w(TAG, "[Strategy 3] Notification action trigger failed: ${e.message}")
            }

            // Strategy 4: TelecomManager acceptRingingCall API (Native Android Telecom)
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.ANSWER_PHONE_CALLS) == PackageManager.PERMISSION_GRANTED) {
                try {
                    val telecomManager = context.getSystemService(Context.TELECOM_SERVICE) as? TelecomManager
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        telecomManager?.acceptRingingCall()
                        Log.d(TAG, "[Strategy 4] TelecomManager.acceptRingingCall() executed.")
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "[Strategy 4] TelecomManager accept failed: ${e.message}")
                }
            }

            // Strategy 5: AudioManager MediaKeyEvents & Ordered Broadcast
            try {
                val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
                if (audioManager != null) {
                    val now = SystemClock.uptimeMillis()
                    // Dispatch KEYCODE_HEADSETHOOK
                    val downHook = KeyEvent(now, now, KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_HEADSETHOOK, 0)
                    val upHook = KeyEvent(now + 50, now + 50, KeyEvent.ACTION_UP, KeyEvent.KEYCODE_HEADSETHOOK, 0)
                    audioManager.dispatchMediaKeyEvent(downHook)
                    audioManager.dispatchMediaKeyEvent(upHook)

                    // Dispatch KEYCODE_CALL
                    val downCall = KeyEvent(now, now, KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_CALL, 0)
                    val upCall = KeyEvent(now + 50, now + 50, KeyEvent.ACTION_UP, KeyEvent.KEYCODE_CALL, 0)
                    audioManager.dispatchMediaKeyEvent(downCall)
                    audioManager.dispatchMediaKeyEvent(upCall)

                    // Broadcast Media Button intents
                    try {
                        val mbIntentDown = android.content.Intent(android.content.Intent.ACTION_MEDIA_BUTTON).apply {
                            putExtra(android.content.Intent.EXTRA_KEY_EVENT, downHook)
                        }
                        context.sendOrderedBroadcast(mbIntentDown, null)
                        val mbIntentUp = android.content.Intent(android.content.Intent.ACTION_MEDIA_BUTTON).apply {
                            putExtra(android.content.Intent.EXTRA_KEY_EVENT, upHook)
                        }
                        context.sendOrderedBroadcast(mbIntentUp, null)
                    } catch (e: Exception) {
                        // ignore
                    }

                    Log.d(TAG, "[Strategy 5] Dispatched HeadsetHook & Call MediaKeyEvents.")
                }
            } catch (e: Exception) {
                Log.w(TAG, "[Strategy 5] MediaKeyEvent failed: ${e.message}")
            }

            // Strategy 6: Runtime Shell Input KeyEvents fallback
            try {
                Runtime.getRuntime().exec(arrayOf("input", "keyevent", "79"))
                Runtime.getRuntime().exec(arrayOf("input", "keyevent", "5"))
                Log.d(TAG, "[Strategy 6] Dispatched input keyevent 79 / 5.")
            } catch (e: Exception) {
                // Ignore shell execution errors
            }
        }

        fun startBurstAnswerSequence() {
            // Run 8 successive attempts spaced 400ms apart to catch lock screen rendering
            for (i in 0 until 8) {
                handler.postDelayed({ performSingleAnswerAttempt(i + 1) }, i * 400L)
            }
        }

        if (delaySec <= 0) {
            startBurstAnswerSequence()
        } else {
            Log.d(TAG, "[ExecuteAutoAnswer] Scheduling burst automatic pickup in ${delaySec}s...")
            handler.postDelayed({ startBurstAnswerSequence() }, delaySec * 1000L)
        }
    }
}
