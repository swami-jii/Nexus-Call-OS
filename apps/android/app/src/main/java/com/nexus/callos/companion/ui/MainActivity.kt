package com.nexus.callos.companion.ui

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.app.AlertDialog
import android.app.role.RoleManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.graphics.BitmapFactory
import android.graphics.Typeface
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.provider.ContactsContract
import android.provider.Settings
import android.telecom.CallAudioState
import android.telecom.TelecomManager
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.SwitchCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.nexus.callos.companion.NexusApplication
import com.nexus.callos.companion.R
import com.nexus.callos.companion.model.AiAgentInfo
import com.nexus.callos.companion.model.BackendOverview
import com.nexus.callos.companion.model.CallLogRecord
import com.nexus.callos.companion.model.CallLogType
import com.nexus.callos.companion.model.CallRecordingRecord
import com.nexus.callos.companion.model.CallSession
import com.nexus.callos.companion.model.CallState
import com.nexus.callos.companion.model.ContactRecord
import com.nexus.callos.companion.model.DeviceTelemetry
import com.nexus.callos.companion.model.GatewaySession
import com.nexus.callos.companion.model.NumberSuggestion
import com.nexus.callos.companion.model.RecycleBinItem
import com.nexus.callos.companion.model.SimSubscriptionInfo
import android.view.WindowManager
import com.nexus.callos.companion.model.SuggestionSource
import com.nexus.callos.companion.network.BackendApiClient
import com.nexus.callos.companion.service.CallBridgeForegroundService
import com.nexus.callos.companion.telephony.AutoAnswerExecutor
import com.nexus.callos.companion.telephony.CallLogManager
import com.nexus.callos.companion.telephony.CallScreeningServiceImpl
import com.nexus.callos.companion.telephony.CompanionInCallService
import com.nexus.callos.companion.telephony.ContactsManager
import com.nexus.callos.companion.telephony.HardwareTelemetryManager
import com.nexus.callos.companion.telephony.IncomingCallNotifier
import com.nexus.callos.companion.telephony.IncomingCallReceiver
import com.nexus.callos.companion.telephony.RecordingManager
import com.nexus.callos.companion.telephony.RecycleBinManager
import android.graphics.Bitmap
import android.util.LruCache
import com.nexus.callos.companion.telephony.SimSubscriptionManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.util.Locale
import kotlin.math.sin

class MainActivity : AppCompatActivity() {

    companion object {
        private const val PREFS_DEVICE = "nexus_device_prefs"
        private const val PREFS_TELEPHONY = "nexus_telephony_prefs"
        private const val PREFS_SESSIONS = "nexus_session_history"
        private const val DEFAULT_CLOUD_URL = "wss://symbols-craft-dsl-stuff.trycloudflare.com/api/android-gateway/ws/bridge"
        private const val DEFAULT_LOCAL_URL = "ws://192.168.1.33:8000/api/android-gateway/ws/bridge"
    }

    private val avatarCache = LruCache<String, Bitmap>(100)
    private var suggestionsJob: Job? = null
    private var recentsJob: Job? = null
    private var contactsJob: Job? = null
    private var callLogsJob: Job? = null

    private fun loadAvatarAsync(
        photoUri: String?,
        imageView: ImageView,
        fallbackRes: Int = R.drawable.ic_person,
        fallbackColor: Int = R.color.primary
    ) {
        if (photoUri.isNullOrBlank()) {
            imageView.setImageResource(fallbackRes)
            imageView.setColorFilter(ContextCompat.getColor(this, fallbackColor))
            return
        }

        val cached = avatarCache.get(photoUri)
        if (cached != null) {
            imageView.clearColorFilter()
            imageView.setImageBitmap(cached)
            return
        }

        imageView.setImageResource(fallbackRes)
        imageView.setColorFilter(ContextCompat.getColor(this, fallbackColor))
        imageView.tag = photoUri

        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val uri = Uri.parse(photoUri)
                val options = BitmapFactory.Options().apply {
                    inSampleSize = 2
                }
                contentResolver.openInputStream(uri)?.use { stream ->
                    val bmp = BitmapFactory.decodeStream(stream, null, options)
                    if (bmp != null) {
                        avatarCache.put(photoUri, bmp)
                        withContext(Dispatchers.Main) {
                            if (imageView.tag == photoUri) {
                                imageView.clearColorFilter()
                                imageView.setImageBitmap(bmp)
                            }
                        }
                    }
                }
            } catch (_: Exception) {
                // Keep fallback
            }
        }
    }

    enum class Screen {
        DASHBOARD,
        SIMS,
        CALLS,
        AGENT,
        SETTINGS,
        DEVICE_DETAILS,
        TELEMETRY,
        CALL_LOGS,
        ADVANCED_SETTINGS,
        AUDIO_VOICE,
        GATEWAY_LOGS,
        VOICE_TEST,
        ABOUT
    }

    private var currentScreen = Screen.DASHBOARD
    private val screenBackStack = mutableListOf<Screen>()

    // Hardware, Telephony & Contacts Managers
    private lateinit var telemetryManager: HardwareTelemetryManager
    private lateinit var simManager: SimSubscriptionManager
    private lateinit var callLogManager: CallLogManager
    private lateinit var contactsManager: ContactsManager
    private lateinit var recordingManager: RecordingManager
    private lateinit var recycleBinManager: RecycleBinManager
    private val backendApiClient = BackendApiClient()
    private val mainHandler = Handler(Looper.getMainLooper())

    private var currentOverview: BackendOverview? = null
    private var selectedAgent: AiAgentInfo? = null

    // Foreground service connection
    private var bridgeService: CallBridgeForegroundService? = null
    private var isServiceBound = false

    // State Variables
    private var toneGenerator: android.media.ToneGenerator? = null
    private var isMuted = false
    private var isSpeakerOn = false
    private var isAudioTesting = false
    private var currentCallState = CallState.IDLE
    private var callStartTimestamp = 0L
    private var activeLogFilter: CallLogType? = null
    private var callLogSearchQuery = ""
    private var recentsSearchQuery = ""
    private var contactsSearchQuery = ""
    private var dialedNumber = ""
    private var inCallDtmfDigits = ""
    private var selectedSimTab = 0 // 0 = SIM Cards, 1 = eSIM Profiles, 2 = Preference
    private var selectedCallsTab = 0 // 0 = Keypad, 1 = Recents, 2 = Contacts, 3 = Gateway Settings

    private fun initToneGenerator() {
        try {
            toneGenerator = android.media.ToneGenerator(android.media.AudioManager.STREAM_MUSIC, 70)
        } catch (_: Exception) {}
    }

    private fun playToneFeedback(digit: Char) {
        val toneType = when (digit) {
            '1' -> android.media.ToneGenerator.TONE_DTMF_1
            '2' -> android.media.ToneGenerator.TONE_DTMF_2
            '3' -> android.media.ToneGenerator.TONE_DTMF_3
            '4' -> android.media.ToneGenerator.TONE_DTMF_4
            '5' -> android.media.ToneGenerator.TONE_DTMF_5
            '6' -> android.media.ToneGenerator.TONE_DTMF_6
            '7' -> android.media.ToneGenerator.TONE_DTMF_7
            '8' -> android.media.ToneGenerator.TONE_DTMF_8
            '9' -> android.media.ToneGenerator.TONE_DTMF_9
            '0' -> android.media.ToneGenerator.TONE_DTMF_0
            '*' -> android.media.ToneGenerator.TONE_DTMF_S
            '#' -> android.media.ToneGenerator.TONE_DTMF_P
            else -> android.media.ToneGenerator.TONE_PROP_BEEP
        }
        try {
            toneGenerator?.startTone(toneType, 120)
        } catch (_: Exception) {}
    }

    // Gateway Session Tracking (Connected State Only)
    private var sessionStartTimeMs = 0L
    private val sessionHistory = mutableListOf<GatewaySession>()

    // UI - Top Bar
    private lateinit var btnHeaderBack: ImageView
    private lateinit var imgAppLogo: ImageView
    private lateinit var tvHeaderTitle: TextView
    private lateinit var tvHeaderSubtitle: TextView
    private lateinit var tvHeaderStatusBadge: TextView
    private var mainScrollView: android.widget.ScrollView? = null

    // UI - 13 Screen Containers
    private lateinit var screenDashboard: LinearLayout
    private lateinit var screenSims: LinearLayout
    private lateinit var screenCalls: LinearLayout
    private lateinit var screenAgent: LinearLayout
    private lateinit var screenSettings: LinearLayout
    private lateinit var screenDeviceDetails: LinearLayout
    private lateinit var screenTelemetry: LinearLayout
    private lateinit var screenCallLogs: LinearLayout
    private lateinit var screenAdvancedSettings: LinearLayout
    private lateinit var screenAudioVoice: LinearLayout
    private lateinit var screenGatewayLogs: LinearLayout
    private lateinit var screenVoiceTest: LinearLayout
    private lateinit var screenAbout: LinearLayout

    // UI - Bottom Navigation
    private lateinit var bottomNavBar: LinearLayout
    private lateinit var navBtnDashboard: Button
    private lateinit var navBtnCalls: Button
    private lateinit var navBtnSims: Button
    private lateinit var navBtnAgent: Button
    private lateinit var navBtnSettings: Button

    // UI - Screen 1: Dashboard
    private lateinit var tvDashStatus: TextView
    private lateinit var tvDashStatusSub: TextView
    private lateinit var tvDashUptime: TextView
    private lateinit var cardDashDeviceOverview: LinearLayout
    private lateinit var tvDashDeviceModel: TextView
    private lateinit var tvDashAndroidVersion: TextView
    private lateinit var tvDashDeviceId: TextView
    private lateinit var gridDashMetrics: LinearLayout
    private lateinit var tvDashBattery: TextView
    private lateinit var tvDashCharging: TextView
    private lateinit var tvDashSignalDbm: TextView
    private lateinit var tvDashCarrier: TextView
    private lateinit var tvDashNetworkType: TextView
    private lateinit var tvDashLatency: TextView
    private lateinit var btnDashConnect: Button

    // UI - Screen 2: SIMs
    private lateinit var tabSimCards: Button
    private lateinit var tabEsimProfiles: Button
    private lateinit var tabSimPreference: Button
    private lateinit var tvSimCountBadge: TextView
    private lateinit var containerSimCards: LinearLayout
    private lateinit var tvNoSimMsg: TextView
    private lateinit var btnSetDefaultSim: Button

    // UI - Screen 3: Calls Sub-Tabs & Views
    private lateinit var layoutCallsSubTabs: LinearLayout
    private lateinit var tabCallsKeypad: Button
    private lateinit var tabCallsRecents: Button
    private lateinit var tabCallsContacts: Button
    private lateinit var tabCallsSettings: Button
    private lateinit var containerCallsKeypadView: LinearLayout
    private lateinit var containerCallsRecentsView: LinearLayout
    private lateinit var containerCallsContactsView: LinearLayout
    private lateinit var containerCallsSettingsView: LinearLayout

    // In-Call Active Station Card
    private lateinit var cardActiveCall: LinearLayout
    private lateinit var tvActiveCallTitle: TextView
    private lateinit var tvCallStatePill: TextView
    private lateinit var ivInCallAvatar: ImageView
    private lateinit var tvCallNumber: TextView
    private lateinit var tvCallLineDetails: TextView
    private lateinit var tvCallDuration: TextView
    private lateinit var layoutIncomingCallActions: LinearLayout
    private lateinit var btnCallReject: Button
    private lateinit var btnCallAnswer: Button
    private lateinit var layoutActiveCallControls: LinearLayout
    private lateinit var btnCallMute: ImageButton
    private lateinit var btnCallKeypad: ImageButton
    private lateinit var btnCallSpeaker: ImageButton
    private lateinit var btnCallPause: ImageButton
    private lateinit var btnCallHangup: ImageButton

    // Sub-View 1: Keypad / Dialer
    private lateinit var layoutSuggestionsWrapper: android.widget.FrameLayout
    private lateinit var containerNumberSuggestions: LinearLayout
    private var tvSuggestionsPlaceholder: TextView? = null
    private lateinit var tvDialedNumber: TextView
    private lateinit var btnDialerBackspace: ImageView
    private lateinit var btnDialer1: LinearLayout
    private lateinit var btnDialer2: LinearLayout
    private lateinit var btnDialer3: LinearLayout
    private lateinit var btnDialer4: LinearLayout
    private lateinit var btnDialer5: LinearLayout
    private lateinit var btnDialer6: LinearLayout
    private lateinit var btnDialer7: LinearLayout
    private lateinit var btnDialer8: LinearLayout
    private lateinit var btnDialer9: LinearLayout
    private lateinit var btnDialer0: LinearLayout
    private lateinit var btnDialerStar: LinearLayout
    private lateinit var btnDialerPound: LinearLayout
    private lateinit var btnDialerCall: Button

    // Sub-View 2: Recents
    private lateinit var etRecentsSearch: EditText
    private lateinit var btnClearRecentsSearch: ImageView
    private lateinit var tabRecentsAll: TextView
    private lateinit var tabRecentsMissed: TextView
    private lateinit var tabRecentsIncoming: TextView
    private lateinit var tabRecentsOutgoing: TextView
    private lateinit var containerRecentsList: LinearLayout
    private lateinit var tvNoRecentsMsg: TextView

    // Sub-View 3: Contacts
    private lateinit var etContactsSearch: EditText
    private lateinit var btnClearContactsSearch: ImageView
    private lateinit var tvContactsCountBadge: TextView
    private lateinit var btnAddNewContact: TextView
    private lateinit var containerContactsList: LinearLayout
    private lateinit var tvNoContactsMsg: TextView

    // Sub-View 4: Gateway Settings
    private lateinit var switchAutoAnswer: SwitchCompat
    private lateinit var btnDelay0: TextView
    private lateinit var btnDelay3: TextView
    private lateinit var btnDelay5: TextView
    private lateinit var btnDelay10: TextView
    private lateinit var tvRingTimeout: TextView
    private lateinit var switchAutoRejectUnknown: SwitchCompat
    private lateinit var rowAutoSpeaker: LinearLayout
    private lateinit var tvAutoSpeakerVal: TextView
    private lateinit var rowAutoMute: LinearLayout
    private lateinit var tvAutoMuteVal: TextView
    private lateinit var rowVibration: LinearLayout
    private lateinit var tvVibrationVal: TextView
    private lateinit var rowRecording: LinearLayout
    private lateinit var tvRecordingVal: TextView
    private lateinit var rowDtmf: LinearLayout
    private lateinit var tvDtmfVal: TextView
    private lateinit var rowRingtoneSelect: LinearLayout
    private lateinit var tvRingtoneVal: TextView
    private var isMasterGrantAllRunning = false

    // UI - Screen 4: AI Agent
    private lateinit var tvAgentName: TextView
    private lateinit var tvAgentRole: TextView
    private lateinit var tvAgentConversations: TextView
    private lateinit var tvAgentSuccessRate: TextView
    private lateinit var tvAgentAvgDuration: TextView
    private lateinit var tvAgentVoiceEngine: TextView
    private lateinit var tvAgentLanguage: TextView
    private lateinit var tvAgentSpeechSpeed: TextView
    private lateinit var tvAgentSpeechStyle: TextView
    private lateinit var tvAgentProvider: TextView
    private lateinit var tvAgentLlm: TextView
    private lateinit var tvAgentTemperature: TextView
    private lateinit var btnNavVoiceTest: Button
    private lateinit var containerAgentsList: LinearLayout
    private lateinit var containerAgentRecordingsList: LinearLayout
    private lateinit var tvAgentRecordingsBadge: TextView
    private lateinit var tvNoAgentRecordingsMsg: TextView

    // UI - Screen 5: Settings
    private lateinit var etServerUrl: EditText
    private lateinit var btnPresetCloud: Button
    private lateinit var btnPresetLocal: Button
    private lateinit var tvPermissionsCount: TextView
    private lateinit var btnGrantAllPermissions: Button
    private lateinit var rowTogglePermissionDetails: LinearLayout
    private lateinit var tvPermissionDetailsToggleLabel: TextView
    private lateinit var ivPermissionToggleChevron: ImageView
    private lateinit var containerPermissionDetails: LinearLayout
    private var isPermissionDetailsExpanded = true
    private lateinit var btnSetDefaultPhoneApp: Button
    private lateinit var btnBatteryOptimization: Button
    private lateinit var btnRevokeGuidance: Button
    private lateinit var rowNavDeviceDetails: LinearLayout
    private lateinit var rowNavTelemetry: LinearLayout
    private lateinit var rowNavCallLogs: LinearLayout
    private lateinit var rowNavAdvancedSettings: LinearLayout
    private lateinit var rowNavAudioVoice: LinearLayout
    private lateinit var rowNavGatewayLogs: LinearLayout
    private lateinit var rowNavCallRecording: LinearLayout
    private lateinit var tvRecordingCountBadge: TextView
    private lateinit var rowNavRecycleBin: LinearLayout
    private lateinit var tvRecycleBinCount: TextView
    private lateinit var btnClearAllCallData: Button
    private lateinit var rowNavAbout: LinearLayout

    // UI - Screen 6: Device Details
    private lateinit var containerDeviceDetailsRows: LinearLayout

    // UI - Screen 7: Real-Time Telemetry
    private lateinit var tvTelemetryBatteryVal: TextView
    private lateinit var tvBatteryHistoryGraph: TextView
    private lateinit var tvTelemetrySignalVal: TextView
    private lateinit var tvSignalHistoryGraph: TextView
    private lateinit var tvTelemetryUpload: TextView
    private lateinit var tvTelemetryDownload: TextView
    private lateinit var tvTelemetryLatency: TextView

    // UI - Screen 8: Call Logs
    private lateinit var etCallLogSearch: EditText
    private lateinit var btnClearCallLogSearch: ImageView
    private lateinit var tabLogAll: TextView
    private lateinit var tabLogMissed: TextView
    private lateinit var tabLogIncoming: TextView
    private lateinit var tabLogOutgoing: TextView
    private lateinit var containerCallLogs: LinearLayout
    private lateinit var tvNoLogsMsg: TextView

    // UI - Screen 9: Advanced Settings
    private lateinit var containerAdvancedRows: LinearLayout
    private lateinit var btnResetGateway: Button

    // UI - Screen 10: Audio & Voice
    private lateinit var tvAudioOutputDevice: TextView
    private lateinit var btnTestAudioAudioVoice: Button

    // UI - Screen 11: Gateway Logs
    private lateinit var tvTerminalLogs: TextView
    private lateinit var btnClearLogs: Button
    private lateinit var btnExportLogs: Button

    // UI - Screen 12: AI Voice Test
    private lateinit var tvVoiceTestSelectedVoice: TextView
    private lateinit var btnPlayVoice: Button

    // UI - Screen 13: About
    private lateinit var rowAboutUpdates: LinearLayout
    private lateinit var rowAboutGuide: LinearLayout
    private lateinit var rowAboutPrivacy: LinearLayout
    private lateinit var rowAboutLicenses: LinearLayout

    // Ticker runnable for session uptime and active call duration
    private val tickerRunnable = object : Runnable {
        override fun run() {
            updateTickers()
            mainHandler.postDelayed(this, 1000L)
        }
    }

    // Permission & Role Request Launchers
    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) {
        auditPermissions()
        refreshAllData()
        renderCallLogs()
        renderRecents()
        renderContacts()
        if (isMasterGrantAllRunning) {
            if (!isDialerRoleGranted()) {
                mainHandler.postDelayed({ promptDefaultDialerRole() }, 350L)
            } else if (!isBatteryOptimizationExempt()) {
                mainHandler.postDelayed({ requestIgnoreBatteryOptimization() }, 350L)
            } else {
                isMasterGrantAllRunning = false
            }
        }
    }

    private val singlePermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) {
        auditPermissions()
        refreshAllData()
        renderCallLogs()
        renderRecents()
        renderContacts()
    }

    private val dialerRoleLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) {
        auditPermissions()
        refreshAllData()
        if (isMasterGrantAllRunning) {
            if (!isBatteryOptimizationExempt()) {
                mainHandler.postDelayed({ requestIgnoreBatteryOptimization() }, 350L)
            }
            isMasterGrantAllRunning = false
        }
    }

    private val screeningRoleLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) {
        auditPermissions()
        refreshAllData()
    }

    private val ringtonePickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val uri: Uri? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                result.data?.getParcelableExtra(RingtoneManager.EXTRA_RINGTONE_PICKED_URI, Uri::class.java)
            } else {
                @Suppress("DEPRECATION")
                result.data?.getParcelableExtra(RingtoneManager.EXTRA_RINGTONE_PICKED_URI)
            }
            if (uri != null) {
                val ringtone = RingtoneManager.getRingtone(this, uri)
                val title = ringtone.getTitle(this) ?: "Custom Ringtone"
                val prefs = getSharedPreferences(PREFS_TELEPHONY, Context.MODE_PRIVATE).edit()
                prefs.putString("incoming_ringtone_uri", uri.toString())
                prefs.putString("incoming_ringtone_name", title)
                prefs.apply()
                tvRingtoneVal.text = "$title ›"
                Toast.makeText(this, "Incoming Ringtone set to: $title", Toast.LENGTH_SHORT).show()
            }
        }
    }

    // Service Connection
    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            val binder = service as? CallBridgeForegroundService.LocalBinder
            bridgeService = binder?.getService()
            isServiceBound = true
            setupServiceListeners()
            updateConnectionUi(CallBridgeForegroundService.connectionState)
            NexusApplication.log("INFO", "MainActivity", "Bound to CallBridgeForegroundService.")
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            bridgeService = null
            isServiceBound = false
            updateConnectionUi(CallBridgeForegroundService.ConnectionState.DISCONNECTED)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

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

        telemetryManager = HardwareTelemetryManager(this)
        simManager = SimSubscriptionManager(this)
        callLogManager = CallLogManager(this)
        contactsManager = ContactsManager(this)
        recordingManager = RecordingManager(this)
        recycleBinManager = RecycleBinManager(this)

        loadPersistedSessionHistory()
        initToneGenerator()
        initViews()
        setupBottomNav()
        setupScreenNavigation()
        setupListeners()
        bindInitialHardwareData()
        auditPermissions()
        handleDeepLink(intent)
        loadBackendAgents()
        fetchNetworkLanInfo()
        startTicker()
        setupBackPressHandler()

        CallBridgeForegroundService.onConnectionStateChanged = { state, reason ->
            runOnUiThread {
                handleConnectionStateTransition(state, reason)
                updateConnectionUi(state)
            }
        }

        CallBridgeForegroundService.onConfigUpdated = {
            runOnUiThread {
                NexusApplication.log("INFO", "MainActivity", "WebSocket received AGENT_CONFIG_UPDATED. Refreshing live AI configuration from SSOT...")
                loadBackendAgents()
            }
        }

        bindService(Intent(this, CallBridgeForegroundService::class.java), serviceConnection, Context.BIND_AUTO_CREATE)
    }

    private fun fetchNetworkLanInfo() {
        lifecycleScope.launch(Dispatchers.IO) {
            val devPrefs = getSharedPreferences(PREFS_DEVICE, Context.MODE_PRIVATE)
            val currentSaved = devPrefs.getString("server_url", null)
            val candidates = mutableListOf<String>()
            if (!currentSaved.isNullOrBlank()) {
                candidates.add(backendApiClient.getCleanBaseUrl(currentSaved) + "/api/android-gateway/lan-info")
            }
            candidates.add("http://192.168.1.33:8000/api/android-gateway/lan-info")
            candidates.add("http://192.168.1.33:3000/api/android-gateway/lan-info")
            candidates.add("https://symbols-craft-dsl-stuff.trycloudflare.com/api/android-gateway/lan-info")
            candidates.add("http://10.0.2.2:8000/api/android-gateway/lan-info")
            candidates.add("http://127.0.0.1:8000/api/android-gateway/lan-info")

            val client = okhttp3.OkHttpClient.Builder()
                .connectTimeout(3, java.util.concurrent.TimeUnit.SECONDS)
                .readTimeout(3, java.util.concurrent.TimeUnit.SECONDS)
                .build()

            for (endpoint in candidates) {
                try {
                    val request = okhttp3.Request.Builder().url(endpoint).get().build()
                    val response = client.newCall(request).execute()
                    if (response.isSuccessful) {
                        val body = response.body?.string() ?: continue
                        val json = JSONObject(body)
                        val cloudWs = json.optString("backend_ws_url")
                        val lanIp = json.optString("lan_ip")
                        val localWs = if (lanIp.isNotBlank()) "ws://$lanIp:8000/api/android-gateway/ws/bridge" else "ws://192.168.1.33:8000/api/android-gateway/ws/bridge"

                        val prefs = getSharedPreferences(PREFS_DEVICE, Context.MODE_PRIVATE).edit()
                        if (cloudWs.isNotBlank()) prefs.putString("cloud_tunnel_ws_url", cloudWs)
                        if (lanIp.isNotBlank()) {
                            prefs.putString("lan_ip", lanIp)
                            prefs.putString("local_lan_ws_url", localWs)
                        }
                        prefs.apply()
                        NexusApplication.log("INFO", "Network", "Synced dynamic SSOT tunnel URL: $cloudWs | LAN: $localWs")

                        withContext(Dispatchers.Main) {
                            val curUrl = etServerUrl.text.toString().trim()
                            val isStale = curUrl.isBlank() || curUrl.contains("possession-tagged") || curUrl.contains("electoral-have")
                            if (isStale) {
                                val target = if (cloudWs.isNotBlank()) cloudWs else localWs
                                etServerUrl.setText(target)
                                saveServerUrl(target)
                            }
                            val isCloud = etServerUrl.text.toString().contains(".trycloudflare.com") || etServerUrl.text.toString().startsWith("wss://")
                            updatePresetButtonsHighlight(isCloud)
                            loadBackendAgents()
                        }
                        break
                    }
                } catch (_: Exception) {}
            }
        }
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.let { handleDeepLink(it) }
    }

    override fun onResume() {
        super.onResume()
        updateConnectionUi(CallBridgeForegroundService.connectionState)
        auditPermissions()
        refreshAllData()
        when (currentScreen) {
            Screen.AGENT -> loadBackendAgents()
            Screen.GATEWAY_LOGS -> updateLogsView()
            Screen.CALL_LOGS -> renderCallLogs()
            Screen.CALLS -> {
                if (selectedCallsTab == 1) renderRecents()
                else if (selectedCallsTab == 2) renderContacts()
            }
            else -> {}
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        stopTicker()
        try {
            toneGenerator?.release()
            toneGenerator = null
        } catch (_: Exception) {}
        CallBridgeForegroundService.onConnectionStateChanged = null
        CallBridgeForegroundService.onConfigUpdated = null
        if (isServiceBound) {
            unbindService(serviceConnection)
            isServiceBound = false
        }
        NexusApplication.setLogListener(null)
    }

    private fun setupBackPressHandler() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (currentCallState != CallState.IDLE && containerCallsKeypadView.visibility == View.VISIBLE) {
                    containerCallsKeypadView.visibility = View.GONE
                    ivInCallAvatar.visibility = View.VISIBLE
                    tvCallLineDetails.visibility = View.VISIBLE
                    btnCallKeypad.setBackgroundResource(R.drawable.bg_btn_circle_action)
                    return
                }
                if (screenBackStack.isNotEmpty()) {
                    val prev = screenBackStack.removeAt(screenBackStack.size - 1)
                    navigateTo(prev, addToBackStack = false)
                } else if (currentScreen != Screen.DASHBOARD) {
                    navigateTo(Screen.DASHBOARD, addToBackStack = false)
                } else {
                    finish()
                }
            }
        })
    }

    // =========================================================================
    // View Initialization
    // =========================================================================

    private fun initViews() {
        // Main Content ScrollView
        mainScrollView = findViewById(R.id.mainScrollView)

        // Top Bar
        btnHeaderBack = findViewById(R.id.btnHeaderBack)
        imgAppLogo = findViewById(R.id.imgAppLogo)
        tvHeaderTitle = findViewById(R.id.tvHeaderTitle)
        tvHeaderSubtitle = findViewById(R.id.tvHeaderSubtitle)
        tvHeaderStatusBadge = findViewById(R.id.tvHeaderStatusBadge)

        // 13 Screen Containers
        screenDashboard = findViewById(R.id.screenDashboard)
        screenSims = findViewById(R.id.screenSims)
        screenCalls = findViewById(R.id.screenCalls)
        screenAgent = findViewById(R.id.screenAgent)
        screenSettings = findViewById(R.id.screenSettings)
        screenDeviceDetails = findViewById(R.id.screenDeviceDetails)
        screenTelemetry = findViewById(R.id.screenTelemetry)
        screenCallLogs = findViewById(R.id.screenCallLogs)
        screenAdvancedSettings = findViewById(R.id.screenAdvancedSettings)
        screenAudioVoice = findViewById(R.id.screenAudioVoice)
        screenGatewayLogs = findViewById(R.id.screenGatewayLogs)
        screenVoiceTest = findViewById(R.id.screenVoiceTest)
        screenAbout = findViewById(R.id.screenAbout)

        // Bottom Nav Bar
        bottomNavBar = findViewById(R.id.bottomNavBar)
        navBtnDashboard = findViewById(R.id.navBtnDashboard)
        navBtnCalls = findViewById(R.id.navBtnCalls)
        navBtnSims = findViewById(R.id.navBtnSims)
        navBtnAgent = findViewById(R.id.navBtnAgent)
        navBtnSettings = findViewById(R.id.navBtnSettings)

        // Screen 1: Dashboard
        tvDashStatus = findViewById(R.id.tvDashStatus)
        tvDashStatusSub = findViewById(R.id.tvDashStatusSub)
        tvDashUptime = findViewById(R.id.tvDashUptime)
        cardDashDeviceOverview = findViewById(R.id.cardDashDeviceOverview)
        tvDashDeviceModel = findViewById(R.id.tvDashDeviceModel)
        tvDashAndroidVersion = findViewById(R.id.tvDashAndroidVersion)
        tvDashDeviceId = findViewById(R.id.tvDashDeviceId)
        gridDashMetrics = findViewById(R.id.gridDashMetrics)
        tvDashBattery = findViewById(R.id.tvDashBattery)
        tvDashCharging = findViewById(R.id.tvDashCharging)
        tvDashSignalDbm = findViewById(R.id.tvDashSignalDbm)
        tvDashCarrier = findViewById(R.id.tvDashCarrier)
        tvDashNetworkType = findViewById(R.id.tvDashNetworkType)
        tvDashLatency = findViewById(R.id.tvDashLatency)
        btnDashConnect = findViewById(R.id.btnDashConnect)

        // Screen 2: SIMs
        tabSimCards = findViewById(R.id.tabSimCards)
        tabEsimProfiles = findViewById(R.id.tabEsimProfiles)
        tabSimPreference = findViewById(R.id.tabSimPreference)
        tvSimCountBadge = findViewById(R.id.tvSimCountBadge)
        containerSimCards = findViewById(R.id.containerSimCards)
        tvNoSimMsg = findViewById(R.id.tvNoSimMsg)
        btnSetDefaultSim = findViewById(R.id.btnSetDefaultSim)

        // Screen 3: Calls Sub-Tabs & Containers
        layoutCallsSubTabs = findViewById(R.id.layoutCallsSubTabs)
        tabCallsKeypad = findViewById(R.id.tabCallsKeypad)
        tabCallsRecents = findViewById(R.id.tabCallsRecents)
        tabCallsContacts = findViewById(R.id.tabCallsContacts)
        tabCallsSettings = findViewById(R.id.tabCallsSettings)
        containerCallsKeypadView = findViewById(R.id.containerCallsKeypadView)
        containerCallsRecentsView = findViewById(R.id.containerCallsRecentsView)
        containerCallsContactsView = findViewById(R.id.containerCallsContactsView)
        containerCallsSettingsView = findViewById(R.id.containerCallsSettingsView)

        // In-Call Station Card
        cardActiveCall = findViewById(R.id.cardActiveCall)
        tvActiveCallTitle = findViewById(R.id.tvActiveCallTitle)
        tvCallStatePill = findViewById(R.id.tvCallStatePill)
        ivInCallAvatar = findViewById(R.id.ivInCallAvatar)
        tvCallNumber = findViewById(R.id.tvCallNumber)
        tvCallLineDetails = findViewById(R.id.tvCallLineDetails)
        tvCallDuration = findViewById(R.id.tvCallDuration)
        layoutIncomingCallActions = findViewById(R.id.layoutIncomingCallActions)
        btnCallReject = findViewById(R.id.btnCallReject)
        btnCallAnswer = findViewById(R.id.btnCallAnswer)
        layoutActiveCallControls = findViewById(R.id.layoutActiveCallControls)
        btnCallMute = findViewById(R.id.btnCallMute)
        btnCallKeypad = findViewById(R.id.btnCallKeypad)
        btnCallSpeaker = findViewById(R.id.btnCallSpeaker)
        btnCallPause = findViewById(R.id.btnCallPause)
        btnCallHangup = findViewById(R.id.btnCallHangup)

        // Sub-View 1: Keypad / Dialer
        layoutSuggestionsWrapper = findViewById(R.id.layoutSuggestionsWrapper)
        containerNumberSuggestions = findViewById(R.id.containerNumberSuggestions)
        tvSuggestionsPlaceholder = findViewById(R.id.tvSuggestionsPlaceholder)
        tvDialedNumber = findViewById(R.id.tvDialedNumber)
        btnDialerBackspace = findViewById(R.id.btnDialerBackspace)
        btnDialer1 = findViewById(R.id.btnDialer1)
        btnDialer2 = findViewById(R.id.btnDialer2)
        btnDialer3 = findViewById(R.id.btnDialer3)
        btnDialer4 = findViewById(R.id.btnDialer4)
        btnDialer5 = findViewById(R.id.btnDialer5)
        btnDialer6 = findViewById(R.id.btnDialer6)
        btnDialer7 = findViewById(R.id.btnDialer7)
        btnDialer8 = findViewById(R.id.btnDialer8)
        btnDialer9 = findViewById(R.id.btnDialer9)
        btnDialer0 = findViewById(R.id.btnDialer0)
        btnDialerStar = findViewById(R.id.btnDialerStar)
        btnDialerPound = findViewById(R.id.btnDialerPound)
        btnDialerCall = findViewById(R.id.btnDialerCall)

        // Sub-View 2: Recents
        etRecentsSearch = findViewById(R.id.etRecentsSearch)
        btnClearRecentsSearch = findViewById(R.id.btnClearRecentsSearch)
        tabRecentsAll = findViewById(R.id.tabRecentsAll)
        tabRecentsMissed = findViewById(R.id.tabRecentsMissed)
        tabRecentsIncoming = findViewById(R.id.tabRecentsIncoming)
        tabRecentsOutgoing = findViewById(R.id.tabRecentsOutgoing)
        containerRecentsList = findViewById(R.id.containerRecentsList)
        tvNoRecentsMsg = findViewById(R.id.tvNoRecentsMsg)

        // Sub-View 3: Contacts
        etContactsSearch = findViewById(R.id.etContactsSearch)
        btnClearContactsSearch = findViewById(R.id.btnClearContactsSearch)
        tvContactsCountBadge = findViewById(R.id.tvContactsCountBadge)
        btnAddNewContact = findViewById(R.id.btnAddNewContact)
        containerContactsList = findViewById(R.id.containerContactsList)
        tvNoContactsMsg = findViewById(R.id.tvNoContactsMsg)

        // Sub-View 4: Gateway Settings
        switchAutoAnswer = findViewById(R.id.switchAutoAnswer)
        btnDelay0 = findViewById(R.id.btnDelay0)
        btnDelay3 = findViewById(R.id.btnDelay3)
        btnDelay5 = findViewById(R.id.btnDelay5)
        btnDelay10 = findViewById(R.id.btnDelay10)
        tvRingTimeout = findViewById(R.id.tvRingTimeout)
        switchAutoRejectUnknown = findViewById(R.id.switchAutoRejectUnknown)
        rowAutoSpeaker = findViewById(R.id.rowAutoSpeaker)
        tvAutoSpeakerVal = findViewById(R.id.tvAutoSpeakerVal)
        rowAutoMute = findViewById(R.id.rowAutoMute)
        tvAutoMuteVal = findViewById(R.id.tvAutoMuteVal)
        rowVibration = findViewById(R.id.rowVibration)
        tvVibrationVal = findViewById(R.id.tvVibrationVal)
        rowRecording = findViewById(R.id.rowRecording)
        tvRecordingVal = findViewById(R.id.tvRecordingVal)
        rowDtmf = findViewById(R.id.rowDtmf)
        tvDtmfVal = findViewById(R.id.tvDtmfVal)
        rowRingtoneSelect = findViewById(R.id.rowRingtoneSelect)
        tvRingtoneVal = findViewById(R.id.tvRingtoneVal)

        // Screen 4: AI Agent
        tvAgentName = findViewById(R.id.tvAgentName)
        tvAgentRole = findViewById(R.id.tvAgentRole)
        tvAgentConversations = findViewById(R.id.tvAgentConversations)
        tvAgentSuccessRate = findViewById(R.id.tvAgentSuccessRate)
        tvAgentAvgDuration = findViewById(R.id.tvAgentAvgDuration)
        tvAgentVoiceEngine = findViewById(R.id.tvAgentVoiceEngine)
        tvAgentLanguage = findViewById(R.id.tvAgentLanguage)
        tvAgentSpeechSpeed = findViewById(R.id.tvAgentSpeechSpeed)
        tvAgentSpeechStyle = findViewById(R.id.tvAgentSpeechStyle)
        tvAgentProvider = findViewById(R.id.tvAgentProvider)
        tvAgentLlm = findViewById(R.id.tvAgentLlm)
        tvAgentTemperature = findViewById(R.id.tvAgentTemperature)
        btnNavVoiceTest = findViewById(R.id.btnNavVoiceTest)
        containerAgentsList = findViewById(R.id.containerAgentsList)
        containerAgentRecordingsList = findViewById(R.id.containerAgentRecordingsList)
        tvAgentRecordingsBadge = findViewById(R.id.tvAgentRecordingsBadge)
        tvNoAgentRecordingsMsg = findViewById(R.id.tvNoAgentRecordingsMsg)

        // Screen 5: Settings
        etServerUrl = findViewById(R.id.etServerUrl)
        btnPresetCloud = findViewById(R.id.btnPresetCloud)
        btnPresetLocal = findViewById(R.id.btnPresetLocal)
        tvPermissionsCount = findViewById(R.id.tvPermissionsCount)
        btnGrantAllPermissions = findViewById(R.id.btnGrantAllPermissions)
        rowTogglePermissionDetails = findViewById(R.id.rowTogglePermissionDetails)
        tvPermissionDetailsToggleLabel = findViewById(R.id.tvPermissionDetailsToggleLabel)
        ivPermissionToggleChevron = findViewById(R.id.ivPermissionToggleChevron)
        containerPermissionDetails = findViewById(R.id.containerPermissionDetails)
        btnSetDefaultPhoneApp = findViewById(R.id.btnSetDefaultPhoneApp)
        btnBatteryOptimization = findViewById(R.id.btnBatteryOptimization)
        btnRevokeGuidance = findViewById(R.id.btnRevokeGuidance)
        rowNavDeviceDetails = findViewById(R.id.rowNavDeviceDetails)
        rowNavTelemetry = findViewById(R.id.rowNavTelemetry)
        rowNavCallLogs = findViewById(R.id.rowNavCallLogs)
        rowNavAdvancedSettings = findViewById(R.id.rowNavAdvancedSettings)
        rowNavAudioVoice = findViewById(R.id.rowNavAudioVoice)
        rowNavGatewayLogs = findViewById(R.id.rowNavGatewayLogs)
        rowNavCallRecording = findViewById(R.id.rowNavCallRecording)
        tvRecordingCountBadge = findViewById(R.id.tvRecordingCountBadge)
        rowNavRecycleBin = findViewById(R.id.rowNavRecycleBin)
        tvRecycleBinCount = findViewById(R.id.tvRecycleBinCount)
        btnClearAllCallData = findViewById(R.id.btnClearAllCallData)
        rowNavAbout = findViewById(R.id.rowNavAbout)

        // Screen 6: Device Details
        containerDeviceDetailsRows = findViewById(R.id.containerDeviceDetailsRows)

        // Screen 7: Real-Time Telemetry
        tvTelemetryBatteryVal = findViewById(R.id.tvTelemetryBatteryVal)
        tvBatteryHistoryGraph = findViewById(R.id.tvBatteryHistoryGraph)
        tvTelemetrySignalVal = findViewById(R.id.tvTelemetrySignalVal)
        tvSignalHistoryGraph = findViewById(R.id.tvSignalHistoryGraph)
        tvTelemetryUpload = findViewById(R.id.tvTelemetryUpload)
        tvTelemetryDownload = findViewById(R.id.tvTelemetryDownload)
        tvTelemetryLatency = findViewById(R.id.tvTelemetryLatency)

        // Screen 8: Call Logs
        etCallLogSearch = findViewById(R.id.etCallLogSearch)
        btnClearCallLogSearch = findViewById(R.id.btnClearCallLogSearch)
        tabLogAll = findViewById(R.id.tabLogAll)
        tabLogMissed = findViewById(R.id.tabLogMissed)
        tabLogIncoming = findViewById(R.id.tabLogIncoming)
        tabLogOutgoing = findViewById(R.id.tabLogOutgoing)
        containerCallLogs = findViewById(R.id.containerCallLogs)
        tvNoLogsMsg = findViewById(R.id.tvNoLogsMsg)

        // Screen 9: Advanced Settings
        containerAdvancedRows = findViewById(R.id.containerAdvancedRows)
        btnResetGateway = findViewById(R.id.btnResetGateway)

        // Screen 10: Audio & Voice
        tvAudioOutputDevice = findViewById(R.id.tvAudioOutputDevice)
        btnTestAudioAudioVoice = findViewById(R.id.btnTestAudioAudioVoice)

        // Screen 11: Gateway Logs
        tvTerminalLogs = findViewById(R.id.tvTerminalLogs)
        btnClearLogs = findViewById(R.id.btnClearLogs)
        btnExportLogs = findViewById(R.id.btnExportLogs)

        // Screen 12: AI Voice Test
        tvVoiceTestSelectedVoice = findViewById(R.id.tvVoiceTestSelectedVoice)
        btnPlayVoice = findViewById(R.id.btnPlayVoice)

        // Screen 13: About
        rowAboutUpdates = findViewById(R.id.rowAboutUpdates)
        rowAboutGuide = findViewById(R.id.rowAboutGuide)
        rowAboutPrivacy = findViewById(R.id.rowAboutPrivacy)
        rowAboutLicenses = findViewById(R.id.rowAboutLicenses)

        // Persisted Settings Initialization
        val devicePrefs = getSharedPreferences(PREFS_DEVICE, Context.MODE_PRIVATE)
        val telephonyPrefs = getSharedPreferences(PREFS_TELEPHONY, Context.MODE_PRIVATE)

        val savedUrl = devicePrefs.getString("server_url", DEFAULT_CLOUD_URL) ?: DEFAULT_CLOUD_URL
        val cleanSavedUrl = savedUrl.replace(Regex("^(ws|wss|http|https):/+(.*)$")) { "${it.groupValues[1]}://${it.groupValues[2]}" }
        etServerUrl.setText(cleanSavedUrl)

        val autoAnswerEnabled = telephonyPrefs.getBoolean("auto_answer_enabled", true)
        switchAutoAnswer.isChecked = autoAnswerEnabled

        val delaySec = telephonyPrefs.getInt("auto_answer_delay_sec", 3)
        highlightDelayButton(delaySec)
    }

    // =========================================================================
    // Screen Navigation & Back Stack
    // =========================================================================

    private fun setupBottomNav() {
        navBtnDashboard.setOnClickListener { navigateTo(Screen.DASHBOARD) }
        navBtnCalls.setOnClickListener { navigateTo(Screen.CALLS) }
        navBtnSims.setOnClickListener { navigateTo(Screen.SIMS) }
        navBtnAgent.setOnClickListener { navigateTo(Screen.AGENT) }
        navBtnSettings.setOnClickListener { navigateTo(Screen.SETTINGS) }
    }

    private fun setupScreenNavigation() {
        btnHeaderBack.setOnClickListener {
            onBackPressedDispatcher.onBackPressed()
        }

        cardDashDeviceOverview.setOnClickListener { navigateTo(Screen.DEVICE_DETAILS) }
        gridDashMetrics.setOnClickListener { navigateTo(Screen.TELEMETRY) }

        btnNavVoiceTest.setOnClickListener { navigateTo(Screen.VOICE_TEST) }

        rowNavDeviceDetails.setOnClickListener { navigateTo(Screen.DEVICE_DETAILS) }
        rowNavTelemetry.setOnClickListener { navigateTo(Screen.TELEMETRY) }
        rowNavCallLogs.setOnClickListener { navigateTo(Screen.CALL_LOGS) }
        rowNavAdvancedSettings.setOnClickListener { navigateTo(Screen.ADVANCED_SETTINGS) }
        rowNavAudioVoice.setOnClickListener { navigateTo(Screen.AUDIO_VOICE) }
        rowNavGatewayLogs.setOnClickListener { navigateTo(Screen.GATEWAY_LOGS) }
        rowNavCallRecording.setOnClickListener { showCallRecordingDiagnosticDialog() }
        rowNavRecycleBin.setOnClickListener { showRecycleBinDialog() }
        btnClearAllCallData.setOnClickListener { showClearAllDataDialog() }
        rowNavAbout.setOnClickListener { navigateTo(Screen.ABOUT) }

        rowAboutUpdates.setOnClickListener {
            Toast.makeText(this, "Nexus Call OS Gateway is on latest version v2.5.0 (Build 180)", Toast.LENGTH_SHORT).show()
        }
        rowAboutGuide.setOnClickListener {
            val prefs = getSharedPreferences(PREFS_DEVICE, Context.MODE_PRIVATE)
            val cloudWs = prefs.getString("cloud_tunnel_ws_url", null)
            val guideUrl = if (!cloudWs.isNullOrBlank()) {
                cloudWs.replace("wss://", "https://").replace("ws://", "http://").substringBefore("/api/") + "/#/mobile-gateway"
            } else {
                "http://192.168.1.33:3000/#/mobile-gateway"
            }
            val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(guideUrl))
            startActivity(browserIntent)
        }
        rowAboutPrivacy.setOnClickListener {
            Toast.makeText(this, "Telemetry & audio are streamed securely directly to your private Nexus Core.", Toast.LENGTH_SHORT).show()
        }
        rowAboutLicenses.setOnClickListener {
            Toast.makeText(this, "Licensed under Apache 2.0 / Nexus Enterprise Telephony License.", Toast.LENGTH_SHORT).show()
        }
    }

    fun navigateTo(screen: Screen, addToBackStack: Boolean = true) {
        if (addToBackStack && currentScreen != screen) {
            screenBackStack.add(currentScreen)
        }
        currentScreen = screen

        // Hide all screens
        val screens = listOf(
            screenDashboard, screenSims, screenCalls, screenAgent, screenSettings,
            screenDeviceDetails, screenTelemetry, screenCallLogs, screenAdvancedSettings,
            screenAudioVoice, screenGatewayLogs, screenVoiceTest, screenAbout
        )
        screens.forEach { it.visibility = View.GONE }
        mainScrollView?.visibility = if (screen == Screen.CALLS) View.GONE else View.VISIBLE

        val isSubScreen = screen !in listOf(Screen.DASHBOARD, Screen.CALLS, Screen.SIMS, Screen.AGENT, Screen.SETTINGS)
        btnHeaderBack.visibility = if (isSubScreen) View.VISIBLE else View.GONE
        imgAppLogo.visibility = if (isSubScreen) View.GONE else View.VISIBLE

        when (screen) {
            Screen.DASHBOARD -> {
                screenDashboard.visibility = View.VISIBLE
                tvHeaderTitle.text = getString(R.string.title_dashboard)
                tvHeaderSubtitle.text = getString(R.string.header_subtitle)
                highlightBottomNav(0)
            }
            Screen.CALLS -> {
                screenCalls.visibility = View.VISIBLE
                tvHeaderTitle.text = "Phone & Dialer"
                tvHeaderSubtitle.text = "Native Telephony & Cellular Gateway"
                highlightBottomNav(1)
                if (selectedCallsTab == 0) {
                    containerCallsKeypadView.visibility = View.VISIBLE
                    layoutSuggestionsWrapper.visibility = View.VISIBLE
                    btnDialerCall.visibility = View.VISIBLE
                } else if (selectedCallsTab == 1) renderRecents()
                else if (selectedCallsTab == 2) renderContacts()
            }
            Screen.SIMS -> {
                screenSims.visibility = View.VISIBLE
                tvHeaderTitle.text = getString(R.string.title_sim_mgmt)
                tvHeaderSubtitle.text = getString(R.string.sub_sim_mgmt)
                refreshSimCards()
                highlightBottomNav(2)
            }
            Screen.AGENT -> {
                screenAgent.visibility = View.VISIBLE
                tvHeaderTitle.text = getString(R.string.title_ai_agent)
                tvHeaderSubtitle.text = getString(R.string.sub_ai_agent)
                highlightBottomNav(3)
                loadBackendAgents()
                renderAgentRecordings()
            }
            Screen.SETTINGS -> {
                screenSettings.visibility = View.VISIBLE
                tvHeaderTitle.text = getString(R.string.title_settings)
                tvHeaderSubtitle.text = getString(R.string.sub_settings)
                auditPermissions()
                updateRecycleBinBadge()
                val recCount = recordingManager.getAllRecordings().size
                tvRecordingCountBadge.text = "$recCount files"
                highlightBottomNav(4)
            }
            Screen.DEVICE_DETAILS -> {
                screenDeviceDetails.visibility = View.VISIBLE
                tvHeaderTitle.text = "Device Details"
                tvHeaderSubtitle.text = "Hardware & Operating System"
                renderDeviceDetails()
            }
            Screen.TELEMETRY -> {
                screenTelemetry.visibility = View.VISIBLE
                tvHeaderTitle.text = "Real-Time Telemetry"
                tvHeaderSubtitle.text = "Live Cellular & Battery Spectrum"
                renderTelemetryView()
            }
            Screen.CALL_LOGS -> {
                screenCallLogs.visibility = View.VISIBLE
                tvHeaderTitle.text = "Call Logs"
                tvHeaderSubtitle.text = "Cellular Incoming & Outgoing History"
                renderCallLogs()
            }
            Screen.ADVANCED_SETTINGS -> {
                screenAdvancedSettings.visibility = View.VISIBLE
                tvHeaderTitle.text = "Advanced Settings"
                tvHeaderSubtitle.text = "Telephony Stack Configuration"
                renderAdvancedSettings()
            }
            Screen.AUDIO_VOICE -> {
                screenAudioVoice.visibility = View.VISIBLE
                tvHeaderTitle.text = "Audio & Voice"
                tvHeaderSubtitle.text = "Full-Duplex 16kHz PCM Pipeline"
            }
            Screen.GATEWAY_LOGS -> {
                screenGatewayLogs.visibility = View.VISIBLE
                tvHeaderTitle.text = "Gateway Logs"
                tvHeaderSubtitle.text = "Real-Time Diagnostic Terminal"
                updateLogsView()
            }
            Screen.VOICE_TEST -> {
                screenVoiceTest.visibility = View.VISIBLE
                tvHeaderTitle.text = "AI Voice Test"
                tvHeaderSubtitle.text = "Conversational Audio Synthesis"
            }
            Screen.ABOUT -> {
                screenAbout.visibility = View.VISIBLE
                tvHeaderTitle.text = "About"
                tvHeaderSubtitle.text = "Nexus Call OS GSM Gateway"
            }
        }
    }

    private fun highlightBottomNav(activeIdx: Int) {
        val buttons = listOf(navBtnDashboard, navBtnCalls, navBtnSims, navBtnAgent, navBtnSettings)
        val activeBg = ContextCompat.getDrawable(this, R.drawable.bg_tab_nav_active)
        val inactiveBg = ContextCompat.getDrawable(this, R.drawable.bg_tab_nav_inactive)
        val activeColor = ContextCompat.getColor(this, R.color.bottom_nav_active)
        val inactiveColor = ContextCompat.getColor(this, R.color.bottom_nav_inactive)

        buttons.forEachIndexed { i, btn ->
            if (i == activeIdx) {
                btn.background = activeBg
                btn.setTextColor(activeColor)
            } else {
                btn.background = inactiveBg
                btn.setTextColor(inactiveColor)
            }
        }
    }

    // =========================================================================
    // Listeners & Controls
    // =========================================================================

    private fun setupListeners() {
        btnDashConnect.setOnClickListener { toggleGatewayConnection() }

        // SIM screen segmented tabs
        tabSimCards.setOnClickListener {
            selectedSimTab = 0
            highlightSimTab(0)
            refreshSimCards()
        }
        tabEsimProfiles.setOnClickListener {
            selectedSimTab = 1
            highlightSimTab(1)
            refreshSimCards()
        }
        tabSimPreference.setOnClickListener {
            selectedSimTab = 2
            highlightSimTab(2)
            refreshSimCards()
        }
        btnSetDefaultSim.setOnClickListener {
            val subs = simManager.getActiveSubscriptions()
            if (subs.isNotEmpty()) {
                simManager.setSelectedSubscriptionId(subs.first().subId)
                refreshSimCards()
                Toast.makeText(this, "Default Calling Line updated: ${subs.first().displayName}", Toast.LENGTH_SHORT).show()
            }
        }

        // ==================== Calls Screen Sub-Tabs ====================
        tabCallsKeypad.setOnClickListener { switchCallsSubTab(0) }
        tabCallsRecents.setOnClickListener { switchCallsSubTab(1) }
        tabCallsContacts.setOnClickListener { switchCallsSubTab(2) }
        tabCallsSettings.setOnClickListener { switchCallsSubTab(3) }

        // ==================== Dialer Keypad Clicks ====================
        btnDialer1.setOnClickListener { handleDialerDigit('1') }
        btnDialer2.setOnClickListener { handleDialerDigit('2') }
        btnDialer3.setOnClickListener { handleDialerDigit('3') }
        btnDialer4.setOnClickListener { handleDialerDigit('4') }
        btnDialer5.setOnClickListener { handleDialerDigit('5') }
        btnDialer6.setOnClickListener { handleDialerDigit('6') }
        btnDialer7.setOnClickListener { handleDialerDigit('7') }
        btnDialer8.setOnClickListener { handleDialerDigit('8') }
        btnDialer9.setOnClickListener { handleDialerDigit('9') }
        btnDialerStar.setOnClickListener { handleDialerDigit('*') }
        btnDialerPound.setOnClickListener { handleDialerDigit('#') }

        btnDialer0.setOnClickListener { handleDialerDigit('0') }
        btnDialer0.setOnLongClickListener {
            handleDialerDigit('+')
            true
        }

        btnDialerBackspace.setOnClickListener {
            if (currentCallState == CallState.CONNECTED || currentCallState == CallState.DIALING) {
                if (inCallDtmfDigits.isNotEmpty()) {
                    inCallDtmfDigits = inCallDtmfDigits.dropLast(1)
                    tvDialedNumber.text = inCallDtmfDigits
                    btnDialerBackspace.visibility = if (inCallDtmfDigits.isNotEmpty()) View.VISIBLE else View.INVISIBLE
                }
            } else {
                if (dialedNumber.isNotEmpty()) {
                    dialedNumber = dialedNumber.dropLast(1)
                    updateDialedNumberDisplay()
                }
            }
        }
        btnDialerBackspace.setOnLongClickListener {
            if (currentCallState == CallState.CONNECTED || currentCallState == CallState.DIALING) {
                inCallDtmfDigits = ""
                tvDialedNumber.text = ""
                btnDialerBackspace.visibility = View.INVISIBLE
            } else {
                dialedNumber = ""
                updateDialedNumberDisplay()
            }
            true
        }

        btnDialerCall.setOnClickListener {
            if (dialedNumber.isNotBlank()) {
                initiateOutgoingCellularCall(dialedNumber)
            } else {
                // If empty, try to populate last dialed number
                val lastLog = callLogManager.getCallLogs(limit = 1).firstOrNull()
                if (lastLog != null) {
                    dialedNumber = lastLog.number
                    updateDialedNumberDisplay()
                } else {
                    Toast.makeText(this, "Please enter a phone number", Toast.LENGTH_SHORT).show()
                }
            }
        }

        // ==================== Recents Sub-Tab Controls ====================
        etRecentsSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                recentsSearchQuery = s?.toString()?.trim() ?: ""
                btnClearRecentsSearch.visibility = if (recentsSearchQuery.isNotEmpty()) View.VISIBLE else View.GONE
                renderRecents()
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        btnClearRecentsSearch.setOnClickListener {
            etRecentsSearch.text.clear()
            recentsSearchQuery = ""
            btnClearRecentsSearch.visibility = View.GONE
            renderRecents()
        }

        tabRecentsAll.setOnClickListener { filterRecents(null) }
        tabRecentsMissed.setOnClickListener { filterRecents(CallLogType.MISSED) }
        tabRecentsIncoming.setOnClickListener { filterRecents(CallLogType.INCOMING) }
        tabRecentsOutgoing.setOnClickListener { filterRecents(CallLogType.OUTGOING) }

        // ==================== Contacts Sub-Tab Controls ====================
        etContactsSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                contactsSearchQuery = s?.toString()?.trim() ?: ""
                btnClearContactsSearch.visibility = if (contactsSearchQuery.isNotEmpty()) View.VISIBLE else View.GONE
                renderContacts()
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        btnClearContactsSearch.setOnClickListener {
            etContactsSearch.text.clear()
            contactsSearchQuery = ""
            btnClearContactsSearch.visibility = View.GONE
            renderContacts()
        }

        btnAddNewContact.setOnClickListener {
            val intent = Intent(Intent.ACTION_INSERT, ContactsContract.Contacts.CONTENT_URI)
            try {
                startActivity(intent)
            } catch (e: Exception) {
                Toast.makeText(this, "Could not open contacts app: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }

        // ==================== Call Screen Gateway Settings Controls ====================
        switchAutoAnswer.setOnCheckedChangeListener { _, isChecked ->
            getSharedPreferences(PREFS_TELEPHONY, Context.MODE_PRIVATE)
                .edit().putBoolean("auto_answer_enabled", isChecked).apply()
            NexusApplication.log("INFO", "CallControl", "Auto-answer toggled: $isChecked")
            Toast.makeText(this, "Auto-answer: ${if (isChecked) "ON" else "OFF"}", Toast.LENGTH_SHORT).show()
        }

        btnDelay0.setOnClickListener { setAutoAnswerDelay(0) }
        btnDelay3.setOnClickListener { setAutoAnswerDelay(3) }
        btnDelay5.setOnClickListener { setAutoAnswerDelay(5) }
        btnDelay10.setOnClickListener { setAutoAnswerDelay(10) }

        tvRingTimeout.setOnClickListener {
            val current = tvRingTimeout.text.toString()
            val next = when {
                current.contains("15") -> "30 seconds ▾"
                current.contains("30") -> "45 seconds ▾"
                else -> "15 seconds ▾"
            }
            tvRingTimeout.text = next
        }

        rowAutoSpeaker.setOnClickListener {
            isSpeakerOn = !isSpeakerOn
            CompanionInCallService.setSpeaker(isSpeakerOn)
            tvAutoSpeakerVal.text = if (isSpeakerOn) "On ›" else "Off ›"
        }
        rowAutoMute.setOnClickListener {
            isMuted = !isMuted
            CompanionInCallService.setMuted(isMuted)
            bridgeService?.audioManager?.setMute(isMuted)
            tvAutoMuteVal.text = if (isMuted) "On ›" else "Off ›"
        }
        rowVibration.setOnClickListener {
            val cur = tvVibrationVal.text.toString()
            tvVibrationVal.text = if (cur.contains("On")) "Off ›" else "On ›"
        }
        rowRecording.setOnClickListener {
            showCallRecordingDiagnosticDialog()
        }
        rowDtmf.setOnClickListener {
            val cur = tvDtmfVal.text.toString()
            tvDtmfVal.text = if (cur.contains("On")) "Off ›" else "On ›"
        }
        rowRingtoneSelect.setOnClickListener {
            showRingtoneSelectorDialog()
        }

        // ==================== AI Voice Agent Interactive SSOT Controls ====================
        tvAgentProvider.setOnClickListener { showProviderPicker() }
        tvAgentLlm.setOnClickListener { showModelPicker() }
        tvAgentVoiceEngine.setOnClickListener { showVoicePicker() }
        tvAgentLanguage.setOnClickListener { showLanguagePicker() }
        tvAgentTemperature.setOnClickListener { showTemperaturePicker() }

        // ==================== Active In-Call Controls ====================
        btnCallReject.setOnClickListener {
            CompanionInCallService.disconnectCurrentCall()
        }
        btnCallAnswer.setOnClickListener {
            CompanionInCallService.answerCurrentCall()
        }

        btnCallMute.setOnClickListener {
            isMuted = !isMuted
            CompanionInCallService.setMuted(isMuted)
            bridgeService?.audioManager?.setMute(isMuted)
            btnCallMute.setImageResource(if (isMuted) R.drawable.ic_mic_off else R.drawable.ic_mic)
            btnCallMute.setBackgroundResource(
                if (isMuted) R.drawable.bg_btn_circle_active else R.drawable.bg_btn_circle_action
            )
            Toast.makeText(this, if (isMuted) "Microphone muted" else "Microphone unmuted", Toast.LENGTH_SHORT).show()
        }

        btnCallKeypad.setOnClickListener {
            val isKeypadVisible = containerCallsKeypadView.visibility == View.VISIBLE
            if (isKeypadVisible) {
                containerCallsKeypadView.visibility = View.GONE
                ivInCallAvatar.visibility = View.VISIBLE
                tvCallLineDetails.visibility = View.VISIBLE
                btnCallKeypad.setBackgroundResource(R.drawable.bg_btn_circle_action)
            } else {
                containerCallsKeypadView.visibility = View.VISIBLE
                layoutSuggestionsWrapper.visibility = View.INVISIBLE
                containerNumberSuggestions.removeAllViews()
                tvSuggestionsPlaceholder?.visibility = View.GONE
                btnDialerCall.visibility = View.GONE
                ivInCallAvatar.visibility = View.GONE
                tvCallLineDetails.visibility = View.GONE
                btnCallKeypad.setBackgroundResource(R.drawable.bg_btn_circle_active)
                tvDialedNumber.hint = "Touch tone digits..."
                tvDialedNumber.text = inCallDtmfDigits
                btnDialerBackspace.visibility = if (inCallDtmfDigits.isNotEmpty()) View.VISIBLE else View.INVISIBLE
            }
        }

        btnCallSpeaker.setOnClickListener {
            isSpeakerOn = !isSpeakerOn
            CompanionInCallService.setSpeaker(isSpeakerOn)
            btnCallSpeaker.setBackgroundResource(
                if (isSpeakerOn) R.drawable.bg_btn_circle_active else R.drawable.bg_btn_circle_action
            )
            Toast.makeText(this, if (isSpeakerOn) "Speakerphone ON" else "Earpiece ON", Toast.LENGTH_SHORT).show()
        }

        btnCallPause.setOnClickListener {
            val onHold = CompanionInCallService.toggleHold()
            tvCallStatePill.text = if (onHold) "● ON HOLD" else "● LIVE"
            tvCallStatePill.setTextColor(
                ContextCompat.getColor(this, if (onHold) R.color.status_warning else R.color.status_online)
            )
            btnCallPause.setBackgroundResource(
                if (onHold) R.drawable.bg_btn_circle_active else R.drawable.bg_btn_circle_action
            )
            Toast.makeText(this, if (onHold) "Call placed on hold" else "Call resumed", Toast.LENGTH_SHORT).show()
        }

        btnCallHangup.setOnClickListener {
            CompanionInCallService.disconnectCurrentCall()
            cardActiveCall.visibility = View.GONE
            ivInCallAvatar.visibility = View.VISIBLE
            tvCallLineDetails.visibility = View.VISIBLE
            layoutCallsSubTabs.visibility = View.VISIBLE
            layoutSuggestionsWrapper.visibility = View.VISIBLE
            btnDialerCall.visibility = View.VISIBLE
            btnCallKeypad.setBackgroundResource(R.drawable.bg_btn_circle_action)
            callStartTimestamp = 0L
            inCallDtmfDigits = ""
            tvDialedNumber.hint = "Enter phone number..."
            dialedNumber = ""
            updateDialedNumberDisplay()
            switchCallsSubTab(selectedCallsTab)
            if (selectedCallsTab == 1) renderRecents()
            if (selectedCallsTab == 2) renderContacts()
        }

        // ==================== AI Agent Screen controls ====================
        tvAgentProvider.setOnClickListener { showProviderPicker() }
        tvAgentLlm.setOnClickListener { showModelPicker() }
        tvAgentVoiceEngine.setOnClickListener { showVoicePicker() }
        tvAgentLanguage.setOnClickListener { showLanguagePicker() }
        tvAgentTemperature.setOnClickListener { showTemperaturePicker() }
        tvAgentSpeechSpeed.setOnClickListener {
            val cur = tvAgentSpeechSpeed.text.toString()
            val nextSpeed = when {
                cur.contains("1.0x") -> "1.2x"
                cur.contains("1.2x") -> "1.5x"
                cur.contains("1.5x") -> "0.8x"
                else -> "1.0x"
            }
            tvAgentSpeechSpeed.text = "$nextSpeed ▾"
            val spdVal = nextSpeed.removeSuffix("x").toDoubleOrNull() ?: 1.0
            selectedAgent?.let { ag ->
                updateAgentBackendConfig(agentId = ag.id, temperature = ag.temperature)
            }
        }
        tvAgentSpeechStyle.setOnClickListener {
            val cur = tvAgentSpeechStyle.text.toString()
            val nextStyle = if (cur.contains("Natural")) "Expressive" else "Natural"
            tvAgentSpeechStyle.text = "$nextStyle ▾"
        }
        btnNavVoiceTest.setOnClickListener {
            navigateTo(Screen.VOICE_TEST)
        }

        // ==================== Settings Screen controls ====================
        btnPresetCloud.setOnClickListener {
            val prefs = getSharedPreferences(PREFS_DEVICE, Context.MODE_PRIVATE)
            val savedCloudUrl = prefs.getString("cloud_tunnel_ws_url", null)
                ?: currentOverview?.cloudTunnelWsUrl
                ?: DEFAULT_CLOUD_URL
            processPairingOrServerUrl(savedCloudUrl)
            updatePresetButtonsHighlight(isCloud = true)
        }
        btnPresetLocal.setOnClickListener {
            val prefs = getSharedPreferences(PREFS_DEVICE, Context.MODE_PRIVATE)
            val lanIp = prefs.getString("lan_ip", null) ?: currentOverview?.lanIp ?: "192.168.1.33"
            val savedLocalUrl = prefs.getString("local_lan_ws_url", null)
                ?: currentOverview?.localLanWsUrl
                ?: "ws://$lanIp:8000/api/android-gateway/ws/bridge"
            processPairingOrServerUrl(savedLocalUrl)
            updatePresetButtonsHighlight(isCloud = false)
        }
        btnGrantAllPermissions.setOnClickListener {
            executeMasterGrantAllFlow()
        }
        rowTogglePermissionDetails.setOnClickListener {
            isPermissionDetailsExpanded = !isPermissionDetailsExpanded
            containerPermissionDetails.visibility = if (isPermissionDetailsExpanded) View.VISIBLE else View.GONE
            ivPermissionToggleChevron.rotation = if (isPermissionDetailsExpanded) 90f else 0f
            auditPermissions()
        }
        btnSetDefaultPhoneApp.setOnClickListener {
            promptDefaultDialerRole()
        }
        btnBatteryOptimization.setOnClickListener {
            requestIgnoreBatteryOptimization()
        }
        btnRevokeGuidance.setOnClickListener {
            showRevokeGuidanceDialog()
        }

        switchAutoRejectUnknown.setOnCheckedChangeListener { _, isChecked ->
            getSharedPreferences(PREFS_TELEPHONY, Context.MODE_PRIVATE)
                .edit().putBoolean("auto_reject_unknown", isChecked).apply()
            Toast.makeText(this, "Auto-reject unknown numbers: ${if (isChecked) "ON" else "OFF"}", Toast.LENGTH_SHORT).show()
        }

        // ==================== Call Logs Sub-Screen Search & Tabs ====================
        etCallLogSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                callLogSearchQuery = s?.toString()?.trim() ?: ""
                btnClearCallLogSearch.visibility = if (callLogSearchQuery.isNotEmpty()) View.VISIBLE else View.GONE
                renderCallLogs()
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        btnClearCallLogSearch.setOnClickListener {
            etCallLogSearch.text.clear()
            callLogSearchQuery = ""
            btnClearCallLogSearch.visibility = View.GONE
            renderCallLogs()
        }

        tabLogAll.setOnClickListener { filterCallLogs(null) }
        tabLogMissed.setOnClickListener { filterCallLogs(CallLogType.MISSED) }
        tabLogIncoming.setOnClickListener { filterCallLogs(CallLogType.INCOMING) }
        tabLogOutgoing.setOnClickListener { filterCallLogs(CallLogType.OUTGOING) }

        // ==================== Advanced Settings Controls ====================
        btnResetGateway.setOnClickListener {
            getSharedPreferences(PREFS_DEVICE, Context.MODE_PRIVATE).edit().clear().apply()
            getSharedPreferences(PREFS_TELEPHONY, Context.MODE_PRIVATE).edit().clear().apply()
            Toast.makeText(this, "Gateway settings reset to factory defaults.", Toast.LENGTH_LONG).show()
            etServerUrl.setText(DEFAULT_CLOUD_URL)
            highlightDelayButton(3)
        }

        // ==================== Audio & Voice Controls ====================
        tvAudioOutputDevice.setOnClickListener {
            val cur = tvAudioOutputDevice.text.toString()
            tvAudioOutputDevice.text = when {
                cur.contains("Speakerphone") -> "Earpiece ▾"
                cur.contains("Earpiece") -> "Bluetooth Headset ▾"
                else -> "Speakerphone ▾"
            }
        }
        btnTestAudioAudioVoice.setOnClickListener {
            runAudioOutputTest()
        }

        // ==================== Gateway Logs Controls ====================
        btnClearLogs.setOnClickListener {
            NexusApplication.clearLogs()
            updateLogsView()
        }
        btnExportLogs.setOnClickListener {
            exportStructuredJsonReport()
        }

        // ==================== Voice Test Control ====================
        btnPlayVoice.setOnClickListener {
            runAudioOutputTest()
        }

        // ==================== Reactive Telephony & Auto-Answer Callbacks ====================
        telemetryManager.onTelemetryChanged = { telemetry ->
            runOnUiThread {
                bindTelemetry(telemetry)
                if (currentScreen == Screen.TELEMETRY) renderTelemetryView()
                if (currentScreen == Screen.DEVICE_DETAILS) renderDeviceDetails()
            }
        }

        simManager.onSubscriptionsChanged = { _, _ ->
            runOnUiThread { refreshSimCards() }
        }

        AutoAnswerExecutor.onCountdownTick = { remainingSec ->
            runOnUiThread {
                if (remainingSec > 0) {
                    tvCallDuration.text = "Auto-answering in ${remainingSec}s..."
                }
            }
        }

        NexusApplication.setLogListener {
            runOnUiThread { updateLogsView() }
        }
    }

    // =========================================================================
    // Calls Screen Sub-Tab Switching (Keypad | Recents | Contacts | Gateway)
    // =========================================================================

    private fun switchCallsSubTab(tabIdx: Int) {
        selectedCallsTab = tabIdx
        val sel = ContextCompat.getDrawable(this, R.drawable.bg_tab_pill_selected)
        val unsel = ContextCompat.getDrawable(this, R.drawable.bg_tab_pill_unselected)
        val colSel = ContextCompat.getColor(this, R.color.text_primary)
        val colUnsel = ContextCompat.getColor(this, R.color.text_secondary)

        tabCallsKeypad.background = if (tabIdx == 0) sel else unsel
        tabCallsKeypad.setTextColor(if (tabIdx == 0) colSel else colUnsel)

        tabCallsRecents.background = if (tabIdx == 1) sel else unsel
        tabCallsRecents.setTextColor(if (tabIdx == 1) colSel else colUnsel)

        tabCallsContacts.background = if (tabIdx == 2) sel else unsel
        tabCallsContacts.setTextColor(if (tabIdx == 2) colSel else colUnsel)

        tabCallsSettings.background = if (tabIdx == 3) sel else unsel
        tabCallsSettings.setTextColor(if (tabIdx == 3) colSel else colUnsel)

        containerCallsKeypadView.visibility = if (tabIdx == 0) View.VISIBLE else View.GONE
        containerCallsRecentsView.visibility = if (tabIdx == 1) View.VISIBLE else View.GONE
        containerCallsContactsView.visibility = if (tabIdx == 2) View.VISIBLE else View.GONE
        containerCallsSettingsView.visibility = if (tabIdx == 3) View.VISIBLE else View.GONE

        when (tabIdx) {
            1 -> renderRecents()
            2 -> renderContacts()
        }
    }

    // =========================================================================
    // Native Dialer Keypad & Real-Time Suggestions
    // =========================================================================

    private fun handleDialerDigit(digit: Char) {
        playToneFeedback(digit)
        if (currentCallState == CallState.CONNECTED || currentCallState == CallState.DIALING) {
            CompanionInCallService.playDtmf(digit)
            inCallDtmfDigits += digit
            tvDialedNumber.text = inCallDtmfDigits
            btnDialerBackspace.visibility = View.VISIBLE
        } else {
            dialedNumber += digit
            updateDialedNumberDisplay()
        }
    }

    private fun updateDialedNumberDisplay() {
        tvDialedNumber.hint = "Enter phone number..."
        tvDialedNumber.text = dialedNumber
        btnDialerBackspace.visibility = if (dialedNumber.isNotEmpty()) View.VISIBLE else View.INVISIBLE

        suggestionsJob?.cancel()
        if (dialedNumber.isNotBlank()) {
            val query = dialedNumber
            suggestionsJob = lifecycleScope.launch {
                val suggestions = withContext(Dispatchers.Default) {
                    val recents = callLogManager.getCallLogs(limit = 20)
                    contactsManager.getSuggestions(query, recents, maxResults = 4)
                }
                if (dialedNumber == query) {
                    renderSuggestions(suggestions)
                }
            }
        } else {
            containerNumberSuggestions.removeAllViews()
            tvSuggestionsPlaceholder?.text = "Enter digits to search contacts & recents"
            tvSuggestionsPlaceholder?.visibility = View.VISIBLE
        }
    }

    private fun renderSuggestions(suggestions: List<NumberSuggestion>) {
        containerNumberSuggestions.removeAllViews()
        if (suggestions.isEmpty()) {
            tvSuggestionsPlaceholder?.text = "No matching contacts found"
            tvSuggestionsPlaceholder?.visibility = View.VISIBLE
            return
        }

        tvSuggestionsPlaceholder?.visibility = View.GONE
        suggestions.forEach { sug ->
            val itemView = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                background = ContextCompat.getDrawable(this@MainActivity, R.drawable.bg_suggestion_item)
                gravity = android.view.Gravity.CENTER_VERTICAL
                setPadding(14, 8, 14, 8)
                isClickable = true
                isFocusable = true
                val lp = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    bottomMargin = 4
                }
                layoutParams = lp
                setOnClickListener {
                    dialedNumber = sug.phoneNumber
                    updateDialedNumberDisplay()
                    initiateOutgoingCellularCall(sug.phoneNumber)
                }
            }

            // Left icon with LRU caching
            val ivIcon = ImageView(this).apply {
                if (sug.source == SuggestionSource.CONTACT) {
                    loadAvatarAsync(sug.photoUri, this, R.drawable.ic_person, R.color.primary)
                } else {
                    setImageResource(R.drawable.ic_history)
                    setColorFilter(ContextCompat.getColor(context, R.color.accent_purple))
                }
                val lp = LinearLayout.LayoutParams(28, 28).apply {
                    marginEnd = 12
                }
                layoutParams = lp
            }
            itemView.addView(ivIcon)

            // Middle: Name & Number
            val colMiddle = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            }

            val tvName = TextView(this).apply {
                text = sug.displayName
                setTextColor(ContextCompat.getColor(context, R.color.text_primary))
                textSize = 13f
                setTypeface(null, Typeface.BOLD)
            }
            colMiddle.addView(tvName)

            val tvNum = TextView(this).apply {
                text = "${sug.phoneNumber}  •  ${sug.typeLabel}"
                setTextColor(ContextCompat.getColor(context, R.color.text_secondary))
                textSize = 11f
            }
            colMiddle.addView(tvNum)
            itemView.addView(colMiddle)

            // Right: 1-Tap Call Action Badge (Contact or Recent)
            val tvBadge = TextView(this).apply {
                text = if (sug.source == SuggestionSource.CONTACT) "Call Contact" else "Call Recent"
                setTextColor(ContextCompat.getColor(context, if (sug.source == SuggestionSource.CONTACT) R.color.primary else R.color.accent_purple))
                textSize = 10f
                setTypeface(null, Typeface.BOLD)
                background = ContextCompat.getDrawable(context, R.drawable.bg_pill_status)
                setPadding(12, 4, 12, 4)
                setOnClickListener {
                    dialedNumber = sug.phoneNumber
                    updateDialedNumberDisplay()
                    initiateOutgoingCellularCall(sug.phoneNumber)
                }
            }
            itemView.addView(tvBadge)

            containerNumberSuggestions.addView(itemView)
        }
    }

    private fun initiateOutgoingCellularCall(phoneNumber: String) {
        val selectedSubId = simManager.getSelectedSubscriptionId()
        NexusApplication.log("INFO", "Dialer", "Placing outgoing cellular call to $phoneNumber on subId $selectedSubId")
        val success = CompanionInCallService.placeOutgoingCall(this, phoneNumber, selectedSubId)
        if (!success) {
            Toast.makeText(this, "Placing call to $phoneNumber via system dialer...", Toast.LENGTH_SHORT).show()
        }
    }

    // =========================================================================
    // Real Recents / Call History Tab
    // =========================================================================

    private fun filterRecents(type: CallLogType?) {
        activeLogFilter = type
        val sel = ContextCompat.getDrawable(this, R.drawable.bg_tab_pill_selected)
        val unsel = ContextCompat.getDrawable(this, R.drawable.bg_tab_pill_unselected)
        val colSel = ContextCompat.getColor(this, R.color.text_primary)
        val colUnsel = ContextCompat.getColor(this, R.color.text_secondary)

        tabRecentsAll.background = if (type == null) sel else unsel
        tabRecentsAll.setTextColor(if (type == null) colSel else colUnsel)

        tabRecentsMissed.background = if (type == CallLogType.MISSED) sel else unsel
        tabRecentsMissed.setTextColor(if (type == CallLogType.MISSED) colSel else colUnsel)

        tabRecentsIncoming.background = if (type == CallLogType.INCOMING) sel else unsel
        tabRecentsIncoming.setTextColor(if (type == CallLogType.INCOMING) colSel else colUnsel)

        tabRecentsOutgoing.background = if (type == CallLogType.OUTGOING) sel else unsel
        tabRecentsOutgoing.setTextColor(if (type == CallLogType.OUTGOING) colSel else colUnsel)

        renderRecents()
    }

    private fun renderRecents() {
        recentsJob?.cancel()
        recentsJob = lifecycleScope.launch {
            val query = recentsSearchQuery
            val filter = activeLogFilter
            val (filteredLogs, counts) = withContext(Dispatchers.IO) {
                val allRawLogs = callLogManager.getCallLogs(null, limit = 100)
                val allCount = allRawLogs.size
                val missedCount = allRawLogs.count { it.type == CallLogType.MISSED }
                val inCount = allRawLogs.count { it.type == CallLogType.INCOMING }
                val outCount = allRawLogs.count { it.type == CallLogType.OUTGOING }

                val filtered = if (filter != null) {
                    allRawLogs.filter { it.type == filter }
                } else {
                    allRawLogs
                }

                val finalLogs = if (query.isBlank()) {
                    filtered
                } else {
                    val q = query.lowercase()
                    val cleanQuery = q.replace(Regex("[^0-9+]"), "")
                    filtered.filter { log ->
                        log.number.lowercase().contains(q) ||
                        (log.contactName?.lowercase()?.contains(q) == true) ||
                        (cleanQuery.isNotEmpty() && log.normalizedNumber.contains(cleanQuery))
                    }
                }
                Pair(finalLogs, listOf(allCount, missedCount, inCount, outCount))
            }

            tabRecentsAll.text = "All (${counts[0]})"
            tabRecentsMissed.text = "Missed (${counts[1]})"
            tabRecentsIncoming.text = "Incoming (${counts[2]})"
            tabRecentsOutgoing.text = "Outgoing (${counts[3]})"

            containerRecentsList.removeAllViews()
            if (filteredLogs.isEmpty()) {
                tvNoRecentsMsg.text = if (query.isNotBlank()) "No calls match \"$query\"" else "No recent calls found."
                tvNoRecentsMsg.visibility = View.VISIBLE
                return@launch
            }
            tvNoRecentsMsg.visibility = View.GONE

            filteredLogs.take(50).forEach { record ->
                val row = buildRecentsRow(record)
                containerRecentsList.addView(row)
            }
        }
    }

    private fun buildRecentsRow(record: CallLogRecord): View {
        val density = resources.displayMetrics.density
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            background = ContextCompat.getDrawable(this@MainActivity, R.drawable.bg_card_subtle)
            gravity = android.view.Gravity.CENTER_VERTICAL
            setPadding((14 * density).toInt(), (10 * density).toInt(), (14 * density).toInt(), (10 * density).toInt())
            isClickable = true
            isFocusable = true
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = (8 * density).toInt()
            }
            layoutParams = lp
            setOnClickListener {
                showCallLogDetailDialog(record)
            }
        }

        // Contact Photo / Avatar
        val ivAvatar = ImageView(this).apply {
            loadAvatarAsync(record.photoUri, this)
            val lp = LinearLayout.LayoutParams((40 * density).toInt(), (40 * density).toInt()).apply {
                marginEnd = (12 * density).toInt()
            }
            layoutParams = lp
        }
        row.addView(ivAvatar)

        // Middle Column: Contact Name, Number, SIM Label, Timestamp
        val colMiddle = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }

        val tvPrimary = TextView(this).apply {
            text = record.contactName ?: record.number
            setTextColor(
                ContextCompat.getColor(
                    context,
                    if (record.type == CallLogType.MISSED) R.color.status_offline else R.color.text_primary
                )
            )
            textSize = 14f
            maxLines = 1
            setTypeface(null, Typeface.BOLD)
        }
        colMiddle.addView(tvPrimary)

        val tvSub = TextView(this).apply {
            val simLabel = if (record.simDisplayName != null) " • ${record.simDisplayName}" else ""
            text = if (record.contactName != null) {
                "${record.number}$simLabel • ${record.formattedTime}"
            } else {
                "${record.formattedTime}$simLabel"
            }
            setTextColor(ContextCompat.getColor(context, R.color.text_secondary))
            textSize = 11f
            maxLines = 1
        }
        colMiddle.addView(tvSub)
        row.addView(colMiddle)

        // Right Column: Direction Icon & Duration (Clean formatted duration with ample space)
        val colRight = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = android.view.Gravity.END
            minimumWidth = (65 * density).toInt()
        }

        val ivDirection = ImageView(this).apply {
            val iconRes = when (record.type) {
                CallLogType.INCOMING -> R.drawable.ic_call_incoming
                CallLogType.OUTGOING -> R.drawable.ic_call_outgoing
                CallLogType.MISSED -> R.drawable.ic_call_missed
            }
            setImageResource(iconRes)
            val lp = LinearLayout.LayoutParams((20 * density).toInt(), (20 * density).toInt()).apply {
                bottomMargin = (2 * density).toInt()
            }
            layoutParams = lp
        }
        colRight.addView(ivDirection)

        val durationStr = when {
            record.type == CallLogType.MISSED -> "Missed"
            record.durationSec == 0L -> "0s"
            record.durationSec < 60L -> "${record.durationSec}s"
            else -> {
                val m = record.durationSec / 60
                val s = record.durationSec % 60
                if (s == 0L) "${m}m" else "${m}m ${s}s"
            }
        }

        val tvDur = TextView(this).apply {
            text = durationStr
            setTextColor(
                ContextCompat.getColor(
                    context,
                    if (record.type == CallLogType.MISSED) R.color.status_offline else R.color.text_muted
                )
            )
            textSize = 11f
            maxLines = 1
            setTypeface(null, Typeface.BOLD)
        }
        colRight.addView(tvDur)
        row.addView(colRight)

        return row
    }

    // =========================================================================
    // Real Contacts Tab
    // =========================================================================

    private fun renderContacts() {
        contactsJob?.cancel()
        contactsJob = lifecycleScope.launch {
            val query = contactsSearchQuery
            val allContacts = withContext(Dispatchers.IO) {
                contactsManager.searchContacts(query)
            }
            tvContactsCountBadge.text = "${allContacts.size} Contacts"

            containerContactsList.removeAllViews()
            if (allContacts.isEmpty()) {
                tvNoContactsMsg.text = if (query.isNotBlank()) {
                    "No contacts match \"$query\""
                } else {
                    "No contacts found on device. Grant READ_CONTACTS permission or add a new contact."
                }
                tvNoContactsMsg.visibility = View.VISIBLE
                return@launch
            }
            tvNoContactsMsg.visibility = View.GONE

            allContacts.take(50).forEach { contact ->
                val row = buildContactRow(contact)
                containerContactsList.addView(row)
            }
        }
    }

    private fun buildContactRow(contact: ContactRecord): View {
        val density = resources.displayMetrics.density
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            background = ContextCompat.getDrawable(this@MainActivity, R.drawable.bg_card_cyber)
            gravity = android.view.Gravity.CENTER_VERTICAL
            setPadding((14 * density).toInt(), (10 * density).toInt(), (14 * density).toInt(), (10 * density).toInt())
            isClickable = true
            isFocusable = true
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = (8 * density).toInt()
            }
            layoutParams = lp
            setOnClickListener {
                val primaryNumber = contact.phoneNumbers.firstOrNull()?.number
                if (primaryNumber != null) {
                    initiateOutgoingCellularCall(primaryNumber)
                }
            }
        }

        // Contact Avatar Photo / Initials
        val ivAvatar = ImageView(this).apply {
            val photoUri = contact.thumbnailUri ?: contact.photoUri
            loadAvatarAsync(photoUri, this)
            val lp = LinearLayout.LayoutParams((40 * density).toInt(), (40 * density).toInt()).apply {
                marginEnd = (12 * density).toInt()
            }
            layoutParams = lp
        }
        row.addView(ivAvatar)

        // Middle: Contact Display Name & Phone Numbers
        val colMiddle = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }

        val rowName = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = android.view.Gravity.CENTER_VERTICAL
        }

        val tvName = TextView(this).apply {
            text = contact.displayName
            setTextColor(ContextCompat.getColor(context, R.color.text_primary))
            textSize = 14f
            setTypeface(null, Typeface.BOLD)
        }
        rowName.addView(tvName)

        if (contact.isStarred) {
            val ivStar = ImageView(this).apply {
                setImageResource(R.drawable.ic_star)
                setColorFilter(ContextCompat.getColor(context, R.color.status_warning))
                val lp = LinearLayout.LayoutParams((16 * density).toInt(), (16 * density).toInt()).apply {
                    marginStart = (6 * density).toInt()
                }
                layoutParams = lp
            }
            rowName.addView(ivStar)
        }
        colMiddle.addView(rowName)

        val primaryPhone = contact.phoneNumbers.firstOrNull()
        val tvPhone = TextView(this).apply {
            text = if (primaryPhone != null) {
                "${primaryPhone.number} • ${primaryPhone.typeLabel}"
            } else {
                "No phone number"
            }
            setTextColor(ContextCompat.getColor(context, R.color.text_secondary))
            textSize = 11f
        }
        colMiddle.addView(tvPhone)
        row.addView(colMiddle)

        // Right: Call Quick Action Button (Padded and Never Clipped)
        val btnCall = ImageButton(this).apply {
            setImageResource(R.drawable.ic_phone)
            background = ContextCompat.getDrawable(context, R.drawable.bg_btn_circle_action)
            setColorFilter(ContextCompat.getColor(context, R.color.text_primary))
            val btnSize = (40 * density).toInt()
            val lp = LinearLayout.LayoutParams(btnSize, btnSize).apply {
                marginStart = (8 * density).toInt()
                marginEnd = (2 * density).toInt()
            }
            layoutParams = lp
            setPadding((10 * density).toInt(), (10 * density).toInt(), (10 * density).toInt(), (10 * density).toInt())
            setOnClickListener {
                val primaryNumber = contact.phoneNumbers.firstOrNull()?.number
                if (primaryNumber != null) {
                    initiateOutgoingCellularCall(primaryNumber)
                }
            }
        }
        row.addView(btnCall)

        return row
    }

    // =========================================================================
    // Service Listeners
    // =========================================================================

    private fun setupServiceListeners() {
        CompanionInCallService.onCallSessionChanged = { session ->
            runOnUiThread { handleCallSessionChange(session) }
        }
        CompanionInCallService.onAudioStateChanged = { audioState ->
            runOnUiThread {
                isMuted = audioState.isMuted
                isSpeakerOn = audioState.route == CallAudioState.ROUTE_SPEAKER
                btnCallMute.setImageResource(if (isMuted) R.drawable.ic_mic_off else R.drawable.ic_mic)
                btnCallMute.setBackgroundResource(if (isMuted) R.drawable.bg_btn_circle_active else R.drawable.bg_btn_circle_action)
                btnCallSpeaker.setBackgroundResource(if (isSpeakerOn) R.drawable.bg_btn_circle_active else R.drawable.bg_btn_circle_action)
            }
        }
    }

    // =========================================================================
    // Permission & Access Center
    // =========================================================================

    data class Capability(
        val name: String,
        val isGranted: Boolean,
        val statusLabel: String,
        val actionText: String?,
        val onAction: () -> Unit
    )

    private fun isPermGranted(permission: String): Boolean {
        return ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED
    }

    private fun isNotificationsGranted(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            isPermGranted(Manifest.permission.POST_NOTIFICATIONS)
        } else {
            NotificationManagerCompat.from(this).areNotificationsEnabled()
        }
    }

    private fun isDialerRoleGranted(): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val rm = getSystemService(Context.ROLE_SERVICE) as? RoleManager
            if (rm != null && rm.isRoleAvailable(RoleManager.ROLE_DIALER)) {
                return rm.isRoleHeld(RoleManager.ROLE_DIALER)
            }
        }
        val telecom = getSystemService(Context.TELECOM_SERVICE) as? TelecomManager
        return telecom?.defaultDialerPackage == packageName
    }

    private fun isCallScreeningRoleGranted(): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val rm = getSystemService(Context.ROLE_SERVICE) as? RoleManager
            if (rm != null && rm.isRoleAvailable(RoleManager.ROLE_CALL_SCREENING)) {
                return rm.isRoleHeld(RoleManager.ROLE_CALL_SCREENING)
            }
        }
        return false
    }

    private fun isBatteryOptimizationExempt(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val pm = getSystemService(Context.POWER_SERVICE) as? PowerManager
            pm?.isIgnoringBatteryOptimizations(packageName) == true
        } else {
            true
        }
    }

    private fun getCapabilitiesList(): List<Capability> {
        val list = mutableListOf<Capability>()

        // 1. Phone State
        val sState = isPermGranted(Manifest.permission.READ_PHONE_STATE)
        list.add(
            Capability(
                name = "Phone State",
                isGranted = sState,
                statusLabel = if (sState) "✓ Granted" else "✕ Not Granted",
                actionText = if (sState) null else "Enable",
                onAction = { singlePermissionLauncher.launch(Manifest.permission.READ_PHONE_STATE) }
            )
        )

        // 2. Phone Number
        val sNum = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            isPermGranted(Manifest.permission.READ_PHONE_NUMBERS)
        } else {
            isPermGranted(Manifest.permission.READ_PHONE_STATE)
        }
        list.add(
            Capability(
                name = "Phone Number",
                isGranted = sNum,
                statusLabel = if (sNum) "✓ Granted" else "✕ Not Granted",
                actionText = if (sNum) null else "Enable",
                onAction = {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        singlePermissionLauncher.launch(Manifest.permission.READ_PHONE_NUMBERS)
                    } else {
                        singlePermissionLauncher.launch(Manifest.permission.READ_PHONE_STATE)
                    }
                }
            )
        )

        // 3. Answer Calls
        val sAns = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            isPermGranted(Manifest.permission.ANSWER_PHONE_CALLS)
        } else {
            true
        }
        list.add(
            Capability(
                name = "Answer Calls",
                isGranted = sAns,
                statusLabel = if (sAns) "✓ Granted" else "✕ Not Granted",
                actionText = if (sAns) null else "Enable",
                onAction = {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        singlePermissionLauncher.launch(Manifest.permission.ANSWER_PHONE_CALLS)
                    }
                }
            )
        )

        // 4. Make Calls
        val sCall = isPermGranted(Manifest.permission.CALL_PHONE)
        list.add(
            Capability(
                name = "Make Calls",
                isGranted = sCall,
                statusLabel = if (sCall) "✓ Granted" else "✕ Not Granted",
                actionText = if (sCall) null else "Enable",
                onAction = { singlePermissionLauncher.launch(Manifest.permission.CALL_PHONE) }
            )
        )

        // 5. Call Log
        val sLog = isPermGranted(Manifest.permission.READ_CALL_LOG)
        list.add(
            Capability(
                name = "Call Log",
                isGranted = sLog,
                statusLabel = if (sLog) "✓ Granted" else "✕ Not Granted",
                actionText = if (sLog) null else "Enable",
                onAction = { singlePermissionLauncher.launch(Manifest.permission.READ_CALL_LOG) }
            )
        )

        // 6. Contacts (for real contact names & photos)
        val sContacts = isPermGranted(Manifest.permission.READ_CONTACTS)
        list.add(
            Capability(
                name = "Contacts Resolution",
                isGranted = sContacts,
                statusLabel = if (sContacts) "✓ Granted" else "✕ Not Granted",
                actionText = if (sContacts) null else "Enable",
                onAction = { singlePermissionLauncher.launch(Manifest.permission.READ_CONTACTS) }
            )
        )

        // 7. Microphone
        val sMic = isPermGranted(Manifest.permission.RECORD_AUDIO)
        list.add(
            Capability(
                name = "Microphone",
                isGranted = sMic,
                statusLabel = if (sMic) "✓ Granted" else "✕ Not Granted",
                actionText = if (sMic) null else "Enable",
                onAction = { singlePermissionLauncher.launch(Manifest.permission.RECORD_AUDIO) }
            )
        )

        // 8. Notifications
        val sNotif = isNotificationsGranted()
        list.add(
            Capability(
                name = "Notifications",
                isGranted = sNotif,
                statusLabel = if (sNotif) "✓ Granted" else "✕ Not Granted",
                actionText = if (sNotif) null else "Enable",
                onAction = {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        singlePermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                    } else {
                        val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                            putExtra(Settings.EXTRA_APP_PACKAGE, packageName)
                        }
                        startActivity(intent)
                    }
                }
            )
        )

        // 9. Default Dialer / Phone Role
        val sDialerRole = isDialerRoleGranted()
        list.add(
            Capability(
                name = "Default Dialer / Phone Role",
                isGranted = sDialerRole,
                statusLabel = if (sDialerRole) "✓ Granted" else "✕ Role Required",
                actionText = if (sDialerRole) null else "Set Role",
                onAction = { promptDefaultDialerRole() }
            )
        )

        // 10. Call Screening / Caller ID Role (API 29+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val rm = getSystemService(Context.ROLE_SERVICE) as? RoleManager
            if (rm != null && rm.isRoleAvailable(RoleManager.ROLE_CALL_SCREENING)) {
                val sScreeningRole = isCallScreeningRoleGranted()
                list.add(
                    Capability(
                        name = "Call Screening / Caller ID",
                        isGranted = sScreeningRole,
                        statusLabel = if (sScreeningRole) "✓ Granted" else "✕ Role Required",
                        actionText = if (sScreeningRole) null else "Set Role",
                        onAction = { promptCallScreeningRole() }
                    )
                )
            }
        }

        // 11. Battery Optimization
        val sBatt = isBatteryOptimizationExempt()
        list.add(
            Capability(
                name = "Battery Optimization",
                isGranted = sBatt,
                statusLabel = if (sBatt) "✓ Granted" else "✕ Setting Required",
                actionText = if (sBatt) null else "Exempt",
                onAction = { requestIgnoreBatteryOptimization() }
            )
        )

        return list
    }

    private fun auditPermissions() {
        val capabilities = getCapabilitiesList()
        val grantedCount = capabilities.count { it.isGranted }
        val totalCount = capabilities.size

        tvPermissionsCount.text = "$grantedCount of $totalCount Granted"
        tvPermissionsCount.setTextColor(
            ContextCompat.getColor(
                this,
                if (grantedCount == totalCount) R.color.status_online else R.color.status_warning
            )
        )

        tvPermissionDetailsToggleLabel.text = if (isPermissionDetailsExpanded) {
            "Detailed Capabilities ($totalCount applicable) ▾"
        } else {
            "Detailed Capabilities ($totalCount applicable) ▸"
        }

        containerPermissionDetails.removeAllViews()
        capabilities.forEach { cap ->
            val row = buildCapabilityRow(cap)
            containerPermissionDetails.addView(row)
        }
    }

    private fun buildCapabilityRow(cap: Capability): View {
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = android.view.Gravity.CENTER_VERTICAL
            setPadding(16, 12, 16, 12)
            background = ContextCompat.getDrawable(this@MainActivity, R.drawable.bg_card_cyber)
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = 8
            }
            layoutParams = lp
        }

        // Left: Capability Name
        val tvName = TextView(this).apply {
            text = cap.name
            setTextColor(ContextCompat.getColor(context, R.color.text_primary))
            textSize = 12f
            setTypeface(null, Typeface.BOLD)
            val lp = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1.1f)
            layoutParams = lp
        }
        row.addView(tvName)

        // Middle: Status Badge
        val tvStatus = TextView(this).apply {
            text = cap.statusLabel
            textSize = 10f
            setTypeface(null, Typeface.BOLD)
            val col = when {
                cap.isGranted -> ContextCompat.getColor(context, R.color.status_online)
                cap.statusLabel.contains("Role") || cap.statusLabel.contains("Setting") -> ContextCompat.getColor(context, R.color.status_warning)
                else -> ContextCompat.getColor(context, R.color.status_offline)
            }
            setTextColor(col)
            background = ContextCompat.getDrawable(context, R.drawable.bg_pill_status)
            setPadding(16, 6, 16, 6)
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                marginEnd = 10
            }
            layoutParams = lp
        }
        row.addView(tvStatus)

        // Right: Action button or check icon
        if (cap.actionText != null) {
            val btnAction = Button(this).apply {
                text = cap.actionText
                textSize = 10f
                setTypeface(null, Typeface.BOLD)
                setTextColor(ContextCompat.getColor(context, R.color.primary))
                background = ContextCompat.getDrawable(context, R.drawable.bg_btn_secondary)
                setPadding(18, 0, 18, 0)
                val lp = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    80
                )
                layoutParams = lp
                setOnClickListener { cap.onAction() }
            }
            row.addView(btnAction)
        } else {
            val ivCheck = ImageView(this).apply {
                setImageResource(R.drawable.ic_check_circle)
                setColorFilter(ContextCompat.getColor(context, R.color.status_online))
                val lp = LinearLayout.LayoutParams(48, 48)
                layoutParams = lp
            }
            row.addView(ivCheck)
        }

        return row
    }

    private fun executeMasterGrantAllFlow() {
        NexusApplication.log("INFO", "Permissions", "Executing Master Enable All Required Access flow...")

        val ungrantedPerms = mutableListOf<String>()
        if (!isPermGranted(Manifest.permission.READ_PHONE_STATE)) {
            ungrantedPerms.add(Manifest.permission.READ_PHONE_STATE)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (!isPermGranted(Manifest.permission.READ_PHONE_NUMBERS)) {
                ungrantedPerms.add(Manifest.permission.READ_PHONE_NUMBERS)
            }
            if (!isPermGranted(Manifest.permission.ANSWER_PHONE_CALLS)) {
                ungrantedPerms.add(Manifest.permission.ANSWER_PHONE_CALLS)
            }
        }
        if (!isPermGranted(Manifest.permission.CALL_PHONE)) {
            ungrantedPerms.add(Manifest.permission.CALL_PHONE)
        }
        if (!isPermGranted(Manifest.permission.READ_CALL_LOG)) {
            ungrantedPerms.add(Manifest.permission.READ_CALL_LOG)
        }
        if (!isPermGranted(Manifest.permission.READ_CONTACTS)) {
            ungrantedPerms.add(Manifest.permission.READ_CONTACTS)
        }
        if (!isPermGranted(Manifest.permission.RECORD_AUDIO)) {
            ungrantedPerms.add(Manifest.permission.RECORD_AUDIO)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (!isPermGranted(Manifest.permission.POST_NOTIFICATIONS)) {
                ungrantedPerms.add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        isMasterGrantAllRunning = true

        if (ungrantedPerms.isNotEmpty()) {
            permissionLauncher.launch(ungrantedPerms.toTypedArray())
        } else if (!isDialerRoleGranted()) {
            promptDefaultDialerRole()
        } else if (!isBatteryOptimizationExempt()) {
            requestIgnoreBatteryOptimization()
            isMasterGrantAllRunning = false
        } else {
            isMasterGrantAllRunning = false
            Toast.makeText(this, "All permissions and phone roles already granted!", Toast.LENGTH_SHORT).show()
        }
    }

    private fun showRingtoneSelectorDialog() {
        val telPrefs = getSharedPreferences(PREFS_TELEPHONY, Context.MODE_PRIVATE)
        val currentUriStr = telPrefs.getString("incoming_ringtone_uri", null)
        val currentName = telPrefs.getString("incoming_ringtone_name", "System Default")

        val options = arrayOf(
            "System Default Ringtone",
            "Choose Custom Ringtone from Device...",
            "Test / Preview Selected Ringtone"
        )

        AlertDialog.Builder(this)
            .setTitle("Incoming Call Ringtone")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> {
                        telPrefs.edit()
                            .remove("incoming_ringtone_uri")
                            .putString("incoming_ringtone_name", "System Default")
                            .apply()
                        tvRingtoneVal.text = "System Default ›"
                        Toast.makeText(this, "Set to System Default Ringtone", Toast.LENGTH_SHORT).show()
                    }
                    1 -> {
                        val intent = Intent(RingtoneManager.ACTION_RINGTONE_PICKER).apply {
                            putExtra(RingtoneManager.EXTRA_RINGTONE_TYPE, RingtoneManager.TYPE_RINGTONE)
                            putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_DEFAULT, true)
                            putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_SILENT, false)
                            putExtra(RingtoneManager.EXTRA_RINGTONE_TITLE, "Select Incoming Call Ringtone")
                            if (!currentUriStr.isNullOrBlank()) {
                                putExtra(RingtoneManager.EXTRA_RINGTONE_EXISTING_URI, Uri.parse(currentUriStr))
                            }
                        }
                        try {
                            ringtonePickerLauncher.launch(intent)
                        } catch (e: Exception) {
                            Toast.makeText(this, "Could not open ringtone picker: ${e.message}", Toast.LENGTH_SHORT).show()
                        }
                    }
                    2 -> {
                        val uri = if (!currentUriStr.isNullOrBlank()) {
                            Uri.parse(currentUriStr)
                        } else {
                            RingtoneManager.getActualDefaultRingtoneUri(this, RingtoneManager.TYPE_RINGTONE)
                                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
                        }
                        try {
                            val ringtone = RingtoneManager.getRingtone(this, uri)
                            if (ringtone.isPlaying) {
                                ringtone.stop()
                            } else {
                                ringtone.play()
                                mainHandler.postDelayed({ ringtone.stop() }, 4000L)
                            }
                        } catch (e: Exception) {
                            Toast.makeText(this, "Preview error: ${e.message}", Toast.LENGTH_SHORT).show()
                        }
                    }
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showRevokeGuidanceDialog() {
        val grantedList = getCapabilitiesList().filter { it.isGranted }.map { it.name }
        val listStr = if (grantedList.isNotEmpty()) {
            "Currently Granted Capabilities:\n• " + grantedList.joinToString("\n• ")
        } else {
            "No capabilities are currently granted."
        }

        AlertDialog.Builder(this)
            .setTitle("Disable / Revoke Permissions")
            .setMessage(
                "Android security architecture does not permit applications to revoke permissions programmatically. Capabilities must be revoked directly within Android System Settings.\n\n" +
                "$listStr\n\n" +
                "To revoke any capability:\n" +
                "1. Tap 'Open App Info' below to enter Android System Settings.\n" +
                "2. Tap 'Permissions' and set desired capabilities to 'Don't allow'.\n" +
                "3. To change phone/dialer role, check 'Default apps' in system settings.\n\n" +
                "When you return to Create Call, the Permission Center will refresh automatically."
            )
            .setPositiveButton("Open App Info") { _, _ ->
                val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.parse("package:$packageName")
                }
                startActivity(intent)
            }
            .setNeutralButton("Battery Settings") { _, _ ->
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    try {
                        startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
                    } catch (e: Exception) {
                        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                            data = Uri.parse("package:$packageName")
                        }
                        startActivity(intent)
                    }
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun promptDefaultDialerRole() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = getSystemService(Context.ROLE_SERVICE) as? RoleManager
            if (roleManager != null && roleManager.isRoleAvailable(RoleManager.ROLE_DIALER)) {
                val intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_DIALER)
                dialerRoleLauncher.launch(intent)
                return
            }
        }

        val telecom = getSystemService(Context.TELECOM_SERVICE) as? TelecomManager
        if (telecom != null) {
            val intent = Intent(TelecomManager.ACTION_CHANGE_DEFAULT_DIALER).apply {
                putExtra(TelecomManager.EXTRA_CHANGE_DEFAULT_DIALER_PACKAGE_NAME, packageName)
            }
            try {
                dialerRoleLauncher.launch(intent)
            } catch (e: Exception) {
                NexusApplication.log("WARN", "Permissions", "Could not open default dialer settings: ${e.message}")
            }
        }
    }

    private fun promptCallScreeningRole() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = getSystemService(Context.ROLE_SERVICE) as? RoleManager
            if (roleManager != null && roleManager.isRoleAvailable(RoleManager.ROLE_CALL_SCREENING)) {
                val intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_CALL_SCREENING)
                screeningRoleLauncher.launch(intent)
                return
            }
        }
        Toast.makeText(this, "Call Screening Role is not supported on this Android device.", Toast.LENGTH_SHORT).show()
    }

    @SuppressLint("BatteryLife")
    private fun requestIgnoreBatteryOptimization() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val powerManager = getSystemService(Context.POWER_SERVICE) as? PowerManager
            if (powerManager != null && !powerManager.isIgnoringBatteryOptimizations(packageName)) {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:$packageName")
                }
                try {
                    startActivity(intent)
                } catch (e: Exception) {
                    NexusApplication.log("WARN", "Settings", "Battery opt intent error: ${e.message}")
                }
            }
        }
    }

    // =========================================================================
    // Hardware Telemetry & Dashboard Data Binding
    // =========================================================================

    private fun updatePresetButtonsHighlight(isCloud: Boolean) {
        val colSecondary = ContextCompat.getColor(this, R.color.text_secondary)
        val bgActive = ContextCompat.getDrawable(this, R.drawable.bg_btn_gradient_primary)
        val bgInactive = ContextCompat.getDrawable(this, R.drawable.bg_btn_secondary)

        if (isCloud) {
            btnPresetCloud.background = bgActive
            btnPresetCloud.setTextColor(ContextCompat.getColor(this, R.color.text_inverse))
            btnPresetLocal.background = bgInactive
            btnPresetLocal.setTextColor(colSecondary)
        } else {
            btnPresetLocal.background = bgActive
            btnPresetLocal.setTextColor(ContextCompat.getColor(this, R.color.text_inverse))
            btnPresetCloud.background = bgInactive
            btnPresetCloud.setTextColor(colSecondary)
        }
    }

    private fun bindInitialHardwareData() {
        val snapshot = telemetryManager.getSnapshot()
        bindTelemetry(snapshot)
        refreshSimCards()

        val telPrefs = getSharedPreferences(PREFS_TELEPHONY, Context.MODE_PRIVATE)
        val savedDelay = telPrefs.getInt("auto_answer_delay_sec", 3)
        highlightDelayButton(savedDelay)
        switchAutoAnswer.isChecked = telPrefs.getBoolean("auto_answer_enabled", true)
        switchAutoRejectUnknown.isChecked = telPrefs.getBoolean("auto_reject_unknown", false)
        tvRingTimeout.text = telPrefs.getString("ring_timeout", "30 seconds ▾") ?: "30 seconds ▾"
        val savedRingtoneName = telPrefs.getString("incoming_ringtone_name", "System Default")
        tvRingtoneVal.text = "$savedRingtoneName ›"

        val devPrefs = getSharedPreferences(PREFS_DEVICE, Context.MODE_PRIVATE)
        val savedUrl = devPrefs.getString("server_url", DEFAULT_CLOUD_URL) ?: DEFAULT_CLOUD_URL
        val cleanSavedUrl = savedUrl.replace(Regex("^(ws|wss|http|https):/+(.*)$")) { "${it.groupValues[1]}://${it.groupValues[2]}" }
        etServerUrl.setText(cleanSavedUrl)
        val isCloud = cleanSavedUrl.contains(".trycloudflare.com") || cleanSavedUrl.startsWith("wss://")
        updatePresetButtonsHighlight(isCloud)
    }

    private fun bindTelemetry(t: DeviceTelemetry) {
        tvDashDeviceModel.text = "${t.manufacturer} ${t.model}"
        tvDashAndroidVersion.text = t.osVersion
        tvDashDeviceId.text = t.deviceId
        tvDashBattery.text = "${t.batteryLevel}%"
        tvDashCharging.text = if (t.isCharging) "⚡ Charging" else "Discharging"
        tvDashSignalDbm.text = "${t.signalDbm} dBm"
        tvDashCarrier.text = t.carrierName
        tvDashNetworkType.text = t.networkType
        tvDashLatency.text = "${t.latencyMs} ms"
    }

    private fun refreshAllData() {
        val snapshot = telemetryManager.getSnapshot()
        bindTelemetry(snapshot)
        refreshSimCards()
    }

    private fun handleConnectionStateTransition(state: CallBridgeForegroundService.ConnectionState, reason: String?) {
        when (state) {
            CallBridgeForegroundService.ConnectionState.CONNECTED -> {
                if (sessionStartTimeMs == 0L) {
                    sessionStartTimeMs = System.currentTimeMillis()
                    NexusApplication.log("INFO", "Session", "Gateway session started at $sessionStartTimeMs")
                }
            }
            CallBridgeForegroundService.ConnectionState.DISCONNECTED,
            CallBridgeForegroundService.ConnectionState.ERROR -> {
                if (sessionStartTimeMs > 0L) {
                    val endMs = System.currentTimeMillis()
                    val durSec = (endMs - sessionStartTimeMs) / 1000L
                    val session = GatewaySession(
                        sessionId = "sess_${sessionStartTimeMs}",
                        deviceId = telemetryManager.getSnapshot().deviceId,
                        connectedAt = sessionStartTimeMs,
                        disconnectedAt = endMs,
                        durationSeconds = durSec,
                        status = state.name,
                        disconnectReason = reason ?: "User Disconnected"
                    )
                    sessionHistory.add(0, session)
                    savePersistedSessionHistory()
                    NexusApplication.log("INFO", "Session", "Gateway session finalized: ${durSec}s ($reason)")
                    sessionStartTimeMs = 0L
                }
                tvDashUptime.text = "00:00:00"
            }
            CallBridgeForegroundService.ConnectionState.CONNECTING -> {
                tvDashUptime.text = "00:00:00"
            }
        }
    }

    private fun updateTickers() {
        // Active Gateway Connection Timer
        if (CallBridgeForegroundService.connectionState == CallBridgeForegroundService.ConnectionState.CONNECTED && sessionStartTimeMs > 0L) {
            val sec = (System.currentTimeMillis() - sessionStartTimeMs) / 1000L
            val h = sec / 3600
            val m = (sec % 3600) / 60
            val s = sec % 60
            tvDashUptime.text = String.format(Locale.US, "%02d:%02d:%02d", h, m, s)
        } else if (CallBridgeForegroundService.connectionState != CallBridgeForegroundService.ConnectionState.CONNECTED) {
            tvDashUptime.text = "00:00:00"
        }

        // Active Call Duration Timer
        if (currentCallState == CallState.CONNECTED && callStartTimestamp > 0) {
            val callSec = (System.currentTimeMillis() - callStartTimestamp) / 1000L
            val cm = callSec / 60
            val cs = callSec % 60
            tvCallDuration.text = String.format(Locale.US, "%02d:%02d", cm, cs)
        }
    }

    private fun startTicker() {
        mainHandler.post(tickerRunnable)
    }

    private fun stopTicker() {
        mainHandler.removeCallbacks(tickerRunnable)
    }

    // =========================================================================
    // Multi-SIM, eSIM & Preferences Management (3 Distinct Tabs)
    // =========================================================================

    private fun highlightSimTab(tabIdx: Int) {
        val sel = ContextCompat.getDrawable(this, R.drawable.bg_tab_pill_selected)
        val unsel = ContextCompat.getDrawable(this, R.drawable.bg_tab_pill_unselected)
        val colSel = ContextCompat.getColor(this, R.color.text_primary)
        val colUnsel = ContextCompat.getColor(this, R.color.text_secondary)

        tabSimCards.background = if (tabIdx == 0) sel else unsel
        tabSimCards.setTextColor(if (tabIdx == 0) colSel else colUnsel)

        tabEsimProfiles.background = if (tabIdx == 1) sel else unsel
        tabEsimProfiles.setTextColor(if (tabIdx == 1) colSel else colUnsel)

        tabSimPreference.background = if (tabIdx == 2) sel else unsel
        tabSimPreference.setTextColor(if (tabIdx == 2) colSel else colUnsel)
    }

    private fun refreshSimCards() {
        containerSimCards.removeAllViews()
        val allSubscriptions = simManager.getActiveSubscriptions()
        val selectedSubId = simManager.getSelectedSubscriptionId()

        when (selectedSimTab) {
            0 -> {
                // Tab 1: Physical SIMs
                val physicalSims = allSubscriptions.filter { !it.isEsim }
                tvSimCountBadge.text = "${physicalSims.size} Physical"
                btnSetDefaultSim.visibility = View.VISIBLE

                if (physicalSims.isEmpty()) {
                    tvNoSimMsg.text = "No physical SIM cards detected in device slots."
                    tvNoSimMsg.visibility = View.VISIBLE
                    return
                }
                tvNoSimMsg.visibility = View.GONE

                physicalSims.forEach { sub ->
                    val cardView = buildSimCardView(sub, sub.subId == selectedSubId)
                    containerSimCards.addView(cardView)
                }
            }
            1 -> {
                // Tab 2: eSIM Profiles
                val esimProfiles = allSubscriptions.filter { it.isEsim }
                tvSimCountBadge.text = "${esimProfiles.size} eSIM"
                btnSetDefaultSim.visibility = if (esimProfiles.isNotEmpty()) View.VISIBLE else View.GONE

                if (esimProfiles.isEmpty()) {
                    tvNoSimMsg.visibility = View.GONE
                    val emptyCard = buildEsimEmptyStateView()
                    containerSimCards.addView(emptyCard)
                    return
                }
                tvNoSimMsg.visibility = View.GONE

                esimProfiles.forEach { sub ->
                    val cardView = buildSimCardView(sub, sub.subId == selectedSubId)
                    containerSimCards.addView(cardView)
                }
            }
            2 -> {
                // Tab 3: Telephony & SIM Preferences
                tvSimCountBadge.text = "Preferences"
                tvNoSimMsg.visibility = View.GONE
                btnSetDefaultSim.visibility = View.GONE
                val prefCard = buildSimPreferencesView(allSubscriptions, selectedSubId)
                containerSimCards.addView(prefCard)
            }
        }
    }

    private fun buildSimCardView(sub: SimSubscriptionInfo, isSelected: Boolean): View {
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = ContextCompat.getDrawable(
                this@MainActivity,
                if (isSelected) R.drawable.bg_card_cyber_selected else R.drawable.bg_card_cyber
            )
            setPadding(28, 20, 28, 20)
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = 14
            }
            layoutParams = lp
            isClickable = true
            isFocusable = true
            setOnClickListener {
                simManager.setSelectedSubscriptionId(sub.subId)
                refreshSimCards()
                Toast.makeText(this@MainActivity, "Selected for calling: ${sub.displayName}", Toast.LENGTH_SHORT).show()
            }
        }

        // Top Row: SIM Slot / Type + Active Status Badge
        val topRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = android.view.Gravity.CENTER_VERTICAL
        }

        val tvSlotType = TextView(this).apply {
            val simType = if (sub.isEsim) "eSIM Profile" else "Physical SIM Slot ${sub.slotIndex + 1}"
            text = simType
            setTextColor(ContextCompat.getColor(context, R.color.primary))
            textSize = 12f
            setTypeface(null, Typeface.BOLD)
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }
        topRow.addView(tvSlotType)

        val tvStatus = TextView(this).apply {
            text = if (isSelected) "● ACTIVE CALLING LINE" else "● STANDBY"
            setTextColor(
                ContextCompat.getColor(
                    context,
                    if (isSelected) R.color.status_online else R.color.text_muted
                )
            )
            textSize = 10f
            setTypeface(null, Typeface.BOLD)
            background = ContextCompat.getDrawable(context, R.drawable.bg_pill_status)
            setPadding(14, 5, 14, 5)
        }
        topRow.addView(tvStatus)
        card.addView(topRow)

        // Carrier & Display Name
        val tvCarrierName = TextView(this).apply {
            text = "${sub.displayName} (${sub.carrierName})"
            setTextColor(ContextCompat.getColor(context, R.color.text_primary))
            textSize = 15f
            setTypeface(null, Typeface.BOLD)
            setPadding(0, 6, 0, 2)
        }
        card.addView(tvCarrierName)

        // Phone Number / MSISDN (Never fabricate)
        val tvNumber = TextView(this).apply {
            text = if (!sub.number.isNullOrBlank()) "MSISDN: ${sub.number}" else "Number unavailable"
            setTextColor(ContextCompat.getColor(context, if (!sub.number.isNullOrBlank()) R.color.accent_cyan else R.color.text_muted))
            textSize = 12f
            setPadding(0, 0, 0, 6)
        }
        card.addView(tvNumber)

        // Technical Specs Grid
        val specsGrid = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = ContextCompat.getDrawable(context, R.drawable.bg_metric_tile)
            setPadding(14, 10, 14, 10)
        }

        fun addSpec(label: String, value: String) {
            val r = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                val lp2 = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply {
                    bottomMargin = 3
                }
                layoutParams = lp2
            }
            val l = TextView(this).apply {
                text = label
                setTextColor(ContextCompat.getColor(context, R.color.text_muted))
                textSize = 10f
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1.2f)
            }
            val v = TextView(this).apply {
                text = value
                setTextColor(ContextCompat.getColor(context, R.color.text_primary))
                textSize = 10f
                setTypeface(null, Typeface.BOLD)
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            }
            r.addView(l)
            r.addView(v)
            specsGrid.addView(r)
        }

        addSpec("Subscription ID:", "#${sub.subId}")
        val mccStr = if (sub.mcc != null && sub.mnc != null) "${sub.mcc} / ${sub.mnc}" else "Auto (${sub.countryIso.uppercase()})"
        addSpec("MCC / MNC / ISO:", mccStr)
        addSpec("Data Roaming:", if (sub.isRoaming) "Active (Roaming)" else "Disabled (Home)")
        val defaults = mutableListOf<String>()
        if (sub.isDefaultVoice) defaults.add("Voice")
        if (sub.isDefaultData) defaults.add("Data")
        if (sub.isDefaultSms) defaults.add("SMS")
        addSpec("Default Preferences:", if (defaults.isNotEmpty()) defaults.joinToString(", ") else "None")

        card.addView(specsGrid)
        return card
    }

    private fun buildEsimEmptyStateView(): View {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = ContextCompat.getDrawable(this@MainActivity, R.drawable.bg_card_cyber)
            setPadding(32, 32, 32, 32)
            gravity = android.view.Gravity.CENTER_HORIZONTAL
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = 14
            }
            layoutParams = lp

            val title = TextView(context).apply {
                text = "No eSIM Profiles Detected"
                setTextColor(ContextCompat.getColor(context, R.color.text_primary))
                textSize = 14f
                setTypeface(null, Typeface.BOLD)
                gravity = android.view.Gravity.CENTER
            }
            addView(title)

            val desc = TextView(context).apply {
                text = "No eSIM profile detected on device. Physical SIM is not an eSIM and operates via dedicated hardware slot."
                setTextColor(ContextCompat.getColor(context, R.color.text_secondary))
                textSize = 12f
                gravity = android.view.Gravity.CENTER
                setPadding(0, 8, 0, 0)
            }
            addView(desc)
        }
    }

    private fun buildSimPreferencesView(subs: List<SimSubscriptionInfo>, selectedSubId: Int): View {
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = ContextCompat.getDrawable(this@MainActivity, R.drawable.bg_card_cyber)
            setPadding(32, 24, 32, 24)
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = 14
            }
            layoutParams = lp
        }

        val title = TextView(this).apply {
            text = "Telephony Line Preferences"
            setTextColor(ContextCompat.getColor(context, R.color.text_primary))
            textSize = 14f
            setTypeface(null, Typeface.BOLD)
            setPadding(0, 0, 0, 16)
        }
        card.addView(title)

        fun addPrefRow(label: String, value: String) {
            val row = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    bottomMargin = 8
                }
            }
            val l = TextView(this).apply {
                text = label
                setTextColor(ContextCompat.getColor(context, R.color.text_secondary))
                textSize = 12f
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1.2f)
            }
            val v = TextView(this).apply {
                text = value
                setTextColor(ContextCompat.getColor(context, R.color.text_primary))
                textSize = 12f
                setTypeface(null, Typeface.BOLD)
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            }
            row.addView(l)
            row.addView(v)
            card.addView(row)
        }

        val defaultVoiceId = simManager.getDefaultVoiceSubscriptionId()
        val defaultDataId = simManager.getDefaultDataSubscriptionId()
        val defaultSmsId = simManager.getDefaultSmsSubscriptionId()

        val voiceSub = subs.find { it.subId == defaultVoiceId }?.displayName ?: if (defaultVoiceId != -1) "Subscription #$defaultVoiceId" else "Ask Every Time / Default"
        val dataSub = subs.find { it.subId == defaultDataId }?.displayName ?: if (defaultDataId != -1) "Subscription #$defaultDataId" else "Default SIM"
        val smsSub = subs.find { it.subId == defaultSmsId }?.displayName ?: if (defaultSmsId != -1) "Subscription #$defaultSmsId" else "Default SIM"
        val activeSub = subs.find { it.subId == selectedSubId }?.displayName ?: "SIM Slot 1 (Default)"

        addPrefRow("Active Gateway Calling SIM:", activeSub)
        addPrefRow("Android Default Voice SIM:", voiceSub)
        addPrefRow("Android Default Data SIM:", dataSub)
        addPrefRow("Android Default SMS SIM:", smsSub)

        val btnOpenSettings = Button(this).apply {
            text = "Configure Telephony in Android Settings"
            background = ContextCompat.getDrawable(context, R.drawable.bg_btn_secondary)
            setTextColor(ContextCompat.getColor(context, R.color.primary))
            textSize = 12f
            setTypeface(null, Typeface.BOLD)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = 16
            }
            setOnClickListener {
                try {
                    startActivity(Intent(Settings.ACTION_NETWORK_OPERATOR_SETTINGS))
                } catch (e: Exception) {
                    try {
                        startActivity(Intent(Settings.ACTION_WIRELESS_SETTINGS))
                    } catch (e2: Exception) {
                        startActivity(Intent(Settings.ACTION_SETTINGS))
                    }
                }
            }
        }
        card.addView(btnOpenSettings)

        return card
    }

    // =========================================================================
    // Call Session & State Management
    // =========================================================================

    private fun handleCallSessionChange(session: CallSession) {
        currentCallState = session.state
        val number = session.callerNumber ?: "Unknown Caller"
        val resolvedName = contactsManager.resolveContactName(number) ?: session.callerName
        val photoUri = session.contactPhotoUri ?: contactsManager.resolveContactPhotoUri(number)

        // Set avatar photo asynchronously with caching
        loadAvatarAsync(photoUri, ivInCallAvatar)

        when (session.state) {
            CallState.RINGING -> {
                inCallDtmfDigits = ""
                cardActiveCall.visibility = View.VISIBLE
                layoutCallsSubTabs.visibility = View.GONE
                containerCallsKeypadView.visibility = View.GONE
                containerCallsRecentsView.visibility = View.GONE
                containerCallsContactsView.visibility = View.GONE
                containerCallsSettingsView.visibility = View.GONE
                tvActiveCallTitle.text = "Incoming Call"
                tvCallStatePill.text = "● RINGING"
                tvCallStatePill.setTextColor(ContextCompat.getColor(this, R.color.status_warning))
                tvCallNumber.text = resolvedName ?: number
                tvCallLineDetails.text = if (resolvedName != null) "$number • Cellular Line" else "Routing via active cellular line"
                layoutIncomingCallActions.visibility = View.VISIBLE
                layoutActiveCallControls.visibility = View.GONE
            }
            CallState.DIALING -> {
                inCallDtmfDigits = ""
                cardActiveCall.visibility = View.VISIBLE
                layoutCallsSubTabs.visibility = View.GONE
                containerCallsKeypadView.visibility = View.GONE
                containerCallsRecentsView.visibility = View.GONE
                containerCallsContactsView.visibility = View.GONE
                containerCallsSettingsView.visibility = View.GONE
                tvActiveCallTitle.text = "Outgoing Call"
                tvCallStatePill.text = "● DIALING"
                tvCallStatePill.setTextColor(ContextCompat.getColor(this, R.color.primary))
                tvCallNumber.text = resolvedName ?: number
                tvCallLineDetails.text = if (resolvedName != null) "$number • Cellular Line" else "Calling via Telecom..."
                tvCallDuration.text = "Connecting..."
                layoutIncomingCallActions.visibility = View.GONE
                layoutActiveCallControls.visibility = View.VISIBLE
            }
            CallState.CONNECTED -> {
                inCallDtmfDigits = ""
                cardActiveCall.visibility = View.VISIBLE
                layoutCallsSubTabs.visibility = View.GONE
                containerCallsKeypadView.visibility = View.GONE
                containerCallsRecentsView.visibility = View.GONE
                containerCallsContactsView.visibility = View.GONE
                containerCallsSettingsView.visibility = View.GONE
                tvActiveCallTitle.text = "Active Call"
                tvCallStatePill.text = "● LIVE"
                tvCallStatePill.setTextColor(ContextCompat.getColor(this, R.color.status_online))
                tvCallNumber.text = resolvedName ?: number
                tvCallLineDetails.text = if (resolvedName != null) "$number • Duplex Audio Active" else "Duplex 16kHz PCM Audio Stream Active"
                callStartTimestamp = session.startTimeMs
                layoutIncomingCallActions.visibility = View.GONE
                layoutActiveCallControls.visibility = View.VISIBLE
            }
            CallState.HOLDING -> {
                cardActiveCall.visibility = View.VISIBLE
                layoutCallsSubTabs.visibility = View.GONE
                containerCallsKeypadView.visibility = View.GONE
                containerCallsRecentsView.visibility = View.GONE
                containerCallsContactsView.visibility = View.GONE
                containerCallsSettingsView.visibility = View.GONE
                tvActiveCallTitle.text = "Call on Hold"
                tvCallStatePill.text = "● ON HOLD"
                tvCallStatePill.setTextColor(ContextCompat.getColor(this, R.color.status_warning))
                tvCallNumber.text = resolvedName ?: number
                btnCallPause.setBackgroundResource(R.drawable.bg_btn_circle_active)
            }
            CallState.IDLE, CallState.DISCONNECTED -> {
                cardActiveCall.visibility = View.GONE
                layoutCallsSubTabs.visibility = View.VISIBLE
                layoutSuggestionsWrapper.visibility = View.VISIBLE
                btnDialerCall.visibility = View.VISIBLE
                btnCallKeypad.setBackgroundResource(R.drawable.bg_btn_circle_action)
                callStartTimestamp = 0L
                isMuted = false
                btnCallMute.setImageResource(R.drawable.ic_mic)
                btnCallMute.setBackgroundResource(R.drawable.bg_btn_circle_action)
                btnCallSpeaker.setBackgroundResource(R.drawable.bg_btn_circle_action)
                btnCallPause.setBackgroundResource(R.drawable.bg_btn_circle_action)
                inCallDtmfDigits = ""
                tvDialedNumber.hint = "Enter phone number..."
                dialedNumber = ""
                updateDialedNumberDisplay()
                switchCallsSubTab(selectedCallsTab)
                if (selectedCallsTab == 1) renderRecents()
                if (selectedCallsTab == 2) renderContacts()
            }
            else -> {}
        }
    }

    private fun setAutoAnswerDelay(sec: Int) {
        getSharedPreferences(PREFS_TELEPHONY, Context.MODE_PRIVATE)
            .edit().putInt("auto_answer_delay_sec", sec).apply()
        highlightDelayButton(sec)
        NexusApplication.log("INFO", "CallControl", "Auto-answer delay set to: ${sec}s")
    }

    private fun highlightDelayButton(sec: Int) {
        val activeBg = ContextCompat.getDrawable(this, R.drawable.bg_btn_gradient_primary)
        val inactiveBg = ContextCompat.getDrawable(this, R.drawable.bg_btn_secondary)
        val activeColor = ContextCompat.getColor(this, R.color.text_inverse)
        val inactiveColor = ContextCompat.getColor(this, R.color.text_secondary)

        val map = mapOf(0 to btnDelay0, 3 to btnDelay3, 5 to btnDelay5, 10 to btnDelay10)
        map.forEach { (delay, btn) ->
            if (delay == sec) {
                btn.background = activeBg
                btn.setTextColor(activeColor)
            } else {
                btn.background = inactiveBg
                btn.setTextColor(inactiveColor)
            }
        }
    }

    // =========================================================================
    // Backend AI Agents SSOT & Interactive Live Sync
    // =========================================================================

    private fun loadBackendAgents() {
        val url = etServerUrl.text.toString().trim()
        lifecycleScope.launch {
            val prefs = getSharedPreferences(PREFS_DEVICE, Context.MODE_PRIVATE)
            val cloudWs = prefs.getString("cloud_tunnel_ws_url", null)
            val localWs = prefs.getString("local_lan_ws_url", null)

            var overview = backendApiClient.fetchMobileOverview(url)
            if (overview == null && !cloudWs.isNullOrBlank() && cloudWs != url) {
                overview = backendApiClient.fetchMobileOverview(cloudWs)
            }
            if (overview == null && !localWs.isNullOrBlank() && localWs != url) {
                overview = backendApiClient.fetchMobileOverview(localWs)
            }

            currentOverview = overview
            if (overview != null && overview.activeAgents.isNotEmpty()) {
                val savedAgentId = prefs.getString("active_agent_id", null)
                val targetAgent = overview.activeAgents.find { it.status.equals("active", ignoreCase = true) }
                    ?: overview.activeAgents.find { it.id == savedAgentId }
                    ?: overview.activeAgents.first()
                selectedAgent = targetAgent
                prefs.edit().putString("active_agent_id", targetAgent.id).apply()
                renderSelectedAgent(targetAgent)
                populateAgentsList(overview.activeAgents)
                NexusApplication.log("INFO", "AI Agent", "Live AI Agent loaded from SSOT: ${targetAgent.name} (Active: ${targetAgent.status})")
            } else {
                tvAgentName.text = "Create Call Voice Assistant"
                tvAgentRole.text = "Online • Telephony Voice AI"
                tvAgentProvider.text = "openai ▾"
                tvAgentLlm.text = "gpt-4o ▾"
                tvAgentVoiceEngine.text = "elevenlabs ▾"
                tvAgentLanguage.text = "English (US) ▾"
                tvAgentTemperature.text = "0.7 ▾"
            }
            renderAgentRecordings()
        }
    }

    private fun renderSelectedAgent(agent: AiAgentInfo) {
        tvAgentName.text = agent.name
        tvAgentRole.text = "${agent.role} • ${agent.status.uppercase()}"
        tvAgentConversations.text = "${agent.conversationsCount}"
        tvAgentSuccessRate.text = "${(agent.successRate * 100).toInt()}%"
        tvAgentAvgDuration.text = agent.avgDuration
        tvAgentProvider.text = "${agent.provider ?: "openai"} ▾"
        tvAgentLlm.text = "${agent.llmModel} ▾"
        tvAgentVoiceEngine.text = "${agent.voiceEngine} ▾"
        tvAgentLanguage.text = "${agent.language} ▾"
        tvAgentTemperature.text = "${agent.temperature ?: 0.7} ▾"
        tvAgentSpeechSpeed.text = "${agent.speechSpeed ?: 1.0}x ▾"
        tvAgentSpeechStyle.text = "${agent.speechStyle ?: "Natural"} ▾"
    }

    private fun populateAgentsList(agents: List<AiAgentInfo>) {
        containerAgentsList.removeAllViews()
        val prefs = getSharedPreferences(PREFS_DEVICE, Context.MODE_PRIVATE)
        val savedAgentId = prefs.getString("active_agent_id", null) ?: selectedAgent?.id

        agents.forEach { agent ->
            val isCurrent = agent.id == savedAgentId || (selectedAgent != null && selectedAgent?.id == agent.id)
            val card = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                background = ContextCompat.getDrawable(
                    this@MainActivity,
                    if (isCurrent) R.drawable.bg_card_cyber_selected else R.drawable.bg_card_cyber
                )
                setPadding(28, 20, 28, 20)
                isClickable = true
                isFocusable = true
                val lp = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    bottomMargin = 10
                }
                layoutParams = lp
                setOnClickListener {
                    setActiveAgentAndBind(agent, agents)
                }
            }

            val topRow = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = android.view.Gravity.CENTER_VERTICAL
            }

            val tvName = TextView(this).apply {
                text = agent.name
                setTextColor(ContextCompat.getColor(context, R.color.text_primary))
                textSize = 14f
                setTypeface(null, Typeface.BOLD)
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            }
            topRow.addView(tvName)

            val tvBadge = TextView(this).apply {
                text = if (isCurrent) "● ACTIVE" else "SET ACTIVE"
                setTextColor(
                    ContextCompat.getColor(
                        context,
                        if (isCurrent) R.color.status_online else R.color.primary
                    )
                )
                textSize = 10f
                setTypeface(null, Typeface.BOLD)
                background = ContextCompat.getDrawable(context, if (isCurrent) R.drawable.bg_pill_status else R.drawable.bg_btn_secondary)
                setPadding(14, 5, 14, 5)
                isClickable = true
                setOnClickListener {
                    setActiveAgentAndBind(agent, agents)
                }
            }
            topRow.addView(tvBadge)
            card.addView(topRow)

            val tvRole = TextView(this).apply {
                text = "${agent.role} • ${agent.language}"
                setTextColor(ContextCompat.getColor(context, R.color.text_secondary))
                textSize = 12f
                setPadding(0, 4, 0, 4)
            }
            card.addView(tvRole)

            val tvEngine = TextView(this).apply {
                text = "Voice: ${agent.voiceEngine}  |  LLM: ${agent.llmModel}  |  Provider: ${agent.provider ?: "openai"}"
                setTextColor(ContextCompat.getColor(context, R.color.primary))
                textSize = 11f
            }
            card.addView(tvEngine)

            containerAgentsList.addView(card)
        }
    }

    private fun setActiveAgentAndBind(agent: AiAgentInfo, allAgents: List<AiAgentInfo>) {
        selectedAgent = agent
        getSharedPreferences(PREFS_DEVICE, Context.MODE_PRIVATE)
            .edit()
            .putString("active_agent_id", agent.id)
            .apply()

        renderSelectedAgent(agent)
        populateAgentsList(allAgents)

        val url = etServerUrl.text.toString().trim()
        val deviceId = telemetryManager.getSnapshot().deviceId
        lifecycleScope.launch {
            val ok = backendApiClient.bindDevice(
                baseUrl = url,
                deviceId = deviceId,
                agentId = agent.id,
                llmModel = agent.llmModel,
                voiceId = agent.voiceEngine,
                language = agent.language
            )
            if (ok) {
                Toast.makeText(this@MainActivity, "Agent \"${agent.name}\" active & synchronized!", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun showProviderPicker() {
        val overview = currentOverview ?: return
        val providers = overview.llmProviders.ifEmpty {
            listOf(com.nexus.callos.companion.model.ProviderInfo("openai", "OpenAI", "Cloud", "paid", "cloud", false, true, listOf("gpt-4o", "gpt-4o-mini")))
        }
        val names: Array<CharSequence> = providers.map { "${it.name} (${if (it.isActive) "Active" else "Disabled"})" }.toTypedArray()
        AlertDialog.Builder(this)
            .setTitle("Select LLM Provider (Live SSOT)")
            .setItems(names) { _, which ->
                val chosen = providers[which]
                val agent = selectedAgent ?: return@setItems
                updateAgentBackendConfig(agentId = agent.id, provider = chosen.id, model = chosen.models.firstOrNull())
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showModelPicker() {
        val overview = currentOverview ?: return
        val models = overview.availableModels.ifEmpty { listOf("GPT-4o", "GPT-4o-mini", "Gemini 2.0 Flash", "gemini-2.5-flash-lite", "Claude 3.5 Sonnet") }
        val names: Array<CharSequence> = models.toTypedArray()
        AlertDialog.Builder(this)
            .setTitle("Select LLM Model (Live SSOT)")
            .setItems(names) { _, which ->
                val chosen = models[which]
                val agent = selectedAgent ?: return@setItems
                updateAgentBackendConfig(agentId = agent.id, model = chosen)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showVoicePicker() {
        val overview = currentOverview ?: return
        val voices = overview.voiceEngines.ifEmpty {
            listOf(
                com.nexus.callos.companion.model.VoiceEngineInfo("elevenlabs", "elevenlabs", "ElevenLabs Turbo v2.5", "Realtime", "ACTIVE"),
                com.nexus.callos.companion.model.VoiceEngineInfo("deepgram", "deepgram_aura", "Deepgram Aura", "Fast", "ACTIVE")
            )
        }
        val names: Array<CharSequence> = voices.map { "${it.name} (${it.provider})" }.toTypedArray()
        AlertDialog.Builder(this)
            .setTitle("Select Voice Engine (Live SSOT)")
            .setItems(names) { _, which ->
                val chosen = voices[which]
                val agent = selectedAgent ?: return@setItems
                updateAgentBackendConfig(agentId = agent.id, voiceEngine = chosen.id.ifBlank { chosen.provider })
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showLanguagePicker() {
        val overview = currentOverview ?: return
        val languages = overview.availableLanguages.ifEmpty {
            listOf(
                com.nexus.callos.companion.model.LanguageOption("en-US", "English (US)"),
                com.nexus.callos.companion.model.LanguageOption("hi-IN", "Hindi (India)"),
                com.nexus.callos.companion.model.LanguageOption("en-IN", "English (India)"),
                com.nexus.callos.companion.model.LanguageOption("es-ES", "Spanish (Spain)")
            )
        }
        val labels: Array<CharSequence> = languages.map { "${it.name} [${it.code}]" }.toTypedArray()
        AlertDialog.Builder(this)
            .setTitle("Select Agent Language (Live SSOT)")
            .setItems(labels) { _, which ->
                val chosen = languages[which]
                val agent = selectedAgent ?: return@setItems
                updateAgentBackendConfig(agentId = agent.id, language = chosen.name)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showTemperaturePicker() {
        val options = arrayOf(
            "0.0 — Deterministic & Structured",
            "0.3 — Precise Telephony Dialog",
            "0.45 — Balanced Conversational",
            "0.7 — Standard Agent Prompting",
            "0.9 — Expressive & Dynamic",
            "1.0 — High Variation"
        )
        val values = arrayOf(0.0, 0.3, 0.45, 0.7, 0.9, 1.0)
        AlertDialog.Builder(this)
            .setTitle("Select Sampling Temperature")
            .setItems(options) { _, which ->
                val chosen = values[which]
                val agent = selectedAgent ?: return@setItems
                updateAgentBackendConfig(agentId = agent.id, temperature = chosen)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun updateAgentBackendConfig(
        agentId: String,
        name: String? = null,
        provider: String? = null,
        model: String? = null,
        voiceEngine: String? = null,
        language: String? = null,
        temperature: Double? = null
    ) {
        val url = etServerUrl.text.toString().trim()
        val deviceId = telemetryManager.getSnapshot().deviceId
        lifecycleScope.launch {
            val success = backendApiClient.updateAgentConfig(
                baseUrl = url,
                agentId = agentId,
                name = name,
                provider = provider,
                model = model,
                voiceEngine = voiceEngine,
                language = language,
                temperature = temperature
            )
            if (success) {
                // Also bind to current device
                backendApiClient.bindDevice(
                    baseUrl = url,
                    deviceId = deviceId,
                    agentId = agentId,
                    llmModel = model ?: selectedAgent?.llmModel,
                    voiceId = voiceEngine ?: selectedAgent?.voiceEngine,
                    language = language ?: selectedAgent?.language
                )
                Toast.makeText(this@MainActivity, "AI Agent configuration updated in SSOT!", Toast.LENGTH_SHORT).show()
                loadBackendAgents()
            } else {
                Toast.makeText(this@MainActivity, "Could not update agent on backend. Check gateway connection.", Toast.LENGTH_LONG).show()
            }
        }
    }

    // =========================================================================
    // Call Recordings Management & Audio Playback
    // =========================================================================

    private fun renderAgentRecordings() {
        containerAgentRecordingsList.removeAllViews()
        val recordings = recordingManager.getAllRecordings()
        val countText = "${recordings.size} files"
        tvAgentRecordingsBadge.text = countText
        tvRecordingCountBadge.text = countText

        if (recordings.isEmpty()) {
            tvNoAgentRecordingsMsg.visibility = View.VISIBLE
            return
        }
        tvNoAgentRecordingsMsg.visibility = View.GONE

        recordings.forEach { rec ->
            val row = buildRecordingRow(rec)
            containerAgentRecordingsList.addView(row)
        }
    }

    private fun buildRecordingRow(rec: CallRecordingRecord): View {
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = ContextCompat.getDrawable(this@MainActivity, R.drawable.bg_card_subtle)
            setPadding(20, 16, 20, 16)
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = 10
            }
            layoutParams = lp
        }

        // Top Row: Icon + Contact Name/Number + Size Badge
        val topRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = android.view.Gravity.CENTER_VERTICAL
        }

        val ivIcon = ImageView(this).apply {
            setImageResource(R.drawable.ic_mic)
            setColorFilter(ContextCompat.getColor(context, R.color.primary))
            val lp = LinearLayout.LayoutParams(32, 32).apply {
                marginEnd = 12
            }
            layoutParams = lp
        }
        topRow.addView(ivIcon)

        val colInfo = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }

        val tvName = TextView(this).apply {
            text = rec.contactName ?: rec.phoneNumber
            setTextColor(ContextCompat.getColor(context, R.color.text_primary))
            textSize = 13f
            setTypeface(null, Typeface.BOLD)
        }
        colInfo.addView(tvName)

        val tvSub = TextView(this).apply {
            val dirLabel = when (rec.direction.lowercase(Locale.getDefault())) {
                "incoming" -> "Incoming"
                "outgoing" -> "Outgoing"
                else -> "Cellular"
            }
            text = "$dirLabel • ${rec.formattedDate} • ${rec.formattedDuration} • ${rec.simName}"
            setTextColor(ContextCompat.getColor(context, R.color.text_secondary))
            textSize = 11f
        }
        colInfo.addView(tvSub)
        topRow.addView(colInfo)

        val tvSize = TextView(this).apply {
            text = rec.formattedSize
            setTextColor(ContextCompat.getColor(context, R.color.accent_purple))
            textSize = 10f
            setTypeface(null, Typeface.BOLD)
            background = ContextCompat.getDrawable(context, R.drawable.bg_pill_status)
            setPadding(12, 4, 12, 4)
        }
        topRow.addView(tvSize)
        card.addView(topRow)

        // Actions Row: Play, Download, Delete
        val actionsRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = android.view.Gravity.END
            setPadding(0, 10, 0, 0)
        }

        val btnPlay = Button(this).apply {
            text = "▶ Play"
            textSize = 11f
            setTypeface(null, Typeface.BOLD)
            setTextColor(ContextCompat.getColor(context, R.color.primary))
            background = ContextCompat.getDrawable(context, R.drawable.bg_btn_secondary)
            setPadding(16, 0, 16, 0)
            val lp = LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, 70).apply {
                marginEnd = 8
            }
            layoutParams = lp
            setOnClickListener { showAudioPlayerDialog(rec) }
        }
        actionsRow.addView(btnPlay)

        val btnDownload = Button(this).apply {
            text = "↓ Export"
            textSize = 11f
            setTypeface(null, Typeface.BOLD)
            setTextColor(ContextCompat.getColor(context, R.color.accent_cyan))
            background = ContextCompat.getDrawable(context, R.drawable.bg_btn_secondary)
            setPadding(16, 0, 16, 0)
            val lp = LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, 70).apply {
                marginEnd = 8
            }
            layoutParams = lp
            setOnClickListener {
                recordingManager.exportRecording(this@MainActivity, rec)
            }
        }
        actionsRow.addView(btnDownload)

        val btnDelete = Button(this).apply {
            text = "🗑 Delete"
            textSize = 11f
            setTypeface(null, Typeface.BOLD)
            setTextColor(ContextCompat.getColor(context, R.color.status_offline))
            background = ContextCompat.getDrawable(context, R.drawable.bg_btn_secondary)
            setPadding(16, 0, 16, 0)
            val lp = LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, 70)
            layoutParams = lp
            setOnClickListener {
                recycleBinManager.moveRecordingToRecycleBin(rec)
                recordingManager.deleteRecordingFileAndMeta(rec.id)
                renderAgentRecordings()
                updateRecycleBinBadge()
                Toast.makeText(this@MainActivity, "Moved recording to Recycle Bin", Toast.LENGTH_SHORT).show()
            }
        }
        actionsRow.addView(btnDelete)

        card.addView(actionsRow)
        return card
    }

    private fun showAudioPlayerDialog(rec: CallRecordingRecord) {
        val dialogView = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 24, 32, 24)
        }

        val tvTitle = TextView(this).apply {
            text = rec.contactName ?: rec.phoneNumber
            setTextColor(ContextCompat.getColor(context, R.color.text_primary))
            textSize = 15f
            setTypeface(null, Typeface.BOLD)
        }
        dialogView.addView(tvTitle)

        val tvSub = TextView(this).apply {
            text = "${rec.formattedDate} • ${rec.formattedDuration} • ${rec.filePath}"
            setTextColor(ContextCompat.getColor(context, R.color.text_secondary))
            textSize = 11f
            setPadding(0, 4, 0, 16)
        }
        dialogView.addView(tvSub)

        val tvProgress = TextView(this).apply {
            text = "00:00 / ${rec.formattedDuration}"
            setTextColor(ContextCompat.getColor(context, R.color.primary))
            textSize = 13f
            setTypeface(null, Typeface.BOLD)
            gravity = android.view.Gravity.CENTER
            setPadding(0, 8, 0, 8)
        }
        dialogView.addView(tvProgress)

        val btnPlayPause = Button(this).apply {
            text = "▶ Start Playback"
            background = ContextCompat.getDrawable(context, R.drawable.bg_btn_gradient_primary)
            setTextColor(ContextCompat.getColor(context, R.color.text_inverse))
            textSize = 13f
            setTypeface(null, Typeface.BOLD)
        }
        dialogView.addView(btnPlayPause)

        val dialog = AlertDialog.Builder(this)
            .setTitle("Call Audio Playback")
            .setView(dialogView)
            .setPositiveButton("Close") { _, _ ->
                recordingManager.stopPlayback()
            }
            .setOnDismissListener {
                recordingManager.stopPlayback()
            }
            .create()

        btnPlayPause.setOnClickListener {
            if (recordingManager.isPlaying()) {
                recordingManager.pausePlayback()
                btnPlayPause.text = "▶ Resume Playback"
            } else {
                val started = recordingManager.playRecording(
                    filePath = rec.filePath,
                    onProgress = { currentMs: Int, totalMs: Int ->
                        runOnUiThread {
                            val cSec = currentMs / 1000
                            val tSec = totalMs / 1000
                            tvProgress.text = String.format(Locale.US, "%02d:%02d / %02d:%02d", cSec / 60, cSec % 60, tSec / 60, tSec % 60)
                        }
                    },
                    onCompletion = {
                        runOnUiThread {
                            btnPlayPause.text = "▶ Replay"
                            tvProgress.text = "Completed (${rec.formattedDuration})"
                        }
                    }
                )
                if (started) {
                    btnPlayPause.text = "⏸ Pause"
                } else {
                    Toast.makeText(this, "Audio file not found on disk or playback error.", Toast.LENGTH_LONG).show()
                }
            }
        }

        dialog.show()
    }

    private fun showCallRecordingDiagnosticDialog() {
        val diag = recordingManager.probeRecordingCapability()
        val sb = StringBuilder()
        sb.append("DEVICE & OS CAPABILITY PROBE:\n\n")
        sb.append("• Cellular Audio Capture: ${if (diag.isCapable) "SUPPORTED" else "RESTRICTED (Google Policy)"}\n")
        sb.append("• RECORD_AUDIO Permission: ${if (diag.hasMicPermission) "GRANTED" else "DENIED"}\n")
        sb.append("• OS Version: ${diag.androidVersionName} (API ${diag.sdkInt})\n")
        sb.append("• Telephony Role: ${if (diag.telecomRoleGranted) "ACTIVE" else "NOT ACTIVE"}\n")
        sb.append("• Backend Audio Ingestion: ${diag.serverSideStreamingStatus}\n\n")
        sb.append("DIAGNOSTIC EXPLANATION:\n")
        sb.append(diag.diagnosticSummary)

        AlertDialog.Builder(this)
            .setTitle("Call Recording Capability Diagnostic")
            .setMessage(sb.toString())
            .setPositiveButton("OK", null)
            .setNeutralButton("View Recordings") { _, _ ->
                navigateTo(Screen.AGENT)
            }
            .show()
    }

    // =========================================================================
    // Recycle Bin & Data Management
    // =========================================================================

    private fun updateRecycleBinBadge() {
        val count = recycleBinManager.getItemCount()
        tvRecycleBinCount.text = "$count items"
    }

    private fun showRecycleBinDialog() {
        val items = recycleBinManager.getAllItems()
        if (items.isEmpty()) {
            AlertDialog.Builder(this)
                .setTitle("Recycle Bin")
                .setMessage("The Recycle Bin is currently empty. Deleted calls and recordings will appear here for restoration or permanent removal.")
                .setPositiveButton("OK", null)
                .show()
            return
        }

        val itemTitles = items.map { item ->
            val typeStr = if (item.itemType == "RECORDING") "🎙 Audio Recording" else "📞 Call Log"
            val contact = if (item.itemType == "RECORDING") {
                item.recordingRecord?.contactName ?: item.recordingRecord?.phoneNumber ?: "Recording"
            } else {
                item.callLogRecord?.contactName ?: item.callLogRecord?.number ?: "Call Log"
            }
            "$typeStr: $contact • ${item.formattedDeletedDate}"
        }.toTypedArray()

        AlertDialog.Builder(this)
            .setTitle("Recycle Bin (${items.size} items)")
            .setItems(itemTitles) { _, which ->
                val chosen = items[which]
                showRecycleBinItemDetailDialog(chosen)
            }
            .setPositiveButton("Empty Recycle Bin") { _, _ ->
                confirmEmptyRecycleBin()
            }
            .setNegativeButton("Close", null)
            .show()
    }

    private fun showRecycleBinItemDetailDialog(item: RecycleBinItem) {
        val typeStr = if (item.itemType == "RECORDING") "Audio Recording" else "Call Log Record"
        val contact = if (item.itemType == "RECORDING") {
            item.recordingRecord?.contactName ?: item.recordingRecord?.phoneNumber ?: "Recording"
        } else {
            item.callLogRecord?.contactName ?: item.callLogRecord?.number ?: "Call Log"
        }
        val number = if (item.itemType == "RECORDING") item.recordingRecord?.phoneNumber ?: "" else item.callLogRecord?.number ?: ""
        val direction = if (item.itemType == "RECORDING") item.recordingRecord?.direction ?: "" else item.callLogRecord?.type?.name ?: ""
        val dur = if (item.itemType == "RECORDING") item.recordingRecord?.formattedDuration ?: "" else item.callLogRecord?.formattedDuration ?: ""
        val path = item.recordingRecord?.filePath ?: "None (Database Record)"

        AlertDialog.Builder(this)
            .setTitle("Deleted Item Details")
            .setMessage(
                "Type: $typeStr\n" +
                "Contact / Name: $contact\n" +
                "Phone Number: $number\n" +
                "Direction: $direction\n" +
                "Duration: $dur\n" +
                "Deleted On: ${item.formattedDeletedDate}\n" +
                "File Path: $path"
            )
            .setPositiveButton("Restore") { _, _ ->
                recycleBinManager.restoreItem(item.id, callLogManager, recordingManager)
                updateRecycleBinBadge()
                renderRecents()
                renderCallLogs()
                renderAgentRecordings()
                Toast.makeText(this, "Item restored to active records.", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Permanently Delete") { _, _ ->
                recycleBinManager.permanentlyDeleteItem(item.id, callLogManager, recordingManager)
                updateRecycleBinBadge()
                renderAgentRecordings()
                Toast.makeText(this, "Item permanently deleted from storage.", Toast.LENGTH_SHORT).show()
            }
            .setNeutralButton("Cancel", null)
            .show()
    }

    private fun confirmEmptyRecycleBin() {
        val count = recycleBinManager.getItemCount()
        AlertDialog.Builder(this)
            .setTitle("Empty Recycle Bin?")
            .setMessage("Permanently remove all $count deleted records and associated audio files from device storage? This cannot be undone.")
            .setPositiveButton("Empty All") { _, _ ->
                recycleBinManager.emptyRecycleBin(callLogManager, recordingManager)
                updateRecycleBinBadge()
                renderAgentRecordings()
                Toast.makeText(this, "Recycle Bin emptied.", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showClearAllDataDialog() {
        val totalCalls = callLogManager.getCallLogs(limit = 1000).size
        val totalRecordings = recordingManager.getAllRecordings().size
        AlertDialog.Builder(this)
            .setTitle("Clear All Call Data")
            .setMessage(
                "LIVE LOCAL DATA INVENTORY:\n" +
                "• Call Records: $totalCalls\n" +
                "• Audio Recordings: $totalRecordings files\n\n" +
                "All items will be moved to the Recycle Bin. You will be able to restore them or permanently delete them at any time.\n\n" +
                "Proceed with clearing call history and recordings?"
            )
            .setPositiveButton("Clear Data") { _, _ ->
                val allLogs = callLogManager.getCallLogs(limit = 1000)
                allLogs.forEach { log ->
                    recycleBinManager.moveCallLogToRecycleBin(log)
                    callLogManager.deleteCallLogEntry(log.id)
                }

                val allRecs = recordingManager.getAllRecordings()
                allRecs.forEach { rec ->
                    recycleBinManager.moveRecordingToRecycleBin(rec)
                    recordingManager.deleteRecordingFileAndMeta(rec.id)
                }

                updateRecycleBinBadge()
                renderRecents()
                renderCallLogs()
                renderAgentRecordings()
                Toast.makeText(this, "All call history moved to Recycle Bin.", Toast.LENGTH_LONG).show()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun runAudioOutputTest() {
        if (isAudioTesting) return
        isAudioTesting = true
        Toast.makeText(this, "Playing 440Hz conversational test tone...", Toast.LENGTH_SHORT).show()

        Thread {
            try {
                val sampleRate = 16000
                val durationSec = 1.2
                val numSamples = (sampleRate * durationSec).toInt()
                val buffer = ShortArray(numSamples)

                for (i in 0 until numSamples) {
                    val angle = 2.0 * Math.PI * i / (sampleRate / 440.0)
                    buffer[i] = (sin(angle) * Short.MAX_VALUE * 0.4).toInt().toShort()
                }

                val minBuf = AudioTrack.getMinBufferSize(
                    sampleRate,
                    AudioFormat.CHANNEL_OUT_MONO,
                    AudioFormat.ENCODING_PCM_16BIT
                )

                val audioTrack = AudioTrack.Builder()
                    .setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                            .build()
                    )
                    .setAudioFormat(
                        AudioFormat.Builder()
                            .setSampleRate(sampleRate)
                            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                            .build()
                    )
                    .setBufferSizeInBytes(maxOf(minBuf, buffer.size * 2))
                    .setTransferMode(AudioTrack.MODE_STREAM)
                    .build()

                audioTrack.play()
                audioTrack.write(buffer, 0, buffer.size)
                Thread.sleep(1300L)
                audioTrack.stop()
                audioTrack.release()
                NexusApplication.log("INFO", "AudioTest", "Speaker test completed successfully.")
            } catch (e: Exception) {
                NexusApplication.log("ERROR", "AudioTest", "Audio test error: ${e.message}")
            } finally {
                runOnUiThread {
                    isAudioTesting = false
                }
            }
        }.start()
    }

    // =========================================================================
    // Sub-Screen Renderers: Device Details, Telemetry, Call Logs, Advanced
    // =========================================================================

    private fun renderDeviceDetails() {
        containerDeviceDetailsRows.removeAllViews()
        val snap = telemetryManager.getSnapshot()

        val details = listOf(
            "Device Name" to "${snap.manufacturer} ${snap.model}",
            "Manufacturer" to snap.manufacturer,
            "Model" to snap.model,
            "Android Version" to snap.osVersion,
            "Build Number" to snap.buildNumber,
            "Kernel Version" to snap.kernelVersion,
            "Security Patch" to snap.securityPatch,
            "Boot Time" to String.format(Locale.US, "%dh %dm", snap.uptimeSeconds / 3600, (snap.uptimeSeconds % 3600) / 60),
            "Device ID" to snap.deviceId,
            "Baseband Version" to snap.basebandVersion,
            "Hardware" to snap.hardware,
            "Total RAM" to snap.totalRamGb,
            "Available RAM" to snap.availRamGb,
            "Internal Storage" to snap.totalStorageGb,
            "Available Storage" to snap.availStorageGb
        )

        details.forEach { (label, value) ->
            val row = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    bottomMargin = 10
                }
            }
            val l = TextView(this).apply {
                text = label
                setTextColor(ContextCompat.getColor(context, R.color.text_secondary))
                textSize = 12f
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1.1f)
            }
            val v = TextView(this).apply {
                text = value
                setTextColor(ContextCompat.getColor(context, R.color.text_primary))
                textSize = 12f
                setTypeface(null, Typeface.BOLD)
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1.4f)
            }
            row.addView(l)
            row.addView(v)
            containerDeviceDetailsRows.addView(row)
        }
    }

    private fun renderTelemetryView() {
        val snap = telemetryManager.getSnapshot()
        tvTelemetryBatteryVal.text = "${snap.batteryLevel}%"
        tvTelemetrySignalVal.text = "${snap.signalDbm} dBm"
        tvTelemetryUpload.text = snap.uploadMbps
        tvTelemetryDownload.text = snap.downloadMbps
        tvTelemetryLatency.text = "${snap.latencyMs} ms"

        val battHist = telemetryManager.batteryHistory
        if (battHist.isNotEmpty()) {
            val sb = StringBuilder()
            battHist.takeLast(20).forEach { lvl ->
                val bar = when {
                    lvl > 80 -> "█"
                    lvl > 60 -> "▇"
                    lvl > 40 -> "▆"
                    lvl > 20 -> "▅"
                    else -> "▃"
                }
                sb.append(bar)
            }
            tvBatteryHistoryGraph.text = sb.toString()
        }

        val sigHist = telemetryManager.signalHistory
        if (sigHist.isNotEmpty()) {
            val sb = StringBuilder()
            sigHist.takeLast(20).forEach { dbm ->
                val bar = when {
                    dbm > -70 -> "█"
                    dbm > -85 -> "▇"
                    dbm > -100 -> "▆"
                    dbm > -115 -> "▅"
                    else -> "▄"
                }
                sb.append(bar)
            }
            tvSignalHistoryGraph.text = sb.toString()
        }
    }

    private fun filterCallLogs(type: CallLogType?) {
        activeLogFilter = type
        val sel = ContextCompat.getDrawable(this, R.drawable.bg_tab_pill_selected)
        val unsel = ContextCompat.getDrawable(this, R.drawable.bg_tab_pill_unselected)
        val colSel = ContextCompat.getColor(this, R.color.text_primary)
        val colUnsel = ContextCompat.getColor(this, R.color.text_secondary)

        tabLogAll.background = if (type == null) sel else unsel
        tabLogAll.setTextColor(if (type == null) colSel else colUnsel)

        tabLogMissed.background = if (type == CallLogType.MISSED) sel else unsel
        tabLogMissed.setTextColor(if (type == CallLogType.MISSED) colSel else colUnsel)

        tabLogIncoming.background = if (type == CallLogType.INCOMING) sel else unsel
        tabLogIncoming.setTextColor(if (type == CallLogType.INCOMING) colSel else colUnsel)

        tabLogOutgoing.background = if (type == CallLogType.OUTGOING) sel else unsel
        tabLogOutgoing.setTextColor(if (type == CallLogType.OUTGOING) colSel else colUnsel)

        renderCallLogs()
    }

    private fun renderCallLogs() {
        callLogsJob?.cancel()
        callLogsJob = lifecycleScope.launch {
            val query = callLogSearchQuery
            val filter = activeLogFilter
            val filteredLogs = withContext(Dispatchers.IO) {
                val allLogs = callLogManager.getCallLogs(filter, limit = 50)
                if (query.isBlank()) {
                    allLogs
                } else {
                    val q = query.lowercase()
                    val cleanQ = q.replace(Regex("[^0-9+]"), "")
                    allLogs.filter { log ->
                        log.number.lowercase().contains(q) ||
                        (log.contactName?.lowercase()?.contains(q) == true) ||
                        (cleanQ.isNotEmpty() && log.number.replace(Regex("[^0-9+]"), "").contains(cleanQ))
                    }
                }
            }

            containerCallLogs.removeAllViews()
            if (filteredLogs.isEmpty()) {
                tvNoLogsMsg.text = if (query.isNotBlank()) "No calls match \"$query\"" else "No call log records found."
                tvNoLogsMsg.visibility = View.VISIBLE
                return@launch
            }
            tvNoLogsMsg.visibility = View.GONE

            filteredLogs.take(50).forEach { record ->
                val row = buildCallLogRow(record)
                containerCallLogs.addView(row)
            }
        }
    }

    private fun buildCallLogRow(record: CallLogRecord): View {
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            background = ContextCompat.getDrawable(this@MainActivity, R.drawable.bg_card_cyber)
            gravity = android.view.Gravity.CENTER_VERTICAL
            setPadding(16, 12, 16, 12)
            isClickable = true
            isFocusable = true
            val lp = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = 8
            }
            layoutParams = lp
            setOnClickListener {
                showCallLogDetailDialog(record)
            }
        }

        // Contact Avatar / Profile Photo
        val ivAvatar = ImageView(this).apply {
            loadAvatarAsync(record.photoUri, this)
            val lp = LinearLayout.LayoutParams(36, 36).apply {
                marginEnd = 12
            }
            layoutParams = lp
        }
        row.addView(ivAvatar)

        // Middle: Name / Number and Type / Time
        val middle = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }

        val tvPrimary = TextView(this).apply {
            text = record.contactName ?: record.number
            setTextColor(ContextCompat.getColor(context, R.color.text_primary))
            textSize = 13f
            setTypeface(null, Typeface.BOLD)
        }
        middle.addView(tvPrimary)

        val tvSub = TextView(this).apply {
            val typeStr = record.type.name.lowercase().replaceFirstChar { it.uppercase() }
            text = if (record.contactName != null) {
                "${record.number} • $typeStr • ${record.formattedTime}"
            } else {
                "$typeStr • ${record.formattedTime}"
            }
            setTextColor(ContextCompat.getColor(context, R.color.text_secondary))
            textSize = 11f
        }
        middle.addView(tvSub)
        row.addView(middle)

        // Right: Call Direction Icon + Duration
        val rightCol = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = android.view.Gravity.END
        }

        val icon = ImageView(this).apply {
            val iconRes = when (record.type) {
                CallLogType.INCOMING -> R.drawable.ic_call_incoming
                CallLogType.OUTGOING -> R.drawable.ic_call_outgoing
                CallLogType.MISSED -> R.drawable.ic_call_missed
            }
            setImageResource(iconRes)
            val lp = LinearLayout.LayoutParams(16, 16).apply {
                bottomMargin = 2
            }
            layoutParams = lp
        }
        rightCol.addView(icon)

        val tvDur = TextView(this).apply {
            text = if (record.type == CallLogType.MISSED) "Missed" else record.formattedDuration
            setTextColor(ContextCompat.getColor(context, if (record.type == CallLogType.MISSED) R.color.status_offline else R.color.text_muted))
            textSize = 11f
            setTypeface(null, Typeface.BOLD)
            typeface = Typeface.MONOSPACE
        }
        rightCol.addView(tvDur)
        row.addView(rightCol)

        return row
    }

    private fun showCallLogDetailDialog(record: CallLogRecord) {
        val typeLabel = when (record.type) {
            CallLogType.INCOMING -> "Incoming Call"
            CallLogType.OUTGOING -> "Outgoing Call"
            CallLogType.MISSED -> "Missed / Rejected Call"
        }

        val contactDisplay = record.contactName ?: "Unsaved Contact"
        val durText = if (record.type == CallLogType.MISSED) "0 seconds (Missed)" else "${record.durationSec} seconds (${record.formattedDuration})"
        val simDisplay = record.simDisplayName ?: "Active Line"
        val diag = recordingManager.probeRecordingCapability()
        val recStatus = if (diag.cellularCallAudioCaptureAvailable) "Audio Capture Available" else "Hardware Downlink Restricted (Google Scoped Telephony Audio Isolation)"

        AlertDialog.Builder(this)
            .setTitle("Call Details")
            .setMessage(
                "Contact Name: $contactDisplay\n" +
                "Phone Number: ${record.number}\n" +
                "Direction: $typeLabel\n" +
                "Timestamp: ${record.dateFormattedLong}\n" +
                "Call Duration: $durText\n" +
                "SIM Account: $simDisplay\n" +
                "Voice Technology: Standard Cellular GSM Voice / VoLTE\n" +
                "Recording Capability: $recStatus"
            )
            .setPositiveButton("Call Back") { _, _ ->
                initiateOutgoingCellularCall(record.number)
            }
            .setNeutralButton("Add Contact") { _, _ ->
                val intent = Intent(Intent.ACTION_INSERT, ContactsContract.Contacts.CONTENT_URI).apply {
                    putExtra(ContactsContract.Intents.Insert.PHONE, record.number)
                    if (record.contactName != null) {
                        putExtra(ContactsContract.Intents.Insert.NAME, record.contactName)
                    }
                }
                try {
                    startActivity(intent)
                } catch (e: Exception) {
                    Toast.makeText(this, "Could not open Contacts app: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Delete") { _, _ ->
                recycleBinManager.moveCallLogToRecycleBin(record)
                val deleted = callLogManager.deleteCallLogEntry(record.id)
                if (deleted) {
                    Toast.makeText(this, "Moved call entry to Recycle Bin", Toast.LENGTH_SHORT).show()
                    updateRecycleBinBadge()
                    renderRecents()
                    renderCallLogs()
                } else {
                    Toast.makeText(this, "Could not delete call entry", Toast.LENGTH_SHORT).show()
                }
            }
            .show()
    }

    private fun renderAdvancedSettings() {
        containerAdvancedRows.removeAllViews()
        val settings = listOf(
            "Preferred Network" to "5G/4G/3G/2G (Auto) ›",
            "Data Roaming" to "Off ›",
            "VoLTE" to "On ›",
            "Wi-Fi Calling" to "On ›",
            "Keep Alive Interval" to "30 seconds ›",
            "Battery Optimization" to "Ignore ›",
            "Foreground Service" to "Running ›",
            "Debug Mode" to "Off ›"
        )

        settings.forEach { (label, value) ->
            val row = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    38
                )
                gravity = android.view.Gravity.CENTER_VERTICAL
            }
            val l = TextView(this).apply {
                text = label
                setTextColor(ContextCompat.getColor(context, R.color.text_primary))
                textSize = 12f
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            }
            val v = TextView(this).apply {
                text = value
                setTextColor(ContextCompat.getColor(context, R.color.text_muted))
                textSize = 12f
            }
            row.addView(l)
            row.addView(v)
            containerAdvancedRows.addView(row)
        }
    }

    // =========================================================================
    // Gateway Connection & Deep Link Pairing (QR Bootstrap & SSOT Verification)
    // =========================================================================

    private fun saveServerUrl(url: String) {
        val clean = url.replace(Regex("^(ws|wss|http|https):/+(.*)$")) { "${it.groupValues[1]}://${it.groupValues[2]}" }
        getSharedPreferences(PREFS_DEVICE, Context.MODE_PRIVATE)
            .edit()
            .putString("server_url", clean)
            .apply()
    }

    private fun updateConnectionUi(state: CallBridgeForegroundService.ConnectionState) {
        runOnUiThread {
            when (state) {
                CallBridgeForegroundService.ConnectionState.CONNECTED -> {
                    tvDashStatus.text = "CONNECTED"
                    tvDashStatus.setTextColor(ContextCompat.getColor(this, R.color.status_online))
                    tvDashStatusSub.text = "WebSocket Bridge Active & Synchronized with SSOT"
                    tvHeaderStatusBadge.text = "LIVE"
                    tvHeaderStatusBadge.background = ContextCompat.getDrawable(this, R.drawable.bg_pill_status)
                    tvHeaderStatusBadge.setTextColor(ContextCompat.getColor(this, R.color.status_online))
                    btnDashConnect.text = "DISCONNECT GATEWAY"
                    btnDashConnect.background = ContextCompat.getDrawable(this, R.drawable.bg_btn_disconnect)
                    btnDashConnect.setTextColor(ContextCompat.getColor(this, R.color.status_offline))
                }
                CallBridgeForegroundService.ConnectionState.CONNECTING -> {
                    tvDashStatus.text = "CONNECTING..."
                    tvDashStatus.setTextColor(ContextCompat.getColor(this, R.color.status_warning))
                    tvDashStatusSub.text = "Verifying Nexus SSOT backend communication..."
                    tvHeaderStatusBadge.text = "CONNECTING"
                    tvHeaderStatusBadge.background = ContextCompat.getDrawable(this, R.drawable.bg_pill_status)
                    tvHeaderStatusBadge.setTextColor(ContextCompat.getColor(this, R.color.status_warning))
                    btnDashConnect.text = "CANCEL"
                    btnDashConnect.background = ContextCompat.getDrawable(this, R.drawable.bg_btn_secondary)
                    btnDashConnect.setTextColor(ContextCompat.getColor(this, R.color.text_secondary))
                }
                CallBridgeForegroundService.ConnectionState.ERROR -> {
                    tvDashStatus.text = "ERROR"
                    tvDashStatus.setTextColor(ContextCompat.getColor(this, R.color.status_offline))
                    tvDashStatusSub.text = "Connection / Verification Failed. Check LAN Wi-Fi & URL"
                    tvHeaderStatusBadge.text = "ERROR"
                    tvHeaderStatusBadge.background = ContextCompat.getDrawable(this, R.drawable.bg_pill_status)
                    tvHeaderStatusBadge.setTextColor(ContextCompat.getColor(this, R.color.status_offline))
                    btnDashConnect.text = "RECONNECT"
                    btnDashConnect.background = ContextCompat.getDrawable(this, R.drawable.bg_btn_gradient_primary)
                    btnDashConnect.setTextColor(ContextCompat.getColor(this, R.color.text_inverse))
                }
                CallBridgeForegroundService.ConnectionState.DISCONNECTED -> {
                    tvDashStatus.text = "DISCONNECTED"
                    tvDashStatus.setTextColor(ContextCompat.getColor(this, R.color.text_muted))
                    tvDashStatusSub.text = "Offline / Standalone GSM Dialer Mode"
                    tvHeaderStatusBadge.text = "OFFLINE"
                    tvHeaderStatusBadge.background = ContextCompat.getDrawable(this, R.drawable.bg_pill_status)
                    tvHeaderStatusBadge.setTextColor(ContextCompat.getColor(this, R.color.text_muted))
                    btnDashConnect.text = "CONNECT NOW"
                    btnDashConnect.background = ContextCompat.getDrawable(this, R.drawable.bg_btn_gradient_primary)
                    btnDashConnect.setTextColor(ContextCompat.getColor(this, R.color.text_inverse))
                }
            }
        }
    }

    private fun setTelephonyComponentsEnabled(enabled: Boolean) {
        try {
            val state = if (enabled) {
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED
            } else {
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED
            }
            val flags = PackageManager.DONT_KILL_APP
            packageManager.setComponentEnabledSetting(
                ComponentName(this, CompanionInCallService::class.java),
                state,
                flags
            )
            packageManager.setComponentEnabledSetting(
                ComponentName(this, CallScreeningServiceImpl::class.java),
                state,
                flags
            )
            packageManager.setComponentEnabledSetting(
                ComponentName(this, IncomingCallReceiver::class.java),
                state,
                flags
            )
            NexusApplication.log("INFO", "Gateway", "Telephony components state updated: enabled=$enabled")
        } catch (e: Exception) {
            NexusApplication.log("WARN", "Gateway", "Failed to update component states: ${e.message}")
        }
    }

    private fun toggleGatewayConnection() {
        val state = CallBridgeForegroundService.connectionState
        when (state) {
            CallBridgeForegroundService.ConnectionState.DISCONNECTED,
            CallBridgeForegroundService.ConnectionState.ERROR -> {
                // Re-enable telephony components so Create Call acts as cellular gateway
                setTelephonyComponentsEnabled(true)

                // Check all essential telephony capabilities
                val isAllGranted = isPermGranted(Manifest.permission.READ_PHONE_STATE) &&
                        isPermGranted(Manifest.permission.CALL_PHONE) &&
                        isPermGranted(Manifest.permission.RECORD_AUDIO) &&
                        isPermGranted(Manifest.permission.READ_CALL_LOG) &&
                        isPermGranted(Manifest.permission.READ_CONTACTS) &&
                        isDialerRoleGranted() &&
                        isBatteryOptimizationExempt()

                if (!isAllGranted) {
                    Toast.makeText(this, "Granting all telephony capabilities for 1-tap setup...", Toast.LENGTH_SHORT).show()
                    executeMasterGrantAllFlow()
                }

                val url = etServerUrl.text.toString().trim()
                processPairingOrServerUrl(url)
            }
            CallBridgeForegroundService.ConnectionState.CONNECTING -> {
                Toast.makeText(this, "Connection in progress. Please wait...", Toast.LENGTH_SHORT).show()
            }
            CallBridgeForegroundService.ConnectionState.CONNECTED -> {
                val stopIntent = Intent(this, CallBridgeForegroundService::class.java).apply {
                    action = CallBridgeForegroundService.ACTION_STOP
                }
                startService(stopIntent)
                IncomingCallNotifier.stopRinging(this)
                handleConnectionStateTransition(CallBridgeForegroundService.ConnectionState.DISCONNECTED, "User Stopped Service")
                updateConnectionUi(CallBridgeForegroundService.ConnectionState.DISCONNECTED)
                tvDashUptime.text = "00:00:00"

                // Disable telephony components so Android routes all cellular calls to the native phone dialer
                setTelephonyComponentsEnabled(false)

                NexusApplication.log("INFO", "Gateway", "User initiated gateway disconnect. Telephony interception disabled & active sockets closed.")
                Toast.makeText(this, "Gateway Disconnected. Telephony interception disabled. Native phone calling restored.", Toast.LENGTH_LONG).show()
            }
        }
    }

    fun processPairingOrServerUrl(rawInput: String) {
        val cleanInput = rawInput.trim()
        if (cleanInput.isBlank()) {
            Toast.makeText(this, "Please enter a valid Create Call Gateway URL or scan QR code", Toast.LENGTH_SHORT).show()
            return
        }

        var targetUrl = cleanInput
        var pairingToken: String? = null
        var signature: String? = null

        // Handle JSON payload from QR scan e.g. {"server_url": "...", "token": "..."}
        if (cleanInput.startsWith("{") && cleanInput.endsWith("}")) {
            try {
                val json = JSONObject(cleanInput)
                targetUrl = json.optString("server_url", json.optString("url", json.optString("backend_ws_url", "")))
                if (targetUrl.isBlank()) {
                    val httpBase = json.optString("http_base_url", "")
                    if (httpBase.isNotBlank()) targetUrl = httpBase
                }
                pairingToken = if (json.has("token")) json.getString("token") else if (json.has("pairing_token")) json.getString("pairing_token") else null
                signature = if (json.has("sig")) json.getString("sig") else if (json.has("signature")) json.getString("signature") else null
            } catch (_: Exception) {}
        } else if (cleanInput.startsWith("nexuscall://")) {
            val uri = Uri.parse(cleanInput)
            targetUrl = uri.getQueryParameter("server_url") ?: uri.getQueryParameter("url") ?: ""
            pairingToken = uri.getQueryParameter("token")
            signature = uri.getQueryParameter("sig")
        }

        // Clean up redundant / duplicate protocol slashes e.g. ws://// or http:////
        targetUrl = targetUrl.replace(Regex("^(ws|wss|http|https):/+(.*)$")) { match ->
            "${match.groupValues[1]}://${match.groupValues[2]}"
        }

        // Strip frontend hash routing e.g. /#/mobile-gateway or /#/android-companion
        if (targetUrl.contains("/#")) {
            targetUrl = targetUrl.substringBefore("/#")
        }

        // Map local frontend port 3000 to backend port 8000 for direct API access
        if (targetUrl.contains(":3000") && (targetUrl.contains("192.168.") || targetUrl.contains("10.") || targetUrl.contains("127.0.0.1") || targetUrl.contains("localhost"))) {
            targetUrl = targetUrl.replace(":3000", ":8000")
        }

        // Add scheme if missing
        if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://") &&
            !targetUrl.startsWith("ws://") && !targetUrl.startsWith("wss://")) {
            val isCloudHost = targetUrl.contains(".trycloudflare.com") || targetUrl.contains(".pinggy.link") ||
                    targetUrl.contains(".lhr.life") || targetUrl.contains(".ngrok")
            if (isCloudHost) {
                targetUrl = "https://$targetUrl"
            } else {
                // If local IP without port, default to backend port 8000
                if (!targetUrl.contains(":") && (targetUrl.contains("192.168.") || targetUrl.contains("10.") || targetUrl.contains("127.0.0.1") || targetUrl.contains("localhost"))) {
                    targetUrl = "$targetUrl:8000"
                }
                targetUrl = "http://$targetUrl"
            }
        }

        val pureBase = targetUrl.substringBefore("/api/").trimEnd('/')
        val isSecure = pureBase.startsWith("https://") || pureBase.startsWith("wss://") ||
                pureBase.contains(".trycloudflare.com") || pureBase.contains(".lhr.life") ||
                pureBase.contains(".pinggy.link") || pureBase.contains(".ngrok") ||
                (!pureBase.contains("192.168.") && !pureBase.contains("10.") && !pureBase.contains("127.0.0.1") && !pureBase.contains("localhost") && !pureBase.contains(":8000"))

        val baseHttpUrl = if (isSecure) {
            pureBase.replace("wss://", "https://").replace("ws://", "https://").replace("http://", "https://")
        } else {
            pureBase.replace("ws://", "http://").replace("https://", "http://").replace("wss://", "http://")
        }

        val baseWsUrl = if (isSecure) {
            pureBase.replace("https://", "wss://").replace("http://", "wss://").replace("ws://", "wss://")
        } else {
            pureBase.replace("http://", "ws://").replace("https://", "ws://").replace("wss://", "ws://")
        }

        val fullWsUrl = "$baseWsUrl/api/android-gateway/ws/bridge"

        etServerUrl.setText(fullWsUrl)
        saveServerUrl(fullWsUrl)
        updatePresetButtonsHighlight(isSecure || fullWsUrl.contains(".trycloudflare.com"))

        updateConnectionUi(CallBridgeForegroundService.ConnectionState.CONNECTING)
        NexusApplication.log("INFO", "Pairing", "Verifying active Create Call backend at: $baseHttpUrl")

        lifecycleScope.launch {
            if (!pairingToken.isNullOrBlank()) {
                val devId = telemetryManager.getSnapshot().deviceId
                val devName = "${Build.MANUFACTURER} ${Build.MODEL}"
                val token = backendApiClient.exchangePairingToken(
                    baseUrl = baseHttpUrl,
                    pairingToken = pairingToken,
                    signature = signature ?: "",
                    deviceId = devId,
                    deviceName = devName
                )
                if (token != null) {
                    getSharedPreferences(PREFS_DEVICE, Context.MODE_PRIVATE)
                        .edit().putString("device_token", token).apply()
                    NexusApplication.log("INFO", "Pairing", "Pairing token exchanged successfully.")
                }
            }

            val overview = backendApiClient.fetchMobileOverview(baseHttpUrl)
            if (overview != null) {
                currentOverview = overview
                if (overview.activeAgents.isNotEmpty()) {
                    selectedAgent = overview.activeAgents.firstOrNull()
                    renderSelectedAgent(selectedAgent ?: overview.activeAgents[0])
                    populateAgentsList(overview.activeAgents)
                }
                renderAgentRecordings()

                // Save dynamic network SSOT URLs to preferences
                val prefs = getSharedPreferences(PREFS_DEVICE, Context.MODE_PRIVATE).edit()
                if (!overview.cloudTunnelWsUrl.isNullOrBlank()) {
                    prefs.putString("cloud_tunnel_ws_url", overview.cloudTunnelWsUrl)
                }
                if (!overview.localLanWsUrl.isNullOrBlank()) {
                    prefs.putString("local_lan_ws_url", overview.localLanWsUrl)
                }
                if (!overview.lanIp.isNullOrBlank()) {
                    prefs.putString("lan_ip", overview.lanIp)
                }
                prefs.putString("server_url", fullWsUrl)
                prefs.apply()

                NexusApplication.log("INFO", "Pairing", "✓ Backend verified! ${overview.activeAgents.size} Agents active.")
                Toast.makeText(this@MainActivity, "Connected to Create Call! Starting Gateway Bridge...", Toast.LENGTH_SHORT).show()
            } else {
                NexusApplication.log("WARN", "Pairing", "HTTP overview request timed out or unavailable. Proceeding with direct WebSocket bridge connection.")
            }

            val startIntent = Intent(this@MainActivity, CallBridgeForegroundService::class.java).apply {
                action = CallBridgeForegroundService.ACTION_START
                putExtra("server_url", fullWsUrl)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(startIntent)
            } else {
                startService(startIntent)
            }
        }
    }

    private fun handleDeepLink(intent: Intent) {
        val data: Uri? = intent.data
        if (data != null) {
            val urlString = data.toString()
            NexusApplication.log("INFO", "Pairing", "Deep link received: $urlString")
            processPairingOrServerUrl(urlString)
        }
    }

    // =========================================================================
    // Session History Persistence & Structured JSON Export
    // =========================================================================

    private fun loadPersistedSessionHistory() {
        val prefs = getSharedPreferences(PREFS_SESSIONS, Context.MODE_PRIVATE)
        val jsonStr = prefs.getString("history_json", "[]") ?: "[]"
        try {
            val arr = JSONArray(jsonStr)
            sessionHistory.clear()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                sessionHistory.add(
                    GatewaySession(
                        sessionId = obj.optString("sessionId"),
                        deviceId = obj.optString("deviceId"),
                        connectedAt = obj.optLong("connectedAt"),
                        disconnectedAt = obj.optLong("disconnectedAt"),
                        durationSeconds = obj.optLong("durationSeconds"),
                        status = obj.optString("status"),
                        disconnectReason = obj.optString("disconnectReason")
                    )
                )
            }
        } catch (e: Exception) {
            // Ignore parse errors
        }
    }

    private fun savePersistedSessionHistory() {
        val prefs = getSharedPreferences(PREFS_SESSIONS, Context.MODE_PRIVATE)
        val arr = JSONArray()
        sessionHistory.take(30).forEach { sess ->
            val obj = JSONObject().apply {
                put("sessionId", sess.sessionId)
                put("deviceId", sess.deviceId)
                put("connectedAt", sess.connectedAt)
                put("disconnectedAt", sess.disconnectedAt)
                put("durationSeconds", sess.durationSeconds)
                put("status", sess.status)
                put("disconnectReason", sess.disconnectReason)
            }
            arr.put(obj)
        }
        prefs.edit().putString("history_json", arr.toString()).apply()
    }

    private fun updateLogsView() {
        val localLogs = NexusApplication.getLogs().takeLast(40)
        val sb = StringBuilder()
        localLogs.forEach { entry ->
            val tagColor = when (entry.level) {
                "ERROR" -> "🔴"
                "WARN" -> "🟡"
                else -> "🟢"
            }
            sb.append("[${entry.formattedTime}] $tagColor ${entry.tag}: ${entry.message}\n")
        }
        tvTerminalLogs.text = sb.toString()

        val url = etServerUrl.text.toString().trim()
        lifecycleScope.launch {
            val remoteLogs = backendApiClient.fetchGatewayLogs(url, limit = 20)
            if (remoteLogs.isNotEmpty()) {
                val rsb = StringBuilder(sb.toString())
                rsb.append("\n--- CENTRAL GATEWAY SERVER EVENTS ---\n")
                remoteLogs.forEach { item ->
                    val ts = item.formattedTime
                    val lvl = item.level
                    val tag = item.tag
                    val msg = item.message
                    val icon = if (lvl == "ERROR") "🔴" else if (lvl == "WARN") "🟡" else "🟢"
                    rsb.append("[$ts] $icon $tag: $msg\n")
                }
                tvTerminalLogs.text = rsb.toString()
            }
        }
    }

    private fun exportStructuredJsonReport() {
        val snap = telemetryManager.getSnapshot()
        val subs = simManager.getActiveSubscriptions()
        val logs = callLogManager.getCallLogs(limit = 30)
        val events = NexusApplication.getLogs().takeLast(50)

        val root = JSONObject()

        // Device Object
        val devObj = JSONObject().apply {
            put("device_id", snap.deviceId)
            put("manufacturer", snap.manufacturer)
            put("model", snap.model)
            put("os_version", snap.osVersion)
            put("kernel_version", snap.kernelVersion)
            put("build_number", snap.buildNumber)
            put("security_patch", snap.securityPatch)
            put("total_ram", snap.totalRamGb)
            put("avail_ram", snap.availRamGb)
            put("total_storage", snap.totalStorageGb)
            put("avail_storage", snap.availStorageGb)
        }
        root.put("device", devObj)

        // Gateway Object
        val gtwObj = JSONObject().apply {
            put("connection_state", CallBridgeForegroundService.connectionState.name)
            put("server_url", etServerUrl.text.toString().trim())
            put("active_session_start_ms", sessionStartTimeMs)
            put("total_recorded_sessions", sessionHistory.size)
        }
        root.put("gateway", gtwObj)

        // Connection Sessions
        val sessArr = JSONArray()
        sessionHistory.forEach { s ->
            sessArr.put(
                JSONObject().apply {
                    put("session_id", s.sessionId)
                    put("device_id", s.deviceId)
                    put("connected_at", s.connectedAt)
                    put("disconnected_at", s.disconnectedAt)
                    put("duration_sec", s.durationSeconds)
                    put("status", s.status)
                    put("disconnect_reason", s.disconnectReason)
                }
            )
        }
        root.put("connection_sessions", sessArr)

        // Calls
        val callArr = JSONArray()
        logs.forEach { c ->
            callArr.put(
                JSONObject().apply {
                    put("number", c.number)
                    put("contact_name", c.contactName ?: JSONObject.NULL)
                    put("type", c.type.name)
                    put("timestamp_ms", c.timestamp)
                    put("duration_sec", c.durationSec)
                    put("formatted_time", c.formattedTime)
                }
            )
        }
        root.put("calls", callArr)

        // SIMs
        val simArr = JSONArray()
        subs.forEach { s ->
            simArr.put(
                JSONObject().apply {
                    put("sub_id", s.subId)
                    put("slot_index", s.slotIndex)
                    put("display_name", s.displayName)
                    put("carrier", s.carrierName)
                    put("number", s.number ?: JSONObject.NULL)
                    put("is_esim", s.isEsim)
                    put("is_active_for_calling", s.isSelectedForCalling)
                }
            )
        }
        root.put("sim_subscriptions", simArr)

        // Telemetry Snapshot
        val telObj = JSONObject().apply {
            put("battery_level", snap.batteryLevel)
            put("is_charging", snap.isCharging)
            put("signal_dbm", snap.signalDbm)
            put("carrier", snap.carrierName)
            put("network_type", snap.networkType)
            put("latency_ms", snap.latencyMs)
            put("upload_mbps", snap.uploadMbps)
            put("download_mbps", snap.downloadMbps)
        }
        root.put("telemetry", telObj)

        // Events
        val evArr = JSONArray()
        events.forEach { e ->
            evArr.put(
                JSONObject().apply {
                    put("level", e.level)
                    put("tag", e.tag)
                    put("time", e.formattedTime)
                    put("message", e.message)
                }
            )
        }
        root.put("events", evArr)

        val jsonString = root.toString(2)
        val sendIntent = Intent().apply {
            action = Intent.ACTION_SEND
            putExtra(Intent.EXTRA_TEXT, jsonString)
            type = "application/json"
        }
        startActivity(Intent.createChooser(sendIntent, "Export Nexus Telemetry JSON"))
    }
}
