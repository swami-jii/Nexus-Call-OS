package com.nexus.callos.companion.model

data class GatewaySession(
    val sessionId: String,
    val deviceId: String,
    val connectedAt: Long,
    val disconnectedAt: Long,
    val durationSeconds: Long,
    val status: String,
    val disconnectReason: String? = null
)
