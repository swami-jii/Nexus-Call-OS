package com.nexus.callos.companion.model

data class SimSubscriptionInfo(
    val subId: Int,
    val slotIndex: Int,
    val displayName: String,
    val carrierName: String,
    val number: String?,
    val isEsim: Boolean,
    val networkType: String,
    val signalDbm: Int,
    val signalLevel: Int,
    val isSelectedForCalling: Boolean,
    val mcc: Int = 0,
    val mnc: Int = 0,
    val countryIso: String = "",
    val isRoaming: Boolean = false,
    val isDefaultVoice: Boolean = false,
    val isDefaultData: Boolean = false,
    val isDefaultSms: Boolean = false
)
