package com.nexus.callos.companion

import android.Manifest
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.graphics.Typeface
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.os.PowerManager
import android.provider.Settings
import android.util.Log
import android.view.Gravity
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
        private const val PREFS_NAME = "nexus_companion_prefs"
        private const val DEFAULT_TUNNEL_URL = "wss://schema-premises-brian-recommendation.trycloudflare.com/api/android-gateway/ws/bridge"
        private const val DEFAULT_LAN_URL = "ws://192.168.1.34:8000/api/android-gateway/ws/bridge"
    }

    private lateinit var drawerLayout: DrawerLayout
    private lateinit var mainContentRoot: LinearLayout
    private lateinit var topAppBar: LinearLayout
    private lateinit var navDrawer: LinearLayout
    private lateinit var btnMenu: ImageButton
    private lateinit var btnThemeToggle: ImageButton
    private lateinit var tvAppTitle: TextView
    private lateinit var tvHeaderConnection: TextView

    // Navigation Tabs
    private lateinit var layoutGatewayView: LinearLayout
    private lateinit var layoutPermissionsView: LinearLayout
    private lateinit var layoutAgentsView: LinearLayout
    private lateinit var layoutVoicesView: LinearLayout
    private lateinit var layoutDiagnosticsView: LinearLayout

    // Nav Drawer Items
    private lateinit var navItemGateway: LinearLayout
    private lateinit var navItemPermissions: LinearLayout
    private lateinit var navItemAgents: LinearLayout
    private lateinit var navItemVoices: LinearLayout
    private lateinit var navItemDiagnostics: LinearLayout
    private lateinit var navBtnThemeToggle: LinearLayout
    private lateinit var tvNavThemeLabel: TextView

    // Gateway Tab Views
    private lateinit var bannerPermissions: LinearLayout
    private lateinit var tvPermissionBannerTitle: TextView
    private lateinit var tvPermissionBannerDetail: TextView
    private lateinit var btnViewPermissionsAudit: Button
    private lateinit var tvConnectionBadge: TextView
    private lateinit var tvStatusDetail: TextView
    private lateinit var tvLatency: TextView
    private lateinit var tvServerIp: EditText
    private lateinit var btnPresetTunnel: Button
    private lateinit var btnPresetLan: Button
    private lateinit var btnConnect: Button

    // Auto-Answer Controls (NEW)
    private lateinit var cardAutoAnswerSettings: LinearLayout
    private lateinit var switchAutoAnswer: Switch
    private lateinit var btnDelay0: Button
    private lateinit var btnDelay3: Button
    private lateinit var btnDelay5: Button
    private lateinit var btnDelay10: Button

    // Hardware & SIM Views
    private lateinit var cardConnection: LinearLayout
    private lateinit var cardDevice: LinearLayout
    private lateinit var cardSim: LinearLayout
    private lateinit var tvDeviceModel: TextView
    private lateinit var tvAndroidVersion: TextView
    private lateinit var tvBattery: TextView
    private lateinit var tvNetworkSignal: TextView
    private lateinit var tvSimCount: TextView
    private lateinit var llSimCardsContainer: LinearLayout
    private lateinit var tvNoSimMsg: TextView

    // Containers for Cards & Tabs
    private lateinit var llPermissionsListContainer: LinearLayout
    private lateinit var btnGrantAllPermissionsDetailed: Button
    private lateinit var btnOpenSettingsDirect: Button
    private lateinit var llAgentsContainer: LinearLayout
    private lateinit var llVoicesContainer: LinearLayout
    private lateinit var llDiagnosticsContainer: LinearLayout

    private var bridgeService: CallBridgeService? = null
    private var isBound = false
    private var telemetryManager: HardwareTelemetryManager? = null
    private var isDarkMode = false // Light Mode by DEFAULT

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(4, TimeUnit.SECONDS)
        .readTimeout(4, TimeUnit.SECONDS)
        .build()

    data class PermissionItem(
        val permissionKey: String,
        val title: String,
        val description: String,
        val icon: String,
        val isEssential: Boolean
    )

    private val allAuditPermissions = listOf(
        PermissionItem(
            Manifest.permission.RECORD_AUDIO,
            "Microphone Audio Streaming",
            "Duplex real-time audio bridge for voice calls",
            "🎙️",
            true
        ),
        PermissionItem(
            Manifest.permission.READ_PHONE_STATE,
            "Phone State & Dual SIMs",
            "Discover active SIM cards, carriers and signal strength",
            "📞",
            true
        ),
        PermissionItem(
            Manifest.permission.CALL_PHONE,
            "Make Direct Phone Calls",
            "Allows routing outbound voice calls via GSM",
            "☎️",
            true
        ),
        PermissionItem(
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) Manifest.permission.READ_PHONE_NUMBERS else Manifest.permission.READ_PHONE_STATE,
            "Read SIM Phone Numbers",
            "Detect phone numbers from SIM subscription manager",
            "🔢",
            false
        ),
        PermissionItem(
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) Manifest.permission.ANSWER_PHONE_CALLS else Manifest.permission.MODIFY_AUDIO_SETTINGS,
            "Answer Incoming GSM Calls",
            "Allows automatic call answering for telephony bridge",
            "📲",
            false
        ),
        PermissionItem(
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) Manifest.permission.POST_NOTIFICATIONS else Manifest.permission.ACCESS_NETWORK_STATE,
            "Foreground Status Notifications",
            "Persistent notification ensuring 24/7 background bridge",
            "🔔",
            true
        ),
        PermissionItem(
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) Manifest.permission.BLUETOOTH_CONNECT else Manifest.permission.ACCESS_NETWORK_STATE,
            "Bluetooth & Headset Audio",
            "Hands-free and headset audio streaming",
            "🎧",
            false
        )
    )

    private val requestPermissionsLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { _ ->
        refreshPermissionsAudit()
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

        loadThemeState()
        initViews()
        setupNavigationDrawer()
        applyTheme(isDarkMode)

        telemetryManager = HardwareTelemetryManager(this)
        telemetryManager?.onTelemetryUpdated = { snapshot ->
            runOnUiThread {
                renderTelemetry(snapshot)
            }
        }

        setupButtons()
        setupAutoAnswerControls()
        refreshPermissionsAudit()
        refreshHardwareUi()
        autoDiscoverServerEndpoints()
    }

    private fun loadThemeState() {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        isDarkMode = prefs.getBoolean("theme_is_dark", false) // Default Light Mode
    }

    private fun initViews() {
        drawerLayout = findViewById(R.id.drawerLayout)
        mainContentRoot = findViewById(R.id.mainContentRoot)
        topAppBar = findViewById(R.id.topAppBar)
        navDrawer = findViewById(R.id.navDrawer)
        btnMenu = findViewById(R.id.btnMenu)
        btnThemeToggle = findViewById(R.id.btnThemeToggle)
        tvAppTitle = findViewById(R.id.tvAppTitle)
        tvHeaderConnection = findViewById(R.id.tvHeaderConnection)

        layoutGatewayView = findViewById(R.id.layoutGatewayView)
        layoutPermissionsView = findViewById(R.id.layoutPermissionsView)
        layoutAgentsView = findViewById(R.id.layoutAgentsView)
        layoutVoicesView = findViewById(R.id.layoutVoicesView)
        layoutDiagnosticsView = findViewById(R.id.layoutDiagnosticsView)

        navItemGateway = findViewById(R.id.navItemGateway)
        navItemPermissions = findViewById(R.id.navItemPermissions)
        navItemAgents = findViewById(R.id.navItemAgents)
        navItemVoices = findViewById(R.id.navItemVoices)
        navItemDiagnostics = findViewById(R.id.navItemDiagnostics)
        navBtnThemeToggle = findViewById(R.id.navBtnThemeToggle)
        tvNavThemeLabel = findViewById(R.id.tvNavThemeLabel)

        bannerPermissions = findViewById(R.id.bannerPermissions)
        tvPermissionBannerTitle = findViewById(R.id.tvPermissionBannerTitle)
        tvPermissionBannerDetail = findViewById(R.id.tvPermissionBannerDetail)
        btnViewPermissionsAudit = findViewById(R.id.btnViewPermissionsAudit)

        cardConnection = findViewById(R.id.cardConnection)
        cardAutoAnswerSettings = findViewById(R.id.cardAutoAnswerSettings)
        cardDevice = findViewById(R.id.cardDevice)
        cardSim = findViewById(R.id.cardSim)

        tvConnectionBadge = findViewById(R.id.tvConnectionBadge)
        tvStatusDetail = findViewById(R.id.tvStatusDetail)
        tvLatency = findViewById(R.id.tvLatency)
        tvServerIp = findViewById(R.id.tvServerIp)
        btnPresetTunnel = findViewById(R.id.btnPresetTunnel)
        btnPresetLan = findViewById(R.id.btnPresetLan)
        btnConnect = findViewById(R.id.btnConnect)

        switchAutoAnswer = findViewById(R.id.switchAutoAnswer)
        btnDelay0 = findViewById(R.id.btnDelay0)
        btnDelay3 = findViewById(R.id.btnDelay3)
        btnDelay5 = findViewById(R.id.btnDelay5)
        btnDelay10 = findViewById(R.id.btnDelay10)

        tvDeviceModel = findViewById(R.id.tvDeviceModel)
        tvAndroidVersion = findViewById(R.id.tvAndroidVersion)
        tvBattery = findViewById(R.id.tvBattery)
        tvNetworkSignal = findViewById(R.id.tvNetworkSignal)

        tvSimCount = findViewById(R.id.tvSimCount)
        llSimCardsContainer = findViewById(R.id.llSimCardsContainer)
        tvNoSimMsg = findViewById(R.id.tvNoSimMsg)

        llPermissionsListContainer = findViewById(R.id.llPermissionsListContainer)
        btnGrantAllPermissionsDetailed = findViewById(R.id.btnGrantAllPermissionsDetailed)
        btnOpenSettingsDirect = findViewById(R.id.btnOpenSettingsDirect)

        llAgentsContainer = findViewById(R.id.llAgentsContainer)
        llVoicesContainer = findViewById(R.id.llVoicesContainer)
        llDiagnosticsContainer = findViewById(R.id.llDiagnosticsContainer)

        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val savedServer = prefs.getString("server_url", DEFAULT_TUNNEL_URL)
        tvServerIp.setText(savedServer)
    }

    private fun setupButtons() {
        btnPresetTunnel.setOnClickListener {
            tvServerIp.setText(DEFAULT_TUNNEL_URL)
            Toast.makeText(this, "Set to Secure Cloud Tunnel (WSS)", Toast.LENGTH_SHORT).show()
        }

        btnPresetLan.setOnClickListener {
            tvServerIp.setText(DEFAULT_LAN_URL)
            Toast.makeText(this, "Set to Local Wi-Fi LAN (WS)", Toast.LENGTH_SHORT).show()
        }

        btnViewPermissionsAudit.setOnClickListener {
            switchTab(1)
        }

        btnGrantAllPermissionsDetailed.setOnClickListener {
            requestAllPermissionsFlow()
        }

        btnOpenSettingsDirect.setOnClickListener {
            openAppSettings()
        }

        btnConnect.setOnClickListener {
            toggleConnection()
        }

        btnThemeToggle.setOnClickListener {
            toggleTheme()
        }

        navBtnThemeToggle.setOnClickListener {
            toggleTheme()
        }
    }

    private fun setupAutoAnswerControls() {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val isAutoAnswer = prefs.getBoolean("auto_answer_enabled", true)
        val currentDelay = prefs.getInt("auto_answer_delay_sec", 3)

        switchAutoAnswer.isChecked = isAutoAnswer
        updateDelayButtonsHighlight(currentDelay)

        switchAutoAnswer.setOnCheckedChangeListener { _, isChecked ->
            prefs.edit().putBoolean("auto_answer_enabled", isChecked).apply()
            val msg = if (isChecked) "Auto-answer ENABLED (Calls picked automatically)" else "Auto-answer DISABLED (Manual pick only)"
            Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
        }

        btnDelay0.setOnClickListener { setAutoAnswerDelay(0) }
        btnDelay3.setOnClickListener { setAutoAnswerDelay(3) }
        btnDelay5.setOnClickListener { setAutoAnswerDelay(5) }
        btnDelay10.setOnClickListener { setAutoAnswerDelay(10) }
    }

    private fun setAutoAnswerDelay(sec: Int) {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putInt("auto_answer_delay_sec", sec).apply()
        updateDelayButtonsHighlight(sec)
        val label = if (sec == 0) "Instant (0s)" else "${sec} seconds"
        Toast.makeText(this, "Auto-answer delay set to $label", Toast.LENGTH_SHORT).show()
    }

    private fun updateDelayButtonsHighlight(selectedSec: Int) {
        val primaryColor = ContextCompat.getColor(this, R.color.primary)
        val cardColor = ContextCompat.getColor(this, if (isDarkMode) R.color.surface_card else R.color.light_surface_card)
        val textPrimary = ContextCompat.getColor(this, if (isDarkMode) R.color.text_primary else R.color.light_text_primary)

        val btnMap = mapOf(0 to btnDelay0, 3 to btnDelay3, 5 to btnDelay5, 10 to btnDelay10)

        for ((sec, btn) in btnMap) {
            val isSelected = (sec == selectedSec)
            btn.setBackgroundColor(if (isSelected) primaryColor else cardColor)
            btn.setTextColor(if (isSelected) 0xFFFFFFFF.toInt() else textPrimary)
            btn.setTypeface(null, if (isSelected) Typeface.BOLD else Typeface.NORMAL)
        }
    }

    private fun setupNavigationDrawer() {
        btnMenu.setOnClickListener {
            drawerLayout.openDrawer(GravityCompat.START)
        }

        navItemGateway.setOnClickListener {
            switchTab(0)
            drawerLayout.closeDrawer(GravityCompat.START)
        }

        navItemPermissions.setOnClickListener {
            switchTab(1)
            drawerLayout.closeDrawer(GravityCompat.START)
        }

        navItemAgents.setOnClickListener {
            switchTab(2)
            drawerLayout.closeDrawer(GravityCompat.START)
            fetchServerOverviewData()
        }

        navItemVoices.setOnClickListener {
            switchTab(3)
            drawerLayout.closeDrawer(GravityCompat.START)
            fetchServerOverviewData()
        }

        navItemDiagnostics.setOnClickListener {
            switchTab(4)
            drawerLayout.closeDrawer(GravityCompat.START)
            renderDiagnosticsView()
        }
    }

    private fun switchTab(index: Int) {
        layoutGatewayView.visibility = if (index == 0) View.VISIBLE else View.GONE
        layoutPermissionsView.visibility = if (index == 1) View.VISIBLE else View.GONE
        layoutAgentsView.visibility = if (index == 2) View.VISIBLE else View.GONE
        layoutVoicesView.visibility = if (index == 3) View.VISIBLE else View.GONE
        layoutDiagnosticsView.visibility = if (index == 4) View.VISIBLE else View.GONE

        val activeBg = ContextCompat.getColor(this, if (isDarkMode) R.color.surface_card_selected else R.color.light_surface_selected)
        val clearBg = ContextCompat.getColor(this, android.R.color.transparent)

        navItemGateway.setBackgroundColor(if (index == 0) activeBg else clearBg)
        navItemPermissions.setBackgroundColor(if (index == 1) activeBg else clearBg)
        navItemAgents.setBackgroundColor(if (index == 2) activeBg else clearBg)
        navItemVoices.setBackgroundColor(if (index == 3) activeBg else clearBg)
        navItemDiagnostics.setBackgroundColor(if (index == 4) activeBg else clearBg)

        tvAppTitle.text = when (index) {
            0 -> "GSM SIM Gateway"
            1 -> "Permissions Audit"
            2 -> "AI Voice Agents"
            3 -> "Voice & Languages"
            4 -> "System Diagnostics"
            else -> "Nexus Call OS"
        }

        if (index == 1) refreshPermissionsAudit()
    }

    private fun toggleTheme() {
        isDarkMode = !isDarkMode
        getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit().putBoolean("theme_is_dark", isDarkMode).apply()
        applyTheme(isDarkMode)
        Toast.makeText(this, if (isDarkMode) "🌙 Switched to Dark Theme" else "☀️ Switched to Light Theme", Toast.LENGTH_SHORT).show()
    }

    private fun applyTheme(isDark: Boolean) {
        val bgColor = ContextCompat.getColor(this, if (isDark) R.color.background else R.color.light_background)
        val surfaceColor = ContextCompat.getColor(this, if (isDark) R.color.surface else R.color.light_surface)
        val cardColor = ContextCompat.getColor(this, if (isDark) R.color.surface_card else R.color.light_surface_card)
        val textPrimary = ContextCompat.getColor(this, if (isDark) R.color.text_primary else R.color.light_text_primary)
        val textSecondary = ContextCompat.getColor(this, if (isDark) R.color.text_secondary else R.color.light_text_secondary)

        mainContentRoot.setBackgroundColor(bgColor)
        topAppBar.setBackgroundColor(surfaceColor)
        navDrawer.setBackgroundColor(surfaceColor)
        tvAppTitle.setTextColor(textPrimary)
        btnMenu.setColorFilter(textPrimary)
        btnThemeToggle.setColorFilter(textSecondary)

        cardConnection.setBackgroundColor(surfaceColor)
        cardAutoAnswerSettings.setBackgroundColor(surfaceColor)
        cardDevice.setBackgroundColor(surfaceColor)
        cardSim.setBackgroundColor(surfaceColor)
        bannerPermissions.setBackgroundColor(surfaceColor)

        tvServerIp.setBackgroundColor(cardColor)
        tvServerIp.setTextColor(textPrimary)

        tvNavThemeLabel.text = if (isDark) "☀️ Switch to Light Mode" else "🌙 Switch to Dark Mode"
        tvNavThemeLabel.setTextColor(textPrimary)

        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        updateDelayButtonsHighlight(prefs.getInt("auto_answer_delay_sec", 3))

        refreshPermissionsAudit()
        refreshHardwareUi()
    }

    private fun refreshPermissionsAudit() {
        llPermissionsListContainer.removeAllViews()

        var grantedCount = 0
        val isDark = isDarkMode
        val cardBg = ContextCompat.getColor(this, if (isDark) R.color.surface_card else R.color.light_surface_card)
        val textPrimary = ContextCompat.getColor(this, if (isDark) R.color.text_primary else R.color.light_text_primary)
        val textSecondary = ContextCompat.getColor(this, if (isDark) R.color.text_secondary else R.color.light_text_secondary)

        for (item in allAuditPermissions) {
            val isGranted = ContextCompat.checkSelfPermission(this, item.permissionKey) == PackageManager.PERMISSION_GRANTED
            if (isGranted) grantedCount++

            val card = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                setPadding(28, 20, 28, 20)
                setBackgroundColor(cardBg)
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    bottomMargin = 10
                }
            }

            val tvIcon = TextView(this).apply {
                text = item.icon
                textSize = 20f
                setPadding(0, 0, 16, 0)
            }
            card.addView(tvIcon)

            val detailsLayout = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            }

            val tvName = TextView(this).apply {
                text = item.title
                setTextColor(textPrimary)
                textSize = 13f
                setTypeface(null, Typeface.BOLD)
            }
            detailsLayout.addView(tvName)

            val tvDesc = TextView(this).apply {
                text = item.description
                setTextColor(textSecondary)
                textSize = 10f
                setPadding(0, 2, 0, 0)
            }
            detailsLayout.addView(tvDesc)
            card.addView(detailsLayout)

            val tvStatus = TextView(this).apply {
                text = if (isGranted) "✓ GRANTED" else "✕ NEEDED"
                setTextColor(ContextCompat.getColor(context, if (isGranted) R.color.status_online else R.color.status_offline))
                textSize = 10f
                setTypeface(null, Typeface.BOLD)
                setPadding(12, 6, 12, 6)
            }
            card.addView(tvStatus)

            llPermissionsListContainer.addView(card)
        }

        val total = allAuditPermissions.size
        if (grantedCount == total) {
            tvPermissionBannerTitle.text = "✓ All Permissions Active ($grantedCount/$total)"
            tvPermissionBannerTitle.setTextColor(ContextCompat.getColor(this, R.color.status_online))
            tvPermissionBannerDetail.text = "Microphone & Telephony hardware bridges 100% operational."
            btnGrantAllPermissionsDetailed.text = "✓ All Permissions Granted"
            btnGrantAllPermissionsDetailed.setBackgroundColor(ContextCompat.getColor(this, if (isDark) R.color.surface_card else R.color.light_surface_card))
        } else {
            tvPermissionBannerTitle.text = "🛡️ ${total - grantedCount} Permissions Pending ($grantedCount/$total)"
            tvPermissionBannerTitle.setTextColor(ContextCompat.getColor(this, R.color.status_warning))
            tvPermissionBannerDetail.text = "Microphone or Telephony access missing. Tap to grant."
            btnGrantAllPermissionsDetailed.text = "Grant Missing Permissions (${total - grantedCount})"
            btnGrantAllPermissionsDetailed.setBackgroundColor(ContextCompat.getColor(this, R.color.primary))
        }
    }

    private fun requestAllPermissionsFlow() {
        val missing = allAuditPermissions.map { it.permissionKey }.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (missing.isNotEmpty()) {
            requestPermissionsLauncher.launch(missing.toTypedArray())
            requestIgnoreBatteryOptimization()
        } else {
            Toast.makeText(this, "✓ All system permissions are already granted!", Toast.LENGTH_SHORT).show()
        }
    }

    private fun openAppSettings() {
        try {
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.parse("package:$packageName")
            }
            startActivity(intent)
            Toast.makeText(this, "Please verify Microphone & Phone permissions in Settings", Toast.LENGTH_LONG).show()
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
        tvAndroidVersion.text = snap.androidVersion
        tvBattery.text = "${snap.batteryPercent}%${if (snap.isCharging) " ⚡ Charging" else ""}"
        tvNetworkSignal.text = "${snap.primaryNetworkType} (${snap.primarySignalDbm} dBm)"
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
        val isDark = isDarkMode
        val textPrimary = ContextCompat.getColor(this, if (isDark) R.color.text_primary else R.color.light_text_primary)
        val textSecondary = ContextCompat.getColor(this, if (isDark) R.color.text_secondary else R.color.light_text_secondary)
        val cardNormalBg = ContextCompat.getColor(this, if (isDark) R.color.surface_card else R.color.light_surface_card)
        val cardSelectedBg = ContextCompat.getColor(this, if (isDark) R.color.surface_card_selected else R.color.light_surface_selected)

        for (sub in subs) {
            val isSelected = (sub.subId == selectedSubId)

            val layout = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(32, 24, 32, 24)
                setBackgroundColor(if (isSelected) cardSelectedBg else cardNormalBg)
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    bottomMargin = 14
                }
            }

            val headerRow = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
            }

            val tvSlotName = TextView(this).apply {
                text = "SIM ${sub.slotIndex + 1}: ${sub.carrierName}"
                setTextColor(textPrimary)
                textSize = 13f
                setTypeface(null, Typeface.BOLD)
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            }
            headerRow.addView(tvSlotName)

            if (sub.isEsim) {
                val tvEsimBadge = TextView(this).apply {
                    text = "eSIM"
                    setTextColor(ContextCompat.getColor(context, R.color.accent))
                    textSize = 10f
                    setTypeface(null, Typeface.BOLD)
                    setPadding(12, 4, 12, 4)
                }
                headerRow.addView(tvEsimBadge)
            }

            val tvSelectedBadge = TextView(this).apply {
                text = if (isSelected) "● ACTIVE CALLING SIM" else "○ SELECT"
                setTextColor(ContextCompat.getColor(context, if (isSelected) R.color.primary else R.color.text_muted))
                textSize = 10f
                setTypeface(null, Typeface.BOLD)
                setPadding(12, 4, 12, 4)
            }
            headerRow.addView(tvSelectedBadge)
            layout.addView(headerRow)

            val tvNumber = TextView(this).apply {
                text = "Number: ${sub.number ?: "Not available from Android/carrier"}"
                setTextColor(textSecondary)
                textSize = 11f
                setPadding(0, 6, 0, 4)
            }
            layout.addView(tvNumber)

            val tvSignal = TextView(this).apply {
                text = "Network: ${sub.networkType} | Signal: ${sub.signalDbm} dBm (Level ${sub.signalLevel}/4)"
                setTextColor(ContextCompat.getColor(context, R.color.text_muted))
                textSize = 10f
            }
            layout.addView(tvSignal)

            layout.setOnClickListener {
                telemetryManager?.setSelectedSubscriptionId(sub.subId)
                Toast.makeText(this, "Calling SIM set to: ${sub.carrierName} (SIM ${sub.slotIndex + 1})", Toast.LENGTH_SHORT).show()
                refreshHardwareUi()
            }

            llSimCardsContainer.addView(layout)
        }
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
                DEFAULT_TUNNEL_URL
            }

            val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
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

    private fun autoDiscoverServerEndpoints() {
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val testUrls = listOf(
                    "https://schema-premises-brian-recommendation.trycloudflare.com/api/android-gateway/lan-info",
                    "http://192.168.1.34:8000/api/android-gateway/lan-info"
                )
                for (testUrl in testUrls) {
                    try {
                        val req = Request.Builder().url(testUrl).build()
                        val res = httpClient.newCall(req).execute()
                        if (res.isSuccessful) {
                            val body = res.body?.string()
                            if (!body.isNullOrBlank()) {
                                val json = JSONObject(body)
                                val pubUrl = json.optString("public_https_url")
                                if (pubUrl.isNotBlank() && pubUrl.startsWith("https://")) {
                                    val wssUrl = pubUrl.replace("https://", "wss://") + "/api/android-gateway/ws/bridge"
                                    withContext(Dispatchers.Main) {
                                        tvServerIp.setText(wssUrl)
                                        Log.d(TAG, "Auto-discovered active WSS endpoint: $wssUrl")
                                    }
                                    break
                                }
                            }
                        }
                    } catch (e: Exception) {
                        // ignore and try next
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Auto-discovery finished: ${e.message}")
            }
        }
    }

    private fun fetchServerOverviewData() {
        val serverUrl = tvServerIp.text.toString().trim()
        val httpBase = if (serverUrl.startsWith("wss://")) {
            serverUrl.replace("wss://", "https://").substringBefore("/api/")
        } else if (serverUrl.startsWith("ws://")) {
            serverUrl.replace("ws://", "http://").substringBefore("/api/")
        } else {
            "https://schema-premises-brian-recommendation.trycloudflare.com"
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
        val isDark = isDarkMode
        val cardBg = ContextCompat.getColor(this, if (isDark) R.color.surface_card else R.color.light_surface_card)
        val textPrimary = ContextCompat.getColor(this, if (isDark) R.color.text_primary else R.color.light_text_primary)
        val textSecondary = ContextCompat.getColor(this, if (isDark) R.color.text_secondary else R.color.light_text_secondary)

        if (agents == null || agents.length() == 0) {
            val tvEmpty = TextView(this).apply {
                text = "No active voice agents returned by server."
                setTextColor(textSecondary)
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
                setBackgroundColor(cardBg)
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    bottomMargin = 14
                }
            }

            val tvName = TextView(this).apply {
                text = "🤖 " + agent.optString("name")
                setTextColor(textPrimary)
                textSize = 14f
                setTypeface(null, Typeface.BOLD)
            }
            card.addView(tvName)

            val tvRole = TextView(this).apply {
                text = agent.optString("role")
                setTextColor(textSecondary)
                textSize = 11f
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
                text = "⚡ Voice: " + agent.optString("voice_engine") + " | LLM: " + agent.optString("llm_model")
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
        val isDark = isDarkMode
        val cardBg = ContextCompat.getColor(this, if (isDark) R.color.surface_card else R.color.light_surface_card)
        val textPrimary = ContextCompat.getColor(this, if (isDark) R.color.text_primary else R.color.light_text_primary)
        val textSecondary = ContextCompat.getColor(this, if (isDark) R.color.text_secondary else R.color.light_text_secondary)

        val tvEnginesTitle = TextView(this).apply {
            text = "Active Speech Engines"
            setTextColor(ContextCompat.getColor(context, R.color.primary))
            textSize = 13f
            setTypeface(null, Typeface.BOLD)
            setPadding(0, 0, 0, 8)
        }
        llVoicesContainer.addView(tvEnginesTitle)

        if (voices != null) {
            for (i in 0 until voices.length()) {
                val v = voices.getJSONObject(i)
                val card = LinearLayout(this).apply {
                    orientation = LinearLayout.VERTICAL
                    setPadding(28, 20, 28, 20)
                    setBackgroundColor(cardBg)
                    layoutParams = LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.MATCH_PARENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT
                    ).apply {
                        bottomMargin = 10
                    }
                }

                val tvVName = TextView(this).apply {
                    text = "🎙️ " + v.optString("provider") + " - " + v.optString("name")
                    setTextColor(textPrimary)
                    textSize = 13f
                    setTypeface(null, Typeface.BOLD)
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

        val tvLangsTitle = TextView(this).apply {
            text = "Supported Multilingual Dialects"
            setTextColor(ContextCompat.getColor(context, R.color.primary))
            textSize = 13f
            setTypeface(null, Typeface.BOLD)
            setPadding(0, 16, 0, 8)
        }
        llVoicesContainer.addView(tvLangsTitle)

        if (languages != null) {
            for (i in 0 until languages.length()) {
                val l = languages.getJSONObject(i)
                val card = LinearLayout(this).apply {
                    orientation = LinearLayout.VERTICAL
                    setPadding(28, 16, 28, 16)
                    setBackgroundColor(cardBg)
                    layoutParams = LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.MATCH_PARENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT
                    ).apply {
                        bottomMargin = 8
                    }
                }

                val tvLName = TextView(this).apply {
                    text = "🇮🇳 " + l.optString("name") + " (" + l.optString("accent") + ")"
                    setTextColor(textPrimary)
                    textSize = 12f
                    setTypeface(null, Typeface.BOLD)
                }
                card.addView(tvLName)

                val tvLStt = TextView(this).apply {
                    text = "STT Model: " + l.optString("stt")
                    setTextColor(textSecondary)
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
        val isDark = isDarkMode
        val cardBg = ContextCompat.getColor(this, if (isDark) R.color.surface_card else R.color.light_surface_card)
        val textPrimary = ContextCompat.getColor(this, if (isDark) R.color.text_primary else R.color.light_text_primary)
        val textSecondary = ContextCompat.getColor(this, if (isDark) R.color.text_secondary else R.color.light_text_secondary)

        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 24, 32, 24)
            setBackgroundColor(cardBg)
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
                setTextColor(textSecondary)
                textSize = 12f
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            }
            val tvV = TextView(this).apply {
                text = value
                setTextColor(textPrimary)
                textSize = 12f
                setTypeface(null, Typeface.BOLD)
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
