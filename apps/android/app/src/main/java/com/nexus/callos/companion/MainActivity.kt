package com.nexus.callos.companion

import android.Manifest
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.os.PowerManager
import android.provider.Settings
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.nexus.callos.companion.network.WebSocketBridgeClient
import com.nexus.callos.companion.telephony.CallBridgeService
import com.nexus.callos.companion.telephony.HardwareTelemetryManager

class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "NexusMainActivity"
        private const val PERMISSION_REQUEST_CODE = 101
    }

    private lateinit var tvConnectionBadge: TextView
    private lateinit var tvStatusDetail: TextView
    private lateinit var tvLatency: TextView
    private lateinit var tvServerIp: EditText
    private lateinit var btnConnect: Button
    private lateinit var tvDeviceModel: TextView
    private lateinit var tvAndroidVersion: TextView
    private lateinit var tvBattery: TextView
    private lateinit var tvNetworkSignal: TextView
    private lateinit var tvSimCount: TextView
    private lateinit var llSimCardsContainer: LinearLayout
    private lateinit var tvNoSimMsg: TextView
    private lateinit var tvCallState: TextView
    private lateinit var tvAutoAnswer: TextView
    private lateinit var btnPermissions: Button

    private var bridgeService: CallBridgeService? = null
    private var isBound = false
    private var telemetryManager: HardwareTelemetryManager? = null

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            val binder = service as CallBridgeService.LocalBinder
            bridgeService = binder.getService()
            isBound = true
            updateServiceUi()

            bridgeService?.onStateChangedListener = { state, detail ->
                runOnUiThread {
                    handleConnectionStateChange(state, detail)
                }
            }

            bridgeService?.onLatencyChangedListener = { latencyMs ->
                runOnUiThread {
                    tvLatency.text = "$latencyMs ms"
                }
            }
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            bridgeService = null
            isBound = false
            updateServiceUi()
        }
    }

    private val requiredPermissions: Array<String>
        get() = buildList {
            add(Manifest.permission.INTERNET)
            add(Manifest.permission.ACCESS_NETWORK_STATE)
            add(Manifest.permission.RECORD_AUDIO)
            add(Manifest.permission.MODIFY_AUDIO_SETTINGS)
            add(Manifest.permission.READ_PHONE_STATE)
            add(Manifest.permission.CALL_PHONE)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                add(Manifest.permission.POST_NOTIFICATIONS)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                add(Manifest.permission.BLUETOOTH_CONNECT)
            }
        }.toTypedArray()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initViews()
        telemetryManager = HardwareTelemetryManager(this)

        telemetryManager?.onTelemetryUpdated = { snapshot ->
            runOnUiThread {
                renderTelemetry(snapshot)
            }
        }

        btnPermissions.setOnClickListener {
            requestAllPermissions()
        }

        btnConnect.setOnClickListener {
            toggleConnection()
        }

        checkAndRequestPermissions()
        refreshHardwareUi()
    }

    private fun initViews() {
        tvConnectionBadge = findViewById(R.id.tvConnectionBadge)
        tvStatusDetail = findViewById(R.id.tvStatusDetail)
        tvLatency = findViewById(R.id.tvLatency)
        tvServerIp = findViewById(R.id.tvServerIp)
        btnConnect = findViewById(R.id.btnConnect)
        tvDeviceModel = findViewById(R.id.tvDeviceModel)
        tvAndroidVersion = findViewById(R.id.tvAndroidVersion)
        tvBattery = findViewById(R.id.tvBattery)
        tvNetworkSignal = findViewById(R.id.tvNetworkSignal)
        tvSimCount = findViewById(R.id.tvSimCount)
        llSimCardsContainer = findViewById(R.id.llSimCardsContainer)
        tvNoSimMsg = findViewById(R.id.tvNoSimMsg)
        tvCallState = findViewById(R.id.tvCallState)
        tvAutoAnswer = findViewById(R.id.tvAutoAnswer)
        btnPermissions = findViewById(R.id.btnPermissions)

        // Set default server IP in input if not already saved
        val prefs = getSharedPreferences("nexus_companion_prefs", Context.MODE_PRIVATE)
        val savedServer = prefs.getString("server_url", "ws://192.168.1.34:8000/api/android-gateway/ws/bridge")
        tvServerIp.setText(savedServer)
    }

    override fun onStart() {
        super.onStart()
        val intent = Intent(this, CallBridgeService::class.java)
        bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE)
        refreshHardwareUi()
    }

    override fun onStop() {
        super.onStop()
        if (isBound) {
            unbindService(serviceConnection)
            isBound = false
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        telemetryManager?.unregister()
    }

    private fun refreshHardwareUi() {
        val snap = telemetryManager?.getSnapshot()
        if (snap != null) {
            renderTelemetry(snap)
        }
    }

    private fun renderTelemetry(snap: HardwareTelemetryManager.TelemetrySnapshot) {
        tvDeviceModel.text = snap.deviceModel
        tvAndroidVersion.text = "${snap.androidVersion} (API ${snap.sdkInt})"
        tvBattery.text = "${snap.batteryPercent}%${if (snap.isCharging) " ⚡ Charging" else ""}"
        tvNetworkSignal.text = "${snap.primaryNetworkType} (${snap.primarySignalDbm} dBm)"
        tvCallState.text = snap.callState
        tvSimCount.text = "${snap.subscriptions.size} Active SIM${if (snap.subscriptions.size != 1) "s" else ""}"

        renderSimList(snap.subscriptions, snap.selectedSubId)
    }

    private fun renderSimList(subs: List<HardwareTelemetryManager.SimSubscription>, selectedSubId: Int) {
        llSimCardsContainer.removeAllViews()

        if (subs.isEmpty()) {
            tvNoSimMsg.visibility = View.VISIBLE
            llSimCardsContainer.addView(tvNoSimMsg)
            return
        }

        tvNoSimMsg.visibility = View.GONE

        for (sub in subs) {
            val isSelected = (sub.subId == selectedSubId)
            val simCardView = createSimCardView(sub, isSelected)
            simCardView.setOnClickListener {
                telemetryManager?.setSelectedSubscriptionId(sub.subId)
                Toast.makeText(this, "Calling SIM set to: ${sub.carrierName} (SIM ${sub.slotIndex + 1})", Toast.LENGTH_SHORT).show()
                refreshHardwareUi()
            }
            llSimCardsContainer.addView(simCardView)
        }
    }

    private fun createSimCardView(sub: HardwareTelemetryManager.SimSubscription, isSelected: Boolean): View {
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 24, 32, 24)
            val bgRes = if (isSelected) R.color.surface_card_selected else R.color.surface_card
            setBackgroundColor(ContextCompat.getColor(context, bgRes))
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = 16
            }
        }

        // Header Row: Slot Name + eSIM Badge + Active Badge
        val headerRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }

        val tvSlotName = TextView(this).apply {
            text = "SIM ${sub.slotIndex + 1}: ${sub.carrierName}"
            setTextColor(ContextCompat.getColor(context, R.color.text_primary))
            textSize = 13f
            setTypeface(null, android.graphics.Typeface.BOLD)
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }
        headerRow.addView(tvSlotName)

        if (sub.isEsim) {
            val tvEsimBadge = TextView(this).apply {
                text = "eSIM"
                setTextColor(ContextCompat.getColor(context, R.color.accent))
                textSize = 10f
                setTypeface(null, android.graphics.Typeface.BOLD)
                setPadding(12, 4, 12, 4)
            }
            headerRow.addView(tvEsimBadge)
        }

        val tvSelectedBadge = TextView(this).apply {
            text = if (isSelected) "● ACTIVE CALLING SIM" else "○ SELECT"
            setTextColor(ContextCompat.getColor(context, if (isSelected) R.color.primary else R.color.text_muted))
            textSize = 10f
            setTypeface(null, android.graphics.Typeface.BOLD)
            setPadding(12, 4, 12, 4)
        }
        headerRow.addView(tvSelectedBadge)
        layout.addView(headerRow)

        // Sub details: Phone Number
        val tvNumber = TextView(this).apply {
            text = "Number: ${sub.number ?: "Not available from Android/carrier"}"
            setTextColor(ContextCompat.getColor(context, R.color.text_secondary))
            textSize = 11f
            setPadding(0, 8, 0, 4)
        }
        layout.addView(tvNumber)

        // Sub details: Network & Signal
        val tvSignal = TextView(this).apply {
            text = "Network: ${sub.networkType} | Signal: ${sub.signalDbm} dBm (Level ${sub.signalLevel}/4)"
            setTextColor(ContextCompat.getColor(context, R.color.text_muted))
            textSize = 11f
        }
        layout.addView(tvSignal)

        return layout
    }

    private fun checkAndRequestPermissions() {
        val missing = requiredPermissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (missing.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, missing.toTypedArray(), PERMISSION_REQUEST_CODE)
        } else {
            requestIgnoreBatteryOptimization()
            refreshHardwareUi()
        }
    }

    private fun requestAllPermissions() {
        ActivityCompat.requestPermissions(this, requiredPermissions, PERMISSION_REQUEST_CODE)
        requestIgnoreBatteryOptimization()
        refreshHardwareUi()
    }

    private fun requestIgnoreBatteryOptimization() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            if (!pm.isIgnoringBatteryOptimizations(packageName)) {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:$packageName")
                }
                try {
                    startActivity(intent)
                } catch (e: Exception) {
                    Log.w(TAG, "Cannot launch battery optimization intent", e)
                }
            }
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        refreshHardwareUi()
    }

    private fun toggleConnection() {
        if (bridgeService?.isRunning == true) {
            val stopIntent = Intent(this, CallBridgeService::class.java).apply {
                action = CallBridgeService.ACTION_STOP
            }
            startService(stopIntent)
            handleConnectionStateChange(WebSocketBridgeClient.ConnectionState.DISCONNECTED, "Service stopped by user")
        } else {
            val serverUrl = tvServerIp.text.toString().trim().ifEmpty {
                "ws://192.168.1.34:8000/api/android-gateway/ws/bridge"
            }

            val prefs = getSharedPreferences("nexus_companion_prefs", Context.MODE_PRIVATE)
            prefs.edit().putString("server_url", serverUrl).apply()

            var deviceId = prefs.getString("device_id", null)
            if (deviceId.isNullOrBlank()) {
                deviceId = "android-" + java.util.UUID.randomUUID().toString().take(8)
                prefs.edit().putString("device_id", deviceId).apply()
            }
            val deviceToken = prefs.getString("device_token", "dev_token_$deviceId")

            val startIntent = Intent(this, CallBridgeService::class.java).apply {
                action = CallBridgeService.ACTION_START
                putExtra(CallBridgeService.EXTRA_SERVER_URL, serverUrl)
                putExtra(CallBridgeService.EXTRA_DEVICE_ID, deviceId)
                putExtra(CallBridgeService.EXTRA_DEVICE_TOKEN, deviceToken)
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(startIntent)
            } else {
                startService(startIntent)
            }

            handleConnectionStateChange(WebSocketBridgeClient.ConnectionState.CONNECTING, "Connecting to $serverUrl...")
            Toast.makeText(this, "Starting Nexus Gateway Service...", Toast.LENGTH_SHORT).show()
        }
    }

    private fun handleConnectionStateChange(state: WebSocketBridgeClient.ConnectionState, detail: String?) {
        when (state) {
            WebSocketBridgeClient.ConnectionState.CONNECTED -> {
                tvConnectionBadge.text = "🟢 ONLINE"
                tvConnectionBadge.setTextColor(ContextCompat.getColor(this, R.color.status_online))
                tvStatusDetail.text = detail ?: "Connected & Active (Duplex Audio Bridge Online)"
                btnConnect.text = "Disconnect Gateway"
                btnConnect.setBackgroundColor(ContextCompat.getColor(this, R.color.status_offline))
            }
            WebSocketBridgeClient.ConnectionState.CONNECTING -> {
                tvConnectionBadge.text = "🟡 CONNECTING"
                tvConnectionBadge.setTextColor(ContextCompat.getColor(this, R.color.status_warning))
                tvStatusDetail.text = detail ?: "Connecting to WebSocket bridge..."
            }
            WebSocketBridgeClient.ConnectionState.RECONNECTING -> {
                tvConnectionBadge.text = "🟡 RECONNECTING"
                tvConnectionBadge.setTextColor(ContextCompat.getColor(this, R.color.status_warning))
                tvStatusDetail.text = detail ?: "Reconnecting..."
            }
            WebSocketBridgeClient.ConnectionState.DISCONNECTED -> {
                tvConnectionBadge.text = "🔴 OFFLINE"
                tvConnectionBadge.setTextColor(ContextCompat.getColor(this, R.color.status_offline))
                tvStatusDetail.text = detail ?: "Gateway disconnected (Standby)."
                tvLatency.text = "—"
                btnConnect.text = "Connect Gateway to Server"
                btnConnect.setBackgroundColor(ContextCompat.getColor(this, R.color.primary))
            }
        }
    }

    private fun updateServiceUi() {
        if (bridgeService?.isRunning == true) {
            handleConnectionStateChange(WebSocketBridgeClient.ConnectionState.CONNECTED, "Gateway Running in Background")
            val lat = bridgeService?.measuredLatencyMs ?: -1
            tvLatency.text = if (lat >= 0) "$lat ms" else "—"
        } else {
            handleConnectionStateChange(WebSocketBridgeClient.ConnectionState.DISCONNECTED, "Ready to Connect")
        }
    }
}
