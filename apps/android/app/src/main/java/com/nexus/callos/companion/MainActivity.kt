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
import android.view.View
import android.widget.*
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.GravityCompat
import androidx.drawerlayout.widget.DrawerLayout
import androidx.lifecycle.lifecycleScope
import com.nexus.callos.companion.network.WebSocketBridgeClient
import com.nexus.callos.companion.telephony.CallBridgeService
import com.nexus.callos.companion.telephony.HardwareTelemetryManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "NexusMainActivity"
    }

    private lateinit var drawerLayout: DrawerLayout
    private lateinit var btnMenu: ImageButton
    private lateinit var tvAppTitle: TextView
    private lateinit var tvHeaderConnection: TextView

    // Layout Tabs
    private lateinit var layoutGatewayView: LinearLayout
    private lateinit var layoutAgentsView: LinearLayout
    private lateinit var layoutVoicesView: LinearLayout
    private lateinit var layoutDiagnosticsView: LinearLayout

    // Nav Drawer items
    private lateinit var navItemGateway: LinearLayout
    private lateinit var navItemAgents: LinearLayout
    private lateinit var navItemVoices: LinearLayout
    private lateinit var navItemDiagnostics: LinearLayout
    private lateinit var navBtnAppPermissions: Button

    // Gateway Tab Views
    private lateinit var bannerPermissions: LinearLayout
    private lateinit var tvPermissionBannerTitle: TextView
    private lateinit var tvPermissionBannerDetail: TextView
    private lateinit var btnGrantPermissions: Button
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

    // Dynamic containers for Agents, Voices, Diagnostics
    private lateinit var llAgentsContainer: LinearLayout
    private lateinit var llVoicesContainer: LinearLayout
    private lateinit var llDiagnosticsContainer: LinearLayout

    private var bridgeService: CallBridgeService? = null
    private var isBound = false
    private var telemetryManager: HardwareTelemetryManager? = null
    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(5, TimeUnit.SECONDS)
        .readTimeout(5, TimeUnit.SECONDS)
        .build()

    private val requiredPermissions: Array<String>
        get() = buildList {
            add(Manifest.permission.INTERNET)
            add(Manifest.permission.ACCESS_NETWORK_STATE)
            add(Manifest.permission.RECORD_AUDIO)
            add(Manifest.permission.MODIFY_AUDIO_SETTINGS)
            add(Manifest.permission.READ_PHONE_STATE)
            add(Manifest.permission.CALL_PHONE)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                add(Manifest.permission.ANSWER_PHONE_CALLS)
                add(Manifest.permission.READ_PHONE_NUMBERS)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                add(Manifest.permission.POST_NOTIFICATIONS)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                add(Manifest.permission.BLUETOOTH_CONNECT)
            }
        }.toTypedArray()

    private val requestPermissionsLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { _ ->
        checkPermissionsState()
        refreshHardwareUi()
    }

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

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initViews()
        setupNavigationDrawer()
        telemetryManager = HardwareTelemetryManager(this)

        telemetryManager?.onTelemetryUpdated = { snapshot ->
            runOnUiThread {
                renderTelemetry(snapshot)
            }
        }

        btnGrantPermissions.setOnClickListener {
            requestAllPermissionsFlow()
        }

        navBtnAppPermissions.setOnClickListener {
            drawerLayout.closeDrawer(GravityCompat.START)
            openAppSettings()
        }

        btnConnect.setOnClickListener {
            toggleConnection()
        }

        checkPermissionsState()
        refreshHardwareUi()
        fetchServerOverviewData()
    }

    private fun initViews() {
        drawerLayout = findViewById(R.id.drawerLayout)
        btnMenu = findViewById(R.id.btnMenu)
        tvAppTitle = findViewById(R.id.tvAppTitle)
        tvHeaderConnection = findViewById(R.id.tvHeaderConnection)

        layoutGatewayView = findViewById(R.id.layoutGatewayView)
        layoutAgentsView = findViewById(R.id.layoutAgentsView)
        layoutVoicesView = findViewById(R.id.layoutVoicesView)
        layoutDiagnosticsView = findViewById(R.id.layoutDiagnosticsView)

        navItemGateway = findViewById(R.id.navItemGateway)
        navItemAgents = findViewById(R.id.navItemAgents)
        navItemVoices = findViewById(R.id.navItemVoices)
        navItemDiagnostics = findViewById(R.id.navItemDiagnostics)
        navBtnAppPermissions = findViewById(R.id.navBtnAppPermissions)

        bannerPermissions = findViewById(R.id.bannerPermissions)
        tvPermissionBannerTitle = findViewById(R.id.tvPermissionBannerTitle)
        tvPermissionBannerDetail = findViewById(R.id.tvPermissionBannerDetail)
        btnGrantPermissions = findViewById(R.id.btnGrantPermissions)

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

        llAgentsContainer = findViewById(R.id.llAgentsContainer)
        llVoicesContainer = findViewById(R.id.llVoicesContainer)
        llDiagnosticsContainer = findViewById(R.id.llDiagnosticsContainer)

        val prefs = getSharedPreferences("nexus_companion_prefs", Context.MODE_PRIVATE)
        val savedServer = prefs.getString("server_url", "ws://192.168.1.34:8000/api/android-gateway/ws/bridge")
        tvServerIp.setText(savedServer)
    }

    private fun setupNavigationDrawer() {
        btnMenu.setOnClickListener {
            drawerLayout.openDrawer(GravityCompat.START)
        }

        navItemGateway.setOnClickListener {
            switchTab(0)
            drawerLayout.closeDrawer(GravityCompat.START)
        }

        navItemAgents.setOnClickListener {
            switchTab(1)
            drawerLayout.closeDrawer(GravityCompat.START)
            fetchServerOverviewData()
        }

        navItemVoices.setOnClickListener {
            switchTab(2)
            drawerLayout.closeDrawer(GravityCompat.START)
            fetchServerOverviewData()
        }

        navItemDiagnostics.setOnClickListener {
            switchTab(3)
            drawerLayout.closeDrawer(GravityCompat.START)
            renderDiagnosticsView()
        }
    }

    private fun switchTab(index: Int) {
        layoutGatewayView.visibility = if (index == 0) View.VISIBLE else View.GONE
        layoutAgentsView.visibility = if (index == 1) View.VISIBLE else View.GONE
        layoutVoicesView.visibility = if (index == 2) View.VISIBLE else View.GONE
        layoutDiagnosticsView.visibility = if (index == 3) View.VISIBLE else View.GONE

        navItemGateway.setBackgroundColor(ContextCompat.getColor(this, if (index == 0) R.color.surface_card_selected else android.R.color.transparent))
        navItemAgents.setBackgroundColor(ContextCompat.getColor(this, if (index == 1) R.color.surface_card_selected else android.R.color.transparent))
        navItemVoices.setBackgroundColor(ContextCompat.getColor(this, if (index == 2) R.color.surface_card_selected else android.R.color.transparent))
        navItemDiagnostics.setBackgroundColor(ContextCompat.getColor(this, if (index == 3) R.color.surface_card_selected else android.R.color.transparent))

        tvAppTitle.text = when (index) {
            0 -> "Nexus GSM Gateway"
            1 -> "AI Voice Agents"
            2 -> "Voice & Languages"
            3 -> "System Diagnostics"
            else -> "Nexus Call OS"
        }
    }

    private fun checkPermissionsState(): Boolean {
        val missing = requiredPermissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (missing.isEmpty()) {
            bannerPermissions.visibility = View.GONE
            return true
        } else {
            bannerPermissions.visibility = View.VISIBLE
            tvPermissionBannerTitle.text = "🛡️ ${missing.size} Permissions Needed"
            tvPermissionBannerDetail.text = "Microphone & Phone state are required for genuine GSM voice bridging."
            btnGrantPermissions.text = "Grant ${missing.size} System Permissions"
            return false
        }
    }

    private fun requestAllPermissionsFlow() {
        val missing = requiredPermissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (missing.isNotEmpty()) {
            requestPermissionsLauncher.launch(missing.toTypedArray())
            requestIgnoreBatteryOptimization()
        } else {
            Toast.makeText(this, "✓ All system permissions are already granted!", Toast.LENGTH_SHORT).show()
            bannerPermissions.visibility = View.GONE
        }
    }

    private fun openAppSettings() {
        try {
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.parse("package:$packageName")
            }
            startActivity(intent)
            Toast.makeText(this, "Please verify Microphone, Phone & Notifications permissions in Settings", Toast.LENGTH_LONG).show()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to open app settings", e)
        }
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

        val tvNumber = TextView(this).apply {
            text = "Number: ${sub.number ?: "Not available from Android/carrier"}"
            setTextColor(ContextCompat.getColor(context, R.color.text_secondary))
            textSize = 11f
            setPadding(0, 8, 0, 4)
        }
        layout.addView(tvNumber)

        val tvSignal = TextView(this).apply {
            text = "Network: ${sub.networkType} | Signal: ${sub.signalDbm} dBm (Level ${sub.signalLevel}/4)"
            setTextColor(ContextCompat.getColor(context, R.color.text_muted))
            textSize = 11f
        }
        layout.addView(tvSignal)

        return layout
    }

    private fun toggleConnection() {
        if (bridgeService?.isRunning == true) {
            val stopIntent = Intent(this, CallBridgeService::class.java).apply {
                action = CallBridgeService.ACTION_STOP
            }
            startService(stopIntent)
            handleConnectionStateChange(WebSocketBridgeClient.ConnectionState.DISCONNECTED, "Service stopped by user")
        } else {
            val hasMic = ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
            if (!hasMic) {
                requestAllPermissionsFlow()
                Toast.makeText(this, "Microphone permission is required to start audio gateway.", Toast.LENGTH_LONG).show()
                return
            }

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

            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(startIntent)
                } else {
                    startService(startIntent)
                }
                handleConnectionStateChange(WebSocketBridgeClient.ConnectionState.CONNECTING, "Connecting to $serverUrl...")
                Toast.makeText(this, "Starting Nexus Gateway Service...", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Log.e(TAG, "Error starting service", e)
                Toast.makeText(this, "Service start error: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun handleConnectionStateChange(state: WebSocketBridgeClient.ConnectionState, detail: String?) {
        when (state) {
            WebSocketBridgeClient.ConnectionState.CONNECTED -> {
                tvConnectionBadge.text = "🟢 ONLINE"
                tvConnectionBadge.setTextColor(ContextCompat.getColor(this, R.color.status_online))
                tvHeaderConnection.text = "🟢 ONLINE"
                tvHeaderConnection.setTextColor(ContextCompat.getColor(this, R.color.status_online))
                tvStatusDetail.text = detail ?: "Connected & Active (Duplex Audio Bridge Online)"
                btnConnect.text = "Disconnect Gateway"
                btnConnect.setBackgroundColor(ContextCompat.getColor(this, R.color.status_offline))
            }
            WebSocketBridgeClient.ConnectionState.CONNECTING -> {
                tvConnectionBadge.text = "🟡 CONNECTING"
                tvConnectionBadge.setTextColor(ContextCompat.getColor(this, R.color.status_warning))
                tvHeaderConnection.text = "🟡 CONNECTING"
                tvHeaderConnection.setTextColor(ContextCompat.getColor(this, R.color.status_warning))
                tvStatusDetail.text = detail ?: "Connecting to WebSocket bridge..."
            }
            WebSocketBridgeClient.ConnectionState.RECONNECTING -> {
                tvConnectionBadge.text = "🟡 RECONNECTING"
                tvConnectionBadge.setTextColor(ContextCompat.getColor(this, R.color.status_warning))
                tvHeaderConnection.text = "🟡 RECONNECTING"
                tvHeaderConnection.setTextColor(ContextCompat.getColor(this, R.color.status_warning))
                tvStatusDetail.text = detail ?: "Reconnecting..."
            }
            WebSocketBridgeClient.ConnectionState.DISCONNECTED -> {
                tvConnectionBadge.text = "🔴 OFFLINE"
                tvConnectionBadge.setTextColor(ContextCompat.getColor(this, R.color.status_offline))
                tvHeaderConnection.text = "🔴 OFFLINE"
                tvHeaderConnection.setTextColor(ContextCompat.getColor(this, R.color.status_offline))
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

    /**
     * Fetches dynamic AI Agents, Voices, and Telephony overview from the backend server.
     */
    private fun fetchServerOverviewData() {
        val serverUrl = tvServerIp.text.toString().trim()
        val httpBase = if (serverUrl.startsWith("wss://")) {
            serverUrl.replace("wss://", "https://").substringBefore("/api/")
        } else if (serverUrl.startsWith("ws://")) {
            serverUrl.replace("ws://", "http://").substringBefore("/api/")
        } else {
            "http://192.168.1.34:8000"
        }

        val requestUrl = "$httpBase/api/android-gateway/mobile-overview"

        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val request = Request.Builder().url(requestUrl).build()
                val response = httpClient.newCall(request).execute()
                if (response.isSuccessful) {
                    val body = response.body?.string()
                    if (!body.isNullOrBlank()) {
                        val json = JSONObject(body)
                        withContext(Dispatchers.Main) {
                            renderAgentsTab(json.optJSONArray("active_agents"))
                            renderVoicesTab(json.optJSONArray("voice_engines"), json.optJSONArray("supported_languages"))
                        }
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Could not fetch dynamic overview from backend: ${e.message}")
            }
        }
    }

    private fun renderAgentsTab(agents: JSONArray?) {
        llAgentsContainer.removeAllViews()
        if (agents == null || agents.length() == 0) {
            val tvEmpty = TextView(this).apply {
                text = "No active voice agents returned by server."
                setTextColor(ContextCompat.getColor(context, R.color.text_secondary))
                textSize = 12f
            }
            llAgentsContainer.addView(tvEmpty)
            return
        }

        for (i in 0 until agents.length()) {
            val agent = agents.getJSONObject(i)
            val card = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(32, 24, 32, 24)
                setBackgroundColor(ContextCompat.getColor(context, R.color.surface_card))
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    bottomMargin = 16
                }
            }

            val tvName = TextView(this).apply {
                text = "🤖 " + agent.optString("name")
                setTextColor(ContextCompat.getColor(context, R.color.text_primary))
                textSize = 14f
                setTypeface(null, android.graphics.Typeface.BOLD)
            }
            card.addView(tvName)

            val tvRole = TextView(this).apply {
                text = agent.optString("role")
                setTextColor(ContextCompat.getColor(context, R.color.text_secondary))
                textSize = 12f
                setPadding(0, 4, 0, 6)
            }
            card.addView(tvRole)

            val tvLang = TextView(this).apply {
                text = "🗣️ Languages: " + agent.optString("language")
                setTextColor(ContextCompat.getColor(context, R.color.primary))
                textSize = 11f
            }
            card.addView(tvLang)

            val tvEngine = TextView(this).apply {
                text = "⚡ Voice: " + agent.optString("voice_engine") + " | Model: " + agent.optString("llm_model")
                setTextColor(ContextCompat.getColor(context, R.color.text_muted))
                textSize = 10f
                setPadding(0, 4, 0, 0)
            }
            card.addView(tvEngine)

            llAgentsContainer.addView(card)
        }
    }

    private fun renderVoicesTab(voices: JSONArray?, languages: JSONArray?) {
        llVoicesContainer.removeAllViews()

        // 1. Voice Engines Header
        val tvEnginesTitle = TextView(this).apply {
            text = "Active Speech Engines"
            setTextColor(ContextCompat.getColor(context, R.color.primary))
            textSize = 13f
            setTypeface(null, android.graphics.Typeface.BOLD)
            setPadding(0, 0, 0, 8)
        }
        llVoicesContainer.addView(tvEnginesTitle)

        if (voices != null) {
            for (i in 0 until voices.length()) {
                val v = voices.getJSONObject(i)
                val card = LinearLayout(this).apply {
                    orientation = LinearLayout.VERTICAL
                    setPadding(28, 20, 28, 20)
                    setBackgroundColor(ContextCompat.getColor(context, R.color.surface_card))
                    layoutParams = LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.MATCH_PARENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT
                    ).apply {
                        bottomMargin = 12
                    }
                }

                val tvVName = TextView(this).apply {
                    text = "🎙️ " + v.optString("provider") + " - " + v.optString("name")
                    setTextColor(ContextCompat.getColor(context, R.color.text_primary))
                    textSize = 13f
                    setTypeface(null, android.graphics.Typeface.BOLD)
                }
                card.addView(tvVName)

                val tvVSpeed = TextView(this).apply {
                    text = "Speed / Profile: " + v.optString("speed")
                    setTextColor(ContextCompat.getColor(context, R.color.accent))
                    textSize = 11f
                    setPadding(0, 4, 0, 0)
                }
                card.addView(tvVSpeed)

                llVoicesContainer.addView(card)
            }
        }

        // 2. Languages Header
        val tvLangsTitle = TextView(this).apply {
            text = "Supported Multilingual Dialects"
            setTextColor(ContextCompat.getColor(context, R.color.primary))
            textSize = 13f
            setTypeface(null, android.graphics.Typeface.BOLD)
            setPadding(0, 16, 0, 8)
        }
        llVoicesContainer.addView(tvLangsTitle)

        if (languages != null) {
            for (i in 0 until languages.length()) {
                val l = languages.getJSONObject(i)
                val card = LinearLayout(this).apply {
                    orientation = LinearLayout.VERTICAL
                    setPadding(28, 16, 28, 16)
                    setBackgroundColor(ContextCompat.getColor(context, R.color.surface_card))
                    layoutParams = LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.MATCH_PARENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT
                    ).apply {
                        bottomMargin = 8
                    }
                }

                val tvLName = TextView(this).apply {
                    text = "🇮🇳 " + l.optString("name") + " (" + l.optString("accent") + ")"
                    setTextColor(ContextCompat.getColor(context, R.color.text_primary))
                    textSize = 12f
                    setTypeface(null, android.graphics.Typeface.BOLD)
                }
                card.addView(tvLName)

                val tvLStt = TextView(this).apply {
                    text = "STT Model: " + l.optString("stt")
                    setTextColor(ContextCompat.getColor(context, R.color.text_muted))
                    textSize = 10f
                    setPadding(0, 2, 0, 0)
                }
                card.addView(tvLStt)

                llVoicesContainer.addView(card)
            }
        }
    }

    private fun renderDiagnosticsView() {
        llDiagnosticsContainer.removeAllViews()
        val snap = telemetryManager?.getSnapshot()

        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 24, 32, 24)
            setBackgroundColor(ContextCompat.getColor(context, R.color.surface_card))
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }

        fun addRow(label: String, value: String) {
            val row = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    bottomMargin = 10
                }
            }
            val tvL = TextView(this).apply {
                text = label
                setTextColor(ContextCompat.getColor(context, R.color.text_secondary))
                textSize = 12f
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            }
            val tvV = TextView(this).apply {
                text = value
                setTextColor(ContextCompat.getColor(context, R.color.text_primary))
                textSize = 12f
                setTypeface(null, android.graphics.Typeface.BOLD)
            }
            row.addView(tvL)
            row.addView(tvV)
            card.addView(row)
        }

        addRow("Device Model", snap?.deviceModel ?: "Unknown")
        addRow("OS Version", snap?.androidVersion ?: "Unknown")
        addRow("Battery Level", "${snap?.batteryPercent ?: 0}% ${if (snap?.isCharging == true) "⚡" else ""}")
        addRow("Modem Signal", "${snap?.primarySignalDbm ?: 0} dBm (${snap?.primaryNetworkType})")
        addRow("WebSocket RTT", if (bridgeService?.measuredLatencyMs ?: -1 >= 0) "${bridgeService?.measuredLatencyMs} ms" else "—")
        addRow("Active Line Count", "${snap?.subscriptions?.size ?: 0} SIM(s)")
        addRow("Service Mode", if (bridgeService?.isRunning == true) "Foreground Bridge (Active)" else "Idle")

        llDiagnosticsContainer.addView(card)
    }
}
