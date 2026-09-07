package com.nexus.callos.companion.model

data class ContactRecord(
    val id: Long,
    val lookupKey: String,
    val displayName: String,
    val photoUri: String? = null,
    val thumbnailUri: String? = null,
    val phoneNumbers: List<ContactPhoneNumber> = emptyList(),
    val isStarred: Boolean = false,
    val primaryNumber: String = phoneNumbers.firstOrNull()?.number ?: ""
)
