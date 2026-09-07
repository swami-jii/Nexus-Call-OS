package com.nexus.callos.companion.model

enum class CallState {
    IDLE,
    DIALING,
    RINGING,
    ANSWERING,
    CONNECTED,
    HOLDING,
    ENDING,
    DISCONNECTED
}

data class CallSession(
    val state: CallState = CallState.IDLE,
    val callerNumber: String? = null,
    val callerName: String? = null,
    val contactPhotoUri: String? = null,
    val lineLabel: String? = null,
    val startTimeMs: Long = 0L,
    val durationSeconds: Long = 0L,
    val isMuted: Boolean = false,
    val isSpeakerOn: Boolean = false,
    val isOnHold: Boolean = false,
    val isIncoming: Boolean = true,
    val autoAnswerCountdown: Int = 0
)
