package com.nexus.callos.companion.model

data class CallRecordingRecord(
    val id: String,
    val callId: String = "",
    val contactName: String? = null,
    val phoneNumber: String,
    val direction: String = "Incoming", // Incoming, Outgoing, Missed
    val timestamp: Long = System.currentTimeMillis(),
    val durationSec: Long = 0L,
    val filePath: String = "",
    val fileSizeBytes: Long = 0L,
    val simSlot: Int = 0,
    val simName: String = "SIM 1",
    val status: String = "COMPLETED", // COMPLETED, RECORDING, FAILED
    val formattedDate: String = "",
    val formattedDuration: String = "00:00",
    val formattedSize: String = "0 KB"
)
