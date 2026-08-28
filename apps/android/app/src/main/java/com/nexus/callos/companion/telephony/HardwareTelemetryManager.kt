package com.nexus.callos.companion.telephony

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.BatteryManager
import android.os.Build
import android.telephony.*
import android.util.Log
import androidx.core.content.ContextCompat
import org.json.JSONArray
import org.json.JSONObject

/**
 * Real Hardware & Telephony Telemetry Manager
 * Nexus Call OS v2.4 Native Android Gateway
 *
 * Exposes authentic device model, Android version, dynamic battery level,
 * real multi-SIM/eSIM subscriptions, live signal strength, and actual call state.
 */
class HardwareTelemetryManager(private val context: Context) {

    companion object {
        private const val TAG = "HardwareTelemetry"
        private const val PREFS_NAME = "nexus_companion_prefs"
        private const val KEY_SELECTED_SUB_ID = "selected_subscription_id"
    }

    data class SimSubscription(
        val slotIndex: Int,
        val subId: Int,
        val carrierName: String,
        val number: String?,
        val isEsim: Boolean,
        val signalDbm: Int,
        val signalLevel: Int, // 0 to 4
        val networkType: String
    )

    data class TelemetrySnapshot(
        val deviceModel: String,
        val androidVersion: String,
        val sdkInt: Int,
        val batteryPercent: Int,
        val isCharging: Boolean,
        val primaryNetworkType: String,
        val primarySignalDbm: Int,
        val subscriptions: List<SimSubscription>,
        val selectedSubId: Int,
        val callState: String
    )

    private val telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
    private val subscriptionManager = context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as? SubscriptionManager
    private val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    var currentCallState: String = "IDLE"
        private set

    var onTelemetryUpdated: ((TelemetrySnapshot) -> Unit)? = null

    private var currentBatteryPercent: Int = 100
    private var currentIsCharging: Boolean = false

    private val batteryReceiver = object : BroadcastReceiver() {
        override fun onReceive(ctx: Context?, intent: Intent?) {
            if (intent?.action == Intent.ACTION_BATTERY_CHANGED) {
                val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
                val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
                val status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)

                if (level >= 0 && scale > 0) {
                    currentBatteryPercent = (level * 100) / scale
                }
                currentIsCharging = (status == BatteryManager.BATTERY_STATUS_CHARGING ||
                        status == BatteryManager.BATTERY_STATUS_FULL)

                notifyTelemetryUpdated()
            }
        }
    }

    init {
        registerBatteryReceiver()
        registerCallStateListener()
    }

    private fun registerBatteryReceiver() {
        try {
            val filter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
            val sticky = context.registerReceiver(batteryReceiver, filter)
            if (sticky != null) {
                val level = sticky.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
                val scale = sticky.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
                val status = sticky.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
                if (level >= 0 && scale > 0) {
                    currentBatteryPercent = (level * 100) / scale
                }
                currentIsCharging = (status == BatteryManager.BATTERY_STATUS_CHARGING ||
                        status == BatteryManager.BATTERY_STATUS_FULL)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to register battery receiver", e)
        }
    }

    private fun registerCallStateListener() {
        if (telephonyManager == null) return
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                telephonyManager.registerTelephonyCallback(
                    context.mainExecutor,
                    object : TelephonyCallback(), TelephonyCallback.CallStateListener {
                        override fun onCallStateChanged(state: Int) {
                            currentCallState = when (state) {
                                TelephonyManager.CALL_STATE_RINGING -> "RINGING"
                                TelephonyManager.CALL_STATE_OFFHOOK -> "OFFHOOK"
                                else -> "IDLE"
                            }
                            notifyTelemetryUpdated()
                        }
                    }
                )
            } else {
                @Suppress("DEPRECATION")
                telephonyManager.listen(
                    object : PhoneStateListener() {
                        @Deprecated("Deprecated in Java")
                        override fun onCallStateChanged(state: Int, phoneNumber: String?) {
                            currentCallState = when (state) {
                                TelephonyManager.CALL_STATE_RINGING -> "RINGING"
                                TelephonyManager.CALL_STATE_OFFHOOK -> "OFFHOOK"
                                else -> "IDLE"
                            }
                            notifyTelemetryUpdated()
                        }
                    },
                    PhoneStateListener.LISTEN_CALL_STATE
                )
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to register call state listener", e)
        }
    }

    /**
     * Inspects actual physical and eSIM subscriptions from Android SubscriptionManager.
     */
    fun getSubscriptions(): List<SimSubscription> {
        val list = mutableListOf<SimSubscription>()
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
            return list
        }

        try {
            val activeSubs = subscriptionManager?.activeSubscriptionInfoList
            if (!activeSubs.isNullOrEmpty()) {
                for (sub in activeSubs) {
                    val isEsim = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                        sub.isEmbedded
                    } else {
                        false
                    }

                    // Query real phone number if permitted by carrier/OS, otherwise null
                    var phoneNumber: String? = null
                    try {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            val num = subscriptionManager?.getPhoneNumber(sub.subscriptionId)
                            if (!num.isNullOrBlank()) phoneNumber = num
                        } else {
                            @Suppress("DEPRECATION")
                            val num = sub.number
                            if (!num.isNullOrBlank()) phoneNumber = num
                        }
                    } catch (e: Exception) {
                        Log.d(TAG, "Phone number restricted by Android/Carrier for subId ${sub.subscriptionId}")
                    }

                    // Query signal strength for specific subscription where supported
                    val subTelephony = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                        telephonyManager?.createForSubscriptionId(sub.subscriptionId) ?: telephonyManager
                    } else {
                        telephonyManager
                    }

                    val signalInfo = getSignalForTelephony(subTelephony)
                    val netType = getNetworkTypeForTelephony(subTelephony)

                    list.add(
                        SimSubscription(
                            slotIndex = sub.simSlotIndex,
                            subId = sub.subscriptionId,
                            carrierName = sub.carrierName?.toString()?.ifBlank { "Cellular SIM" } ?: "Cellular SIM",
                            number = phoneNumber,
                            isEsim = isEsim,
                            signalDbm = signalInfo.first,
                            signalLevel = signalInfo.second,
                            networkType = netType
                        )
                    )
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Error querying active subscriptions", e)
        }

        return list
    }

    private fun getSignalForTelephony(tm: TelephonyManager?): Pair<Int, Int> {
        var dbm = -75
        var level = 3
        if (tm == null) return Pair(dbm, level)

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val signalStrength = tm.signalStrength
                if (signalStrength != null) {
                    level = signalStrength.level
                    for (cell in signalStrength.cellSignalStrengths) {
                        dbm = cell.dbm
                        if (dbm != CellInfo.UNAVAILABLE) break
                    }
                }
            }
        } catch (e: Exception) {
            Log.d(TAG, "Signal strength query fallback: ${e.message}")
        }
        return Pair(if (dbm == CellInfo.UNAVAILABLE) -75 else dbm, level)
    }

    private fun getNetworkTypeForTelephony(tm: TelephonyManager?): String {
        try {
            // Check Wi-Fi vs Cellular
            val activeNetwork = connectivityManager?.activeNetwork
            val caps = connectivityManager?.getNetworkCapabilities(activeNetwork)
            if (caps != null && caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                return "Wi-Fi (LAN Active)"
            }

            if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
                val dataNetworkType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    tm?.dataNetworkType ?: TelephonyManager.NETWORK_TYPE_UNKNOWN
                } else {
                    @Suppress("DEPRECATION")
                    tm?.networkType ?: TelephonyManager.NETWORK_TYPE_UNKNOWN
                }

                return when (dataNetworkType) {
                    TelephonyManager.NETWORK_TYPE_NR -> "5G Cellular"
                    TelephonyManager.NETWORK_TYPE_LTE -> "4G LTE"
                    TelephonyManager.NETWORK_TYPE_HSDPA,
                    TelephonyManager.NETWORK_TYPE_HSPA,
                    TelephonyManager.NETWORK_TYPE_HSPAP,
                    TelephonyManager.NETWORK_TYPE_UMTS -> "3G WCDMA"
                    TelephonyManager.NETWORK_TYPE_EDGE,
                    TelephonyManager.NETWORK_TYPE_GPRS -> "2G GSM"
                    else -> "5G / 4G Cellular"
                }
            }
        } catch (e: Exception) {
            Log.d(TAG, "Network type resolution fallback: ${e.message}")
        }
        return "Cellular Network"
    }

    fun getSelectedSubscriptionId(): Int {
        val saved = prefs.getInt(KEY_SELECTED_SUB_ID, -1)
        if (saved != -1) return saved
        val subs = getSubscriptions()
        return if (subs.isNotEmpty()) subs.first().subId else -1
    }

    fun setSelectedSubscriptionId(subId: Int) {
        prefs.edit().putInt(KEY_SELECTED_SUB_ID, subId).apply()
        notifyTelemetryUpdated()
    }

    fun getSnapshot(): TelemetrySnapshot {
        val subs = getSubscriptions()
        val primarySignal = if (subs.isNotEmpty()) subs.first().signalDbm else -75
        val primaryNet = if (subs.isNotEmpty()) subs.first().networkType else getNetworkTypeForTelephony(telephonyManager)

        val brand = Build.MANUFACTURER.replaceFirstChar { it.uppercase() }
        val model = Build.MODEL
        val fullName = if (model.startsWith(brand, ignoreCase = true)) model else "$brand $model"

        return TelemetrySnapshot(
            deviceModel = fullName,
            androidVersion = "Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})",
            sdkInt = Build.VERSION.SDK_INT,
            batteryPercent = currentBatteryPercent,
            isCharging = currentIsCharging,
            primaryNetworkType = primaryNet,
            primarySignalDbm = primarySignal,
            subscriptions = subs,
            selectedSubId = getSelectedSubscriptionId(),
            callState = currentCallState
        )
    }

    fun toJson(deviceId: String): JSONObject {
        val snap = getSnapshot()
        val selectedSub = snap.subscriptions.find { it.subId == snap.selectedSubId } ?: snap.subscriptions.firstOrNull()
        val autoAnswerEnabled = prefs.getBoolean("auto_answer_enabled", true)
        val autoAnswerDelay = prefs.getInt("auto_answer_delay_sec", 3)

        return JSONObject().apply {
            put("event", "TELEMETRY")
            put("device_id", deviceId)
            put("name", snap.deviceModel)
            put("model", snap.deviceModel)
            put("os_version", snap.androidVersion)
            put("sdk_int", snap.sdkInt)
            put("battery_level", snap.batteryPercent)
            put("is_charging", snap.isCharging)
            put("network_type", snap.primaryNetworkType)
            put("signal_dbm", snap.primarySignalDbm)
            put("carrier_name", selectedSub?.carrierName ?: "Cellular SIM")
            put("sim_number", selectedSub?.number ?: "")
            put("selected_sub_id", snap.selectedSubId)
            put("call_state", snap.callState)
            put("auto_answer", autoAnswerEnabled)
            put("auto_answer_delay_sec", autoAnswerDelay)
            put("timestamp", System.currentTimeMillis() / 1000)

            val subsArray = JSONArray()
            for (s in snap.subscriptions) {
                subsArray.put(JSONObject().apply {
                    put("slot_index", s.slotIndex)
                    put("sub_id", s.subId)
                    put("carrier_name", s.carrierName)
                    put("number", s.number ?: "")
                    put("is_esim", s.isEsim)
                    put("signal_dbm", s.signalDbm)
                    put("signal_level", s.signalLevel)
                    put("network_type", s.networkType)
                })
            }
            put("subscriptions", subsArray)
        }
    }


    private fun notifyTelemetryUpdated() {
        val snap = getSnapshot()
        onTelemetryUpdated?.invoke(snap)
    }

    fun unregister() {
        try {
            context.unregisterReceiver(batteryReceiver)
        } catch (e: Exception) {
            // ignore
        }
    }
}
