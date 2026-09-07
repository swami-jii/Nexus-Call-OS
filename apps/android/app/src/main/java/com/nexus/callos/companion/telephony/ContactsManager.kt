package com.nexus.callos.companion.telephony

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.ContactsContract
import androidx.core.content.ContextCompat
import com.nexus.callos.companion.NexusApplication
import com.nexus.callos.companion.model.CallLogRecord
import com.nexus.callos.companion.model.ContactPhoneNumber
import com.nexus.callos.companion.model.ContactRecord
import com.nexus.callos.companion.model.NumberSuggestion
import com.nexus.callos.companion.model.SuggestionSource
import java.util.Locale

class ContactsManager(private val context: Context) {

    private val contactCache = mutableMapOf<String, Pair<String?, String?>>()
    private var cachedContactsList: List<ContactRecord>? = null
    private var lastCacheTimestamp = 0L
    private val CACHE_TTL_MS = 60_000L // 1 minute cache TTL

    fun hasContactsPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.READ_CONTACTS
        ) == PackageManager.PERMISSION_GRANTED
    }

    fun getAllContacts(forceRefresh: Boolean = false): List<ContactRecord> {
        if (!hasContactsPermission()) {
            return emptyList()
        }

        val now = System.currentTimeMillis()
        if (!forceRefresh && cachedContactsList != null && (now - lastCacheTimestamp) < CACHE_TTL_MS) {
            return cachedContactsList!!
        }

        val contactsMap = LinkedHashMap<Long, ContactRecordBuilder>()

        try {
            val projection = arrayOf(
                ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
                ContactsContract.CommonDataKinds.Phone.LOOKUP_KEY,
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME_PRIMARY,
                ContactsContract.CommonDataKinds.Phone.NUMBER,
                ContactsContract.CommonDataKinds.Phone.NORMALIZED_NUMBER,
                ContactsContract.CommonDataKinds.Phone.TYPE,
                ContactsContract.CommonDataKinds.Phone.LABEL,
                ContactsContract.CommonDataKinds.Phone.PHOTO_URI,
                ContactsContract.CommonDataKinds.Phone.PHOTO_THUMBNAIL_URI,
                ContactsContract.CommonDataKinds.Phone.STARRED
            )

            val sortOrder = "${ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME_PRIMARY} COLLATE NOCASE ASC"

            val cursor = context.contentResolver.query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                projection,
                null,
                null,
                sortOrder
            )

            cursor?.use { c ->
                val idIdx = c.getColumnIndex(ContactsContract.CommonDataKinds.Phone.CONTACT_ID)
                val keyIdx = c.getColumnIndex(ContactsContract.CommonDataKinds.Phone.LOOKUP_KEY)
                val nameIdx = c.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME_PRIMARY)
                val numIdx = c.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)
                val normIdx = c.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NORMALIZED_NUMBER)
                val typeIdx = c.getColumnIndex(ContactsContract.CommonDataKinds.Phone.TYPE)
                val labelIdx = c.getColumnIndex(ContactsContract.CommonDataKinds.Phone.LABEL)
                val photoIdx = c.getColumnIndex(ContactsContract.CommonDataKinds.Phone.PHOTO_URI)
                val thumbIdx = c.getColumnIndex(ContactsContract.CommonDataKinds.Phone.PHOTO_THUMBNAIL_URI)
                val starIdx = c.getColumnIndex(ContactsContract.CommonDataKinds.Phone.STARRED)

                while (c.moveToNext()) {
                    val contactId = if (idIdx != -1) c.getLong(idIdx) else continue
                    val lookupKey = if (keyIdx != -1) c.getString(keyIdx) ?: "" else ""
                    val name = if (nameIdx != -1) c.getString(nameIdx)?.trim()?.ifBlank { "Unknown Contact" } ?: "Unknown Contact" else "Unknown Contact"
                    val rawNum = if (numIdx != -1) c.getString(numIdx) ?: "" else ""
                    if (rawNum.isBlank()) continue

                    val normNum = if (normIdx != -1) c.getString(normIdx)?.ifBlank { normalizeNumber(rawNum) } ?: normalizeNumber(rawNum) else normalizeNumber(rawNum)
                    val rawType = if (typeIdx != -1) c.getInt(typeIdx) else ContactsContract.CommonDataKinds.Phone.TYPE_MOBILE
                    val customLabel = if (labelIdx != -1) c.getString(labelIdx) else null
                    val photoUri = if (photoIdx != -1) c.getString(photoIdx) else null
                    val thumbUri = if (thumbIdx != -1) c.getString(thumbIdx) else null
                    val isStarred = if (starIdx != -1) c.getInt(starIdx) == 1 else false

                    val typeLabel = ContactsContract.CommonDataKinds.Phone.getTypeLabel(
                        context.resources,
                        rawType,
                        customLabel ?: ""
                    ).toString()

                    val phoneEntry = ContactPhoneNumber(
                        number = rawNum,
                        normalizedNumber = normNum,
                        typeLabel = typeLabel,
                        isPrimary = false
                    )

                    val builder = contactsMap.getOrPut(contactId) {
                        ContactRecordBuilder(
                            id = contactId,
                            lookupKey = lookupKey,
                            displayName = name,
                            photoUri = photoUri,
                            thumbnailUri = thumbUri,
                            isStarred = isStarred
                        )
                    }
                    builder.phoneNumbers.add(phoneEntry)
                }
            }
        } catch (e: Exception) {
            NexusApplication.log("ERROR", "ContactsManager", "Failed to query device contacts: ${e.message}")
        }

        val result = contactsMap.values.map { it.build() }
        cachedContactsList = result
        lastCacheTimestamp = now

        // Pre-warm lookup cache
        result.forEach { contact ->
            contact.phoneNumbers.forEach { pn ->
                contactCache[pn.number] = Pair(contact.displayName, contact.photoUri ?: contact.thumbnailUri)
                if (pn.normalizedNumber.isNotBlank()) {
                    contactCache[pn.normalizedNumber] = Pair(contact.displayName, contact.photoUri ?: contact.thumbnailUri)
                }
            }
        }

        return result
    }

    fun searchContacts(query: String): List<ContactRecord> {
        val all = getAllContacts()
        if (query.isBlank()) return all

        val cleanQuery = query.trim().lowercase(Locale.getDefault())
        val digitQuery = query.filter { it.isDigit() }

        return all.filter { contact ->
            contact.displayName.lowercase(Locale.getDefault()).contains(cleanQuery) ||
            contact.phoneNumbers.any { pn ->
                pn.number.contains(cleanQuery) ||
                (digitQuery.isNotEmpty() && pn.normalizedNumber.contains(digitQuery))
            }
        }
    }

    fun getSuggestionsForDigits(inputDigits: String, recentCalls: List<CallLogRecord>): List<NumberSuggestion> {
        if (inputDigits.isBlank()) return emptyList()

        val cleanQuery = inputDigits.trim().lowercase(Locale.getDefault())
        val digitQuery = inputDigits.filter { it.isDigit() || it == '+' }
        val rawDigitsOnly = inputDigits.filter { it.isDigit() }

        val suggestions = mutableListOf<NumberSuggestion>()
        val seenNumbers = mutableSetOf<String>()

        // 1. Match against device contacts
        val contacts = getAllContacts()
        for (contact in contacts) {
            val nameMatches = contact.displayName.lowercase(Locale.getDefault()).contains(cleanQuery)
            for (pn in contact.phoneNumbers) {
                val numDigits = pn.number.filter { it.isDigit() }
                val numberMatches = if (rawDigitsOnly.isNotEmpty()) {
                    numDigits.contains(rawDigitsOnly) || pn.normalizedNumber.contains(digitQuery)
                } else {
                    pn.number.contains(cleanQuery)
                }

                if (nameMatches || numberMatches) {
                    val key = normalizeNumber(pn.number)
                    if (!seenNumbers.contains(key)) {
                        seenNumbers.add(key)
                        suggestions.add(
                            NumberSuggestion(
                                displayName = contact.displayName,
                                phoneNumber = pn.number,
                                normalizedNumber = pn.normalizedNumber,
                                typeLabel = pn.typeLabel,
                                source = SuggestionSource.CONTACT,
                                photoUri = contact.photoUri ?: contact.thumbnailUri,
                                contactId = contact.id
                            )
                        )
                    }
                }
            }
        }

        // 2. Match against recent call records
        for (recent in recentCalls) {
            val numDigits = recent.number.filter { it.isDigit() }
            val nameMatches = recent.contactName?.lowercase(Locale.getDefault())?.contains(cleanQuery) == true
            val numberMatches = if (rawDigitsOnly.isNotEmpty()) {
                numDigits.contains(rawDigitsOnly) || recent.normalizedNumber.contains(digitQuery)
            } else {
                recent.number.contains(cleanQuery)
            }

            if (nameMatches || numberMatches) {
                val key = normalizeNumber(recent.number)
                if (!seenNumbers.contains(key)) {
                    seenNumbers.add(key)
                    suggestions.add(
                        NumberSuggestion(
                            displayName = recent.contactName ?: recent.number,
                            phoneNumber = recent.number,
                            normalizedNumber = recent.normalizedNumber.ifBlank { key },
                            typeLabel = "Recent ${recent.type.name.lowercase().replaceFirstChar { it.uppercase() }}",
                            source = SuggestionSource.RECENT_CALL,
                            photoUri = recent.photoUri,
                            callType = recent.type,
                            timestamp = recent.timestamp
                        )
                    )
                }
            }
        }

        return suggestions.take(20)
    }

    fun resolveContact(number: String): Pair<String?, String?> {
        if (number.isBlank() || number == "Unknown Caller") return Pair(null, null)

        contactCache[number]?.let { return it }
        val norm = normalizeNumber(number)
        contactCache[norm]?.let { return it }

        var name: String? = null
        var photoUri: String? = null

        if (hasContactsPermission()) {
            try {
                val uri = Uri.withAppendedPath(
                    ContactsContract.PhoneLookup.CONTENT_FILTER_URI,
                    Uri.encode(number)
                )
                val projection = arrayOf(
                    ContactsContract.PhoneLookup.DISPLAY_NAME,
                    ContactsContract.PhoneLookup.PHOTO_THUMBNAIL_URI
                )
                val cursor = context.contentResolver.query(uri, projection, null, null, null)
                cursor?.use { c ->
                    if (c.moveToFirst()) {
                        val nameIdx = c.getColumnIndex(ContactsContract.PhoneLookup.DISPLAY_NAME)
                        val photoIdx = c.getColumnIndex(ContactsContract.PhoneLookup.PHOTO_THUMBNAIL_URI)
                        if (nameIdx != -1) {
                            name = c.getString(nameIdx)?.ifBlank { null }
                        }
                        if (photoIdx != -1) {
                            photoUri = c.getString(photoIdx)?.ifBlank { null }
                        }
                    }
                }
            } catch (e: Exception) {
                // Ignore lookup errors for invalid formats
            }
        }

        val result = Pair(name, photoUri)
        contactCache[number] = result
        contactCache[norm] = result
        return result
    }

    fun resolveContactName(phoneNumber: String): String? {
        return resolveContact(phoneNumber).first
    }

    fun resolveContactPhotoUri(phoneNumber: String): String? {
        return resolveContact(phoneNumber).second
    }

    fun getSuggestions(inputDigits: String, recentCalls: List<CallLogRecord>, maxResults: Int = 5): List<NumberSuggestion> {
        return getSuggestionsForDigits(inputDigits, recentCalls).take(maxResults)
    }

    fun invalidateCache() {
        cachedContactsList = null
        contactCache.clear()
        lastCacheTimestamp = 0L
    }

    companion object {
        fun normalizeNumber(number: String): String {
            val digits = number.filter { it.isDigit() || it == '+' }
            // Handle +91 or other international prefixes for local matching
            if (digits.startsWith("+91") && digits.length > 10) {
                return digits.substring(3)
            }
            if (digits.startsWith("0") && digits.length == 11) {
                return digits.substring(1)
            }
            return digits
        }

        fun formatPhoneNumber(raw: String): String {
            val digits = raw.filter { it.isDigit() }
            return when {
                digits.length == 10 -> {
                    "${digits.substring(0, 5)} ${digits.substring(5)}"
                }
                digits.length == 11 && digits.startsWith("0") -> {
                    "0${digits.substring(1, 6)} ${digits.substring(6)}"
                }
                digits.length == 12 && digits.startsWith("91") -> {
                    "+91 ${digits.substring(2, 7)} ${digits.substring(7)}"
                }
                else -> raw
            }
        }
    }

    private class ContactRecordBuilder(
        val id: Long,
        val lookupKey: String,
        val displayName: String,
        val photoUri: String?,
        val thumbnailUri: String?,
        val isStarred: Boolean
    ) {
        val phoneNumbers = mutableListOf<ContactPhoneNumber>()

        fun build(): ContactRecord {
            return ContactRecord(
                id = id,
                lookupKey = lookupKey,
                displayName = displayName,
                photoUri = photoUri,
                thumbnailUri = thumbnailUri,
                phoneNumbers = phoneNumbers.toList(),
                isStarred = isStarred
            )
        }
    }
}
