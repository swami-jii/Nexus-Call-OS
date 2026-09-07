package com.nexus.callos.companion.model

data class RecycleBinItem(
    val id: String,
    val itemType: String, // "CALL_LOG" or "RECORDING"
    val callLogRecord: CallLogRecord? = null,
    val recordingRecord: CallRecordingRecord? = null,
    val deletedAtTimestamp: Long = System.currentTimeMillis(),
    val formattedDeletedDate: String = ""
)
