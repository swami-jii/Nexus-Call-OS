package com.nexus.callos.companion.ui

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.nexus.callos.companion.NexusApplication
import com.nexus.callos.companion.R
import com.nexus.callos.companion.model.CallState
import com.nexus.callos.companion.telephony.AutoAnswerExecutor
import com.nexus.callos.companion.telephony.CompanionInCallService
import com.nexus.callos.companion.telephony.ContactsManager
import com.nexus.callos.companion.telephony.IncomingCallNotifier
import com.nexus.callos.companion.telephony.SimSubscriptionManager

class IncomingCallActivity : AppCompatActivity() {

    private lateinit var ivIncomingAvatar: ImageView
    private lateinit var tvIncomingCallerName: TextView
    private lateinit var tvIncomingCallerNumber: TextView
    private lateinit var tvIncomingSimLine: TextView
    private lateinit var layoutIncomingAutoAnswerStatus: LinearLayout
    private lateinit var tvIncomingAutoAnswerCountdown: TextView
    private lateinit var btnIncomingDecline: ImageButton
    private lateinit var btnIncomingAnswer: ImageButton
    private lateinit var viewAvatarGlowRing: View

    private lateinit var contactsManager: ContactsManager
    private lateinit var simManager: SimSubscriptionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Wake screen and show over lock screen
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            )
        }

        setContentView(R.layout.activity_incoming_call)

        contactsManager = ContactsManager(this)
        simManager = SimSubscriptionManager(this)

        initViews()
        bindCallerData(intent)
        setupListeners()
    }

    private fun initViews() {
        ivIncomingAvatar = findViewById(R.id.ivIncomingAvatar)
        tvIncomingCallerName = findViewById(R.id.tvIncomingCallerName)
        tvIncomingCallerNumber = findViewById(R.id.tvIncomingCallerNumber)
        tvIncomingSimLine = findViewById(R.id.tvIncomingSimLine)
        layoutIncomingAutoAnswerStatus = findViewById(R.id.layoutIncomingAutoAnswerStatus)
        tvIncomingAutoAnswerCountdown = findViewById(R.id.tvIncomingAutoAnswerCountdown)
        btnIncomingDecline = findViewById(R.id.btnIncomingDecline)
        btnIncomingAnswer = findViewById(R.id.btnIncomingAnswer)
        viewAvatarGlowRing = findViewById(R.id.viewAvatarGlowRing)
    }

    private fun bindCallerData(intent: Intent?) {
        val callerNumber = intent?.getStringExtra("caller_number") ?: "Unknown Caller"
        tvIncomingCallerNumber.text = callerNumber

        val (contactName, photoUri) = contactsManager.resolveContact(callerNumber)
        tvIncomingCallerName.text = if (!contactName.isNullOrBlank()) contactName else callerNumber

        if (!photoUri.isNullOrBlank()) {
            try {
                ivIncomingAvatar.setImageURI(Uri.parse(photoUri))
                ivIncomingAvatar.clearColorFilter()
                ivIncomingAvatar.setPadding(0, 0, 0, 0)
            } catch (_: Exception) {}
        }

        val activeSubs = simManager.getActiveSubscriptions()
        val selectedSubId = simManager.getSelectedSubscriptionId()
        val currentSub = activeSubs.find { it.subId == selectedSubId } ?: activeSubs.firstOrNull()
        tvIncomingSimLine.text = if (currentSub != null) {
            "${currentSub.displayName} (${currentSub.carrierName}) • Cellular VoLTE"
        } else {
            "Cellular VoLTE Line"
        }

        val telPrefs = getSharedPreferences("nexus_telephony_prefs", Context.MODE_PRIVATE)
        val isAutoAnswer = telPrefs.getBoolean("auto_answer_enabled", true)
        val delaySec = telPrefs.getInt("auto_answer_delay_sec", 3)

        if (isAutoAnswer) {
            layoutIncomingAutoAnswerStatus.visibility = View.VISIBLE
            tvIncomingAutoAnswerCountdown.text = "AI Gateway: Auto-answering in ${delaySec}s..."
        } else {
            layoutIncomingAutoAnswerStatus.visibility = View.GONE
        }
    }

    private fun setupListeners() {
        btnIncomingAnswer.setOnClickListener {
            IncomingCallNotifier.stopRinging(this)
            CompanionInCallService.answerCurrentCall()
            navigateToMainActivity()
        }

        btnIncomingDecline.setOnClickListener {
            IncomingCallNotifier.stopRinging(this)
            CompanionInCallService.disconnectCurrentCall()
            finish()
        }

        AutoAnswerExecutor.onCountdownTick = { remainingSec ->
            runOnUiThread {
                if (remainingSec > 0) {
                    tvIncomingAutoAnswerCountdown.text = "AI Gateway: Auto-answering in ${remainingSec}s..."
                } else {
                    tvIncomingAutoAnswerCountdown.text = "Answering Call..."
                }
            }
        }

        CompanionInCallService.onCallSessionChanged = { session ->
            runOnUiThread {
                when (session.state) {
                    CallState.CONNECTED -> {
                        IncomingCallNotifier.stopRinging(this@IncomingCallActivity)
                        navigateToMainActivity()
                    }
                    CallState.IDLE, CallState.DISCONNECTED -> {
                        IncomingCallNotifier.stopRinging(this@IncomingCallActivity)
                        finish()
                    }
                    else -> {}
                }
            }
        }
    }

    private fun navigateToMainActivity() {
        val mainIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("open_calls_tab", true)
        }
        startActivity(mainIntent)
        finish()
    }

    override fun onDestroy() {
        super.onDestroy()
        AutoAnswerExecutor.onCountdownTick = null
    }
}
