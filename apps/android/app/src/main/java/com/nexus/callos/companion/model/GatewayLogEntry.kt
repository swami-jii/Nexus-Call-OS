package com.nexus.callos.companion.model

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class GatewayLogEntry(
    val timestampMs: Long = System.currentTimeMillis(),
    val level: String = "INFO",
    val tag: String,
    val message: String
) {
    val formattedTime: String
        get() = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date(timestampMs))

    val displayString: String
        get() = "[$formattedTime] $level $tag: $message"
}
