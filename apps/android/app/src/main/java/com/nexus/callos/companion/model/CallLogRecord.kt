package com.nexus.callos.companion.model

enum class CallLogType {
    INCOMING,
    OUTGOING,
    MISSED
}

data class CallLogRecord(
    val id: Long = 0L,
    val number: String,
    val normalizedNumber: String = "",
    val contactName: String? = null,
    val photoUri: String? = null,
    val type: CallLogType,
    val timestamp: Long,
    val durationSec: Long,
    val formattedTime: String,
    val formattedDuration: String,
    val dateFormattedLong: String = "",
    val simSlot: Int = -1,
    val phoneAccountId: String? = null,
    val simDisplayName: String? = null
)
