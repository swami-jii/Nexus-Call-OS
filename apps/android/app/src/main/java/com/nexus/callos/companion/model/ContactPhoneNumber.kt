package com.nexus.callos.companion.model

data class ContactPhoneNumber(
    val number: String,
    val normalizedNumber: String,
    val typeLabel: String = "Mobile",
    val isPrimary: Boolean = false
)
