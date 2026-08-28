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
import android.telephony.SubscriptionInfo
import android.telephony.SubscriptionManager
import android.util.Log
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.nexus.callos.companion.network.WebSocketBridgeClient
import com.nexus.callos.companion.telephony.CallBridgeService

class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "NexusMainActivity"
        private const val PERMISSION_REQUEST_CODE = 101
    }

    private lateinit var tvStatus: TextView
    private lateinit var tvServerIp: EditText
    private lateinit var btnConnect: Button
    private lateinit var btnPermissions: Button

    private var bridgeService: CallBridgeService? = null
    private var isBound = false

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            val binder = service as CallBridgeService.LocalBinder
            bridgeService = binder.getService()
            isBound = true
            updateUiState()

            bridgeService?.onStateChangedListener = { state, detail ->
                runOnUiThread {
                    handleConnectionStateChange(state, detail)
                }
            }
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            bridgeService = null
            isBound = false
            updateUiState()
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

        tvStatus = findViewById(R.id.tvStatus)
        tvServerIp = findViewById(R.id.tvServerIp)
        btnConnect = findViewById(R.id.btnConnect)
        btnPermissions = findViewById(R.id.btnPermissions)

        btnPermissions.setOnClickListener {
            requestAllPermissions()
        }

        btnConnect.setOnClickListener {
            toggleConnection()
        }

        checkAndRequestPermissions()
        discoverSimCards()
    }

    override fun onStart() {
        super.onStart()
        val intent = Intent(this, CallBridgeService::class.java)
        bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE)
    }

    override fun onStop() {
        super.onStop()
        if (isBound) {
            unbindService(serviceConnection)
            isBound = false
        }
    }

    private fun checkAndRequestPermissions() {
        val missing = requiredPermissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (missing.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, missing.toTypedArray(), PERMISSION_REQUEST_CODE)
        } else {
            requestIgnoreBatteryOptimization()
        }
    }

    private fun requestAllPermissions() {
        ActivityCompat.requestPermissions(this, requiredPermissions, PERMISSION_REQUEST_CODE)
        requestIgnoreBatteryOptimization()
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

    private fun discoverSimCards() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
            try {
                val subManager = getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as? SubscriptionManager
                val activeSubs: List<SubscriptionInfo>? = subManager?.activeSubscriptionInfoList
                if (!activeSubs.isNullOrEmpty()) {
                    val simInfo = activeSubs.joinToString(" | ") { sub ->
                        "SIM ${sub.simSlotIndex + 1}: ${sub.carrierName ?: "Carrier"}"
                    }
                    Log.d(TAG, "Discovered active SIMs: $simInfo")
                }
            } catch (e: Exception) {
                Log.w(TAG, "Could not query active subscriptions", e)
            }
        }
    }

    private fun toggleConnection() {
        if (bridgeService?.isRunning == true) {
            val stopIntent = Intent(this, CallBridgeService::class.java).apply {
                action = CallBridgeService.ACTION_STOP
            }
            startService(stopIntent)
            tvStatus.text = "Gateway Stopped"
            tvStatus.setTextColor(ContextCompat.getColor(this, R.color.text_secondary))
            btnConnect.text = "Start GSM Gateway Service"
        } else {
            val serverUrl = tvServerIp.text.toString().trim().ifEmpty {
                "ws://192.168.1.34:8000/api/android-gateway/ws/bridge"
            }

            val prefs = getSharedPreferences("nexus_companion_prefs", Context.MODE_PRIVATE)
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

            tvStatus.text = "Connecting to Nexus Call OS..."
            tvStatus.setTextColor(ContextCompat.getColor(this, R.color.primary))
            btnConnect.text = "Stop Gateway Service"
            Toast.makeText(this, "Nexus Gateway Service Started ($deviceId)!", Toast.LENGTH_SHORT).show()
        }
    }


    private fun handleConnectionStateChange(state: WebSocketBridgeClient.ConnectionState, detail: String?) {
        when (state) {
            WebSocketBridgeClient.ConnectionState.CONNECTED -> {
                tvStatus.text = "Connected & Active (Audio Bridge Online)"
                tvStatus.setTextColor(ContextCompat.getColor(this, R.color.primary))
                btnConnect.text = "Stop Gateway Service"
            }
            WebSocketBridgeClient.ConnectionState.CONNECTING -> {
                tvStatus.text = "Connecting..."
                tvStatus.setTextColor(ContextCompat.getColor(this, R.color.accent))
            }
            WebSocketBridgeClient.ConnectionState.RECONNECTING -> {
                tvStatus.text = detail ?: "Reconnecting..."
                tvStatus.setTextColor(ContextCompat.getColor(this, R.color.accent))
            }
            WebSocketBridgeClient.ConnectionState.DISCONNECTED -> {
                tvStatus.text = "Disconnected"
                tvStatus.setTextColor(ContextCompat.getColor(this, R.color.text_secondary))
                btnConnect.text = "Start GSM Gateway Service"
            }
        }
    }

    private fun updateUiState() {
        if (bridgeService?.isRunning == true) {
            btnConnect.text = "Stop Gateway Service"
            tvStatus.text = "Gateway Running"
            tvStatus.setTextColor(ContextCompat.getColor(this, R.color.primary))
        } else {
            btnConnect.text = "Start GSM Gateway Service"
            tvStatus.text = "Ready to Connect"
            tvStatus.setTextColor(ContextCompat.getColor(this, R.color.primary))
        }
    }
}
