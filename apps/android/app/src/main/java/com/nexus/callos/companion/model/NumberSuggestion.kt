package com.nexus.callos.companion.model

enum class SuggestionSource {
    CONTACT,
    RECENT_CALL
}

data class NumberSuggestion(
    val displayName: String,
    val phoneNumber: String,
    val normalizedNumber: String,
    val typeLabel: String,
    val source: SuggestionSource,
    val photoUri: String? = null,
    val contactId: Long? = null,
    val callType: CallLogType? = null,
    val timestamp: Long = 0L
)
