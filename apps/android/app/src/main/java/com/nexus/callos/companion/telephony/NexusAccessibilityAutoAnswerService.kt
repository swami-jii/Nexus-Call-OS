package com.nexus.callos.companion.telephony

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.Context
import android.graphics.Path
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.DisplayMetrics
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class NexusAccessibilityAutoAnswerService : AccessibilityService() {

    companion object {
        private const val TAG = "NexusAccessibility"
        private const val PREFS_NAME = "nexus_companion_prefs"
        var instance: NexusAccessibilityAutoAnswerService? = null
            private set

        // Known OEM InCall UI packages
        private val DIALER_PACKAGES = setOf(
            "com.samsung.android.incallui",
            "com.google.android.dialer",
            "com.android.incallui",
            "com.android.phone",
            "com.android.dialer",
            "com.miui.incallui",
            "com.miui.phone",
            "com.coloros.incallui",
            "com.oppo.dialer",
            "com.vivo.incallui",
            "com.vivo.phone",
            "com.oneplus.dialer",
            "com.transsion.incallui",
            "com.transsion.phone",
            "com.realme.dialer",
            "com.huawei.incallui",
            "com.motorola.incallui"
        )

        // Known answer button keywords in multiple languages (English, Hindi, etc.)
        private val ANSWER_KEYWORDS = listOf(
            "answer", "accept", "receive", "pickup", "pick up",
            "उत्तर", "उठाएं", "स्वीकार", "बात करें", "कॉल उठाएं",
            "swipe to answer", "swipe up to answer", "swipe right to answer"
        )

        // Known view resource IDs used across Android OEMs
        private val ANSWER_VIEW_IDS = listOf(
            "answer", "answer_button", "answerButton", "btn_answer", "btnAnswer",
            "call_accept", "accept_button", "incall_first_button", "incoming_call_answer",
            "voice_call_answer_btn", "swipe_to_answer", "answer_icon", "action_answer"
        )

        fun tryAnswerViaAccessibility(context: Context): Boolean {
            val service = instance ?: return false
            return service.executeUniversalAnswerSequence()
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.d(TAG, "[Accessibility] Nexus Universal Auto-Answer Accessibility Service Connected!")
    }

    override fun onDestroy() {
        super.onDestroy()
        if (instance == this) instance = null
        Log.d(TAG, "[Accessibility] Accessibility Service Destroyed.")
    }

    override fun onInterrupt() {
        Log.d(TAG, "[Accessibility] Service Interrupted.")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        val pkg = event.packageName?.toString() ?: ""

        val isDialerPkg = DIALER_PACKAGES.any { pkg.contains(it, ignoreCase = true) } ||
                pkg.contains("incall", ignoreCase = true) ||
                pkg.contains("dialer", ignoreCase = true) ||
                pkg.contains("telecom", ignoreCase = true)

        if (isDialerPkg) {
            val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val autoAnswerEnabled = prefs.getBoolean("auto_answer_enabled", true)
            val delaySec = prefs.getInt("auto_answer_delay_sec", 3)

            if (!autoAnswerEnabled) return

            Log.d(TAG, "[Accessibility] Incoming call window detected from $pkg. Scheduling auto-pickup in ${delaySec}s...")
            val handler = Handler(Looper.getMainLooper())
            if (delaySec <= 0) {
                executeUniversalAnswerSequence()
            } else {
                handler.postDelayed({ executeUniversalAnswerSequence() }, delaySec * 1000L)
            }
        }
    }

    fun executeUniversalAnswerSequence(): Boolean {
        var answered = false
        val rootNode = rootInActiveWindow

        if (rootNode != null) {
            answered = scanAndClickAnswerNode(rootNode)
            if (answered) {
                Log.d(TAG, "[Accessibility] Successfully answered call by clicking UI Node!")
                return true
            }
        }

        // Strategy 2: Swipe Gestures for lockscreen sliders (Samsung, Xiaomi, Pixel swipe up/right)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            answered = dispatchUniversalSwipeToAnswer()
            if (answered) {
                Log.d(TAG, "[Accessibility] Successfully dispatched swipe-to-answer gesture!")
                return true
            }
        }

        return false
    }

    private fun scanAndClickAnswerNode(node: AccessibilityNodeInfo): Boolean {
        // 1. Check matching view resource ID
        val viewId = node.viewIdResourceName?.lowercase() ?: ""
        for (idTarget in ANSWER_VIEW_IDS) {
            if (viewId.contains(idTarget)) {
                if (performClickOnNode(node)) {
                    Log.d(TAG, "[Accessibility] Clicked matching view ID: $viewId")
                    return true
                }
            }
        }

        // 2. Check matching text
        val text = node.text?.toString()?.lowercase() ?: ""
        for (keyword in ANSWER_KEYWORDS) {
            if (text.contains(keyword) && !text.contains("decline") && !text.contains("reject") && !text.contains("dismiss")) {
                if (performClickOnNode(node)) {
                    Log.d(TAG, "[Accessibility] Clicked matching text node: \"$text\"")
                    return true
                }
            }
        }

        // 3. Check contentDescription
        val desc = node.contentDescription?.toString()?.lowercase() ?: ""
        for (keyword in ANSWER_KEYWORDS) {
            if (desc.contains(keyword) && !desc.contains("decline") && !desc.contains("reject") && !desc.contains("dismiss")) {
                if (performClickOnNode(node)) {
                    Log.d(TAG, "[Accessibility] Clicked matching contentDescription node: \"$desc\"")
                    return true
                }
            }
        }

        // Recursively inspect child nodes
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            if (scanAndClickAnswerNode(child)) {
                return true
            }
        }

        return false
    }

    private fun performClickOnNode(target: AccessibilityNodeInfo): Boolean {
        var current: AccessibilityNodeInfo? = target
        while (current != null) {
            if (current.isClickable) {
                return current.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            }
            current = current.parent
        }
        return target.performAction(AccessibilityNodeInfo.ACTION_CLICK)
    }

    private fun dispatchUniversalSwipeToAnswer(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) return false
        val displayMetrics: DisplayMetrics = resources.displayMetrics
        val width = displayMetrics.widthPixels.toFloat()
        val height = displayMetrics.heightPixels.toFloat()

        // Path 1: Swipe Right (Samsung / Xiaomi standard lockscreen slider)
        val swipeRightPath = Path().apply {
            moveTo(width * 0.2f, height * 0.78f)
            lineTo(width * 0.85f, height * 0.78f)
        }

        // Path 2: Swipe Up (Google Pixel / Stock Android standard)
        val swipeUpPath = Path().apply {
            moveTo(width * 0.5f, height * 0.82f)
            lineTo(width * 0.5f, height * 0.35f)
        }

        try {
            val stroke1 = GestureDescription.StrokeDescription(swipeRightPath, 0, 350)
            val stroke2 = GestureDescription.StrokeDescription(swipeUpPath, 400, 350)
            val gesture = GestureDescription.Builder()
                .addStroke(stroke1)
                .addStroke(stroke2)
                .build()

            return dispatchGesture(gesture, object : GestureResultCallback() {
                override fun onCompleted(gestureDescription: GestureDescription?) {
                    Log.d(TAG, "[Accessibility] Swipe gestures completed successfully.")
                }
                override fun onCancelled(gestureDescription: GestureDescription?) {
                    Log.d(TAG, "[Accessibility] Swipe gestures cancelled.")
                }
            }, null)
        } catch (e: Exception) {
            Log.w(TAG, "[Accessibility] Error dispatching gesture: ${e.message}")
            return false
        }
    }
}
