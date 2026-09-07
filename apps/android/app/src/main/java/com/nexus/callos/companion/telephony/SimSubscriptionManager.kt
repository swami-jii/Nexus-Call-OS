package com.nexus.callos.companion.telephony

import android.content.Context
import android.os.Build
import android.telephony.SubscriptionInfo
import android.telephony.SubscriptionManager
import androidx.core.content.ContextCompat
import com.nexus.callos.companion.NexusApplication
import com.nexus.callos.companion.model.SimSubscriptionInfo

class SimSubscriptionManager(private val context: Context) {

    private val subscriptionManager: SubscriptionManager? =
        context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as? SubscriptionManager

    private val prefs = context.getSharedPreferences("nexus_telephony_prefs", Context.MODE_PRIVATE)

    var onSubscriptionsChanged: ((List<SimSubscriptionInfo>, Int) -> Unit)? = null

    init {
        registerSubscriptionListener()
    }

    private fun registerSubscriptionListener() {
        if (subscriptionManager != null) {
            val listener = object : SubscriptionManager.OnSubscriptionsChangedListener() {
                override fun onSubscriptionsChanged() {
                    notifySubscriptions()
                }
            }
            try {
                subscriptionManager.addOnSubscriptionsChangedListener(listener)
            } catch (e: Exception) {
                NexusApplication.log("WARN", "SimManager", "Error registering subscriptions listener: ${e.message}")
            }
        }
    }

    fun getSelectedSubscriptionId(): Int {
        return prefs.getInt("selected_calling_sub_id", SubscriptionManager.getDefaultSubscriptionId())
    }

    fun setSelectedSubscriptionId(subId: Int) {
        prefs.edit().putInt("selected_calling_sub_id", subId).apply()
        notifySubscriptions()
        NexusApplication.log("INFO", "SimManager", "Selected active calling SIM subscription ID: $subId")
    }

    fun getActiveSubscriptions(): List<SimSubscriptionInfo> {
        val hasPermission = ContextCompat.checkSelfPermission(
            context,
            android.Manifest.permission.READ_PHONE_STATE
        ) == android.content.pm.PackageManager.PERMISSION_GRANTED

        if (!hasPermission || subscriptionManager == null) {
            return emptyList()
        }

        val rawList: List<SubscriptionInfo>? = try {
            subscriptionManager.activeSubscriptionInfoList
        } catch (e: Exception) {
            NexusApplication.log("WARN", "SimManager", "Failed to query active subscriptions: ${e.message}")
            null
        }

        if (rawList.isNullOrEmpty()) {
            return emptyList()
        }

        val selectedSubId = getSelectedSubscriptionId()

        return rawList.map { info ->
            val isEsim = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                info.isEmbedded
            } else {
                false
            }

            val num = try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                    ContextCompat.checkSelfPermission(context, android.Manifest.permission.READ_PHONE_NUMBERS)
                    == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                    subscriptionManager.getPhoneNumber(info.subscriptionId).ifBlank { null }
                } else {
                    info.number?.ifBlank { null }
                }
            } catch (e: Exception) {
                null
            }

            val carrier = info.carrierName?.toString()?.ifBlank {
                info.displayName?.toString()?.ifBlank { "Cellular Network" }
            } ?: "Cellular Network"

            val isSelected = if (selectedSubId == SubscriptionManager.INVALID_SUBSCRIPTION_ID) {
                info.simSlotIndex == 0
            } else {
                info.subscriptionId == selectedSubId
            }

            val defaultVoiceSubId = getDefaultVoiceSubscriptionId()
            val defaultDataSubId = getDefaultDataSubscriptionId()
            val defaultSmsSubId = getDefaultSmsSubscriptionId()

            val mccVal = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                try { info.mccString?.toIntOrNull() ?: 0 } catch (e: Exception) { 0 }
            } else {
                @Suppress("DEPRECATION")
                info.mcc
            }

            val mncVal = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                try { info.mncString?.toIntOrNull() ?: 0 } catch (e: Exception) { 0 }
            } else {
                @Suppress("DEPRECATION")
                info.mnc
            }

            val isRoaming = info.dataRoaming == SubscriptionManager.DATA_ROAMING_ENABLE

            SimSubscriptionInfo(
                subId = info.subscriptionId,
                slotIndex = info.simSlotIndex,
                displayName = info.displayName?.toString() ?: "SIM ${info.simSlotIndex + 1}",
                carrierName = carrier,
                number = num,
                isEsim = isEsim,
                networkType = if (isEsim) "eSIM Profile" else "Physical SIM",
                signalDbm = -80,
                signalLevel = 4,
                isSelectedForCalling = isSelected,
                mcc = mccVal,
                mnc = mncVal,
                countryIso = info.countryIso ?: "",
                isRoaming = isRoaming,
                isDefaultVoice = info.subscriptionId == defaultVoiceSubId,
                isDefaultData = info.subscriptionId == defaultDataSubId,
                isDefaultSms = info.subscriptionId == defaultSmsSubId
            )
        }
    }

    fun getDefaultVoiceSubscriptionId(): Int {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            SubscriptionManager.getDefaultVoiceSubscriptionId()
        } else {
            SubscriptionManager.getDefaultSubscriptionId()
        }
    }

    fun getDefaultDataSubscriptionId(): Int {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            SubscriptionManager.getDefaultDataSubscriptionId()
        } else {
            SubscriptionManager.getDefaultSubscriptionId()
        }
    }

    fun getDefaultSmsSubscriptionId(): Int {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            SubscriptionManager.getDefaultSmsSubscriptionId()
        } else {
            SubscriptionManager.getDefaultSubscriptionId()
        }
    }

    fun notifySubscriptions() {
        val subs = getActiveSubscriptions()
        val selected = getSelectedSubscriptionId()
        onSubscriptionsChanged?.invoke(subs, selected)
    }
}
