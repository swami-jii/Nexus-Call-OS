package com.nexus.callos.companion.telephony

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.provider.CallLog
import androidx.core.content.ContextCompat
import com.nexus.callos.companion.NexusApplication
import com.nexus.callos.companion.model.CallLogRecord
import com.nexus.callos.companion.model.CallLogType
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class CallLogManager(
    private val context: Context,
    private val contactsManager: ContactsManager = ContactsManager(context)
) {

    fun hasCallLogPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.READ_CALL_LOG
        ) == PackageManager.PERMISSION_GRANTED
    }

    fun getCallLogs(
        filterType: CallLogType? = null,
        searchQuery: String? = null,
        limit: Int = 60
    ): List<CallLogRecord> {
        if (!hasCallLogPermission()) {
            NexusApplication.log("WARN", "CallLog", "READ_CALL_LOG permission not granted yet.")
            return emptyList()
        }

        val records = mutableListOf<CallLogRecord>()
        val timeFormat = SimpleDateFormat("h:mm a", Locale.getDefault())
        val dateFormat = SimpleDateFormat("MMM d, h:mm a", Locale.getDefault())
        val fullDateFormat = SimpleDateFormat("EEEE, MMMM d, yyyy 'at' h:mm:ss a", Locale.getDefault())
        val now = System.currentTimeMillis()

        try {
            val projection = arrayOf(
                CallLog.Calls._ID,
                CallLog.Calls.NUMBER,
                CallLog.Calls.TYPE,
                CallLog.Calls.DATE,
                CallLog.Calls.DURATION,
                CallLog.Calls.CACHED_NAME,
                CallLog.Calls.PHONE_ACCOUNT_ID
            )

            val sortOrder = "${CallLog.Calls.DATE} DESC"
            val cursor = context.contentResolver.query(
                CallLog.Calls.CONTENT_URI,
                projection,
                null,
                null,
                sortOrder
            )

            cursor?.use { c ->
                val idIdx = c.getColumnIndex(CallLog.Calls._ID)
                val numIdx = c.getColumnIndex(CallLog.Calls.NUMBER)
                val typeIdx = c.getColumnIndex(CallLog.Calls.TYPE)
                val dateIdx = c.getColumnIndex(CallLog.Calls.DATE)
                val durIdx = c.getColumnIndex(CallLog.Calls.DURATION)
                val nameIdx = c.getColumnIndex(CallLog.Calls.CACHED_NAME)
                val accIdx = c.getColumnIndex(CallLog.Calls.PHONE_ACCOUNT_ID)

                while (c.moveToNext() && records.size < limit) {
                    val logId = if (idIdx != -1) c.getLong(idIdx) else 0L
                    val rawNumber = if (numIdx != -1) c.getString(numIdx) ?: "Unknown Caller" else "Unknown Caller"
                    val rawType = if (typeIdx != -1) c.getInt(typeIdx) else CallLog.Calls.INCOMING_TYPE
                    val dateMs = if (dateIdx != -1) c.getLong(dateIdx) else 0L
                    val durationSec = if (durIdx != -1) c.getLong(durIdx) else 0L
                    val cachedName = if (nameIdx != -1) c.getString(nameIdx)?.ifBlank { null } else null
                    val accountId = if (accIdx != -1) c.getString(accIdx)?.ifBlank { null } else null

                    val recordType = when (rawType) {
                        CallLog.Calls.OUTGOING_TYPE -> CallLogType.OUTGOING
                        CallLog.Calls.MISSED_TYPE, CallLog.Calls.REJECTED_TYPE, CallLog.Calls.BLOCKED_TYPE -> CallLogType.MISSED
                        else -> CallLogType.INCOMING
                    }

                    if (filterType != null && recordType != filterType) {
                        continue
                    }

                    val normalizedNum = ContactsManager.normalizeNumber(rawNumber)

                    // Resolve contact info
                    var resolvedName = cachedName
                    var resolvedPhotoUri: String? = null

                    if (rawNumber.isNotBlank() && rawNumber != "Unknown Caller") {
                        val contactPair = contactsManager.resolveContact(rawNumber)
                        if (contactPair.first != null) {
                            resolvedName = contactPair.first
                        }
                        resolvedPhotoUri = contactPair.second
                    }

                    // Search filter check if query provided
                    if (!searchQuery.isNullOrBlank()) {
                        val q = searchQuery.trim().lowercase(Locale.getDefault())
                        val qDigits = searchQuery.filter { it.isDigit() }
                        val nameMatch = resolvedName?.lowercase(Locale.getDefault())?.contains(q) == true
                        val numMatch = rawNumber.lowercase(Locale.getDefault()).contains(q)
                        val normMatch = qDigits.isNotEmpty() && normalizedNum.contains(qDigits)

                        if (!nameMatch && !numMatch && !normMatch) {
                            continue
                        }
                    }

                    val dateObj = Date(dateMs)
                    val formattedDate = if (now - dateMs < 24 * 3600 * 1000L) {
                        timeFormat.format(dateObj)
                    } else {
                        dateFormat.format(dateObj)
                    }
                    val formattedFullDate = fullDateFormat.format(dateObj)

                    val m = durationSec / 60
                    val s = durationSec % 60
                    val formattedDuration = String.format(Locale.US, "%02d:%02d", m, s)

                    records.add(
                        CallLogRecord(
                            id = logId,
                            number = rawNumber,
                            normalizedNumber = normalizedNum,
                            contactName = resolvedName,
                            photoUri = resolvedPhotoUri,
                            type = recordType,
                            timestamp = dateMs,
                            durationSec = durationSec,
                            formattedTime = formattedDate,
                            formattedDuration = formattedDuration,
                            dateFormattedLong = formattedFullDate,
                            simSlot = -1,
                            phoneAccountId = accountId
                        )
                    )
                }
            }
        } catch (e: Exception) {
            NexusApplication.log("ERROR", "CallLog", "Failed to query call logs: ${e.message}")
        }

        return records
    }

    fun deleteCallLogEntry(id: Long): Boolean {
        return try {
            val uri = CallLog.Calls.CONTENT_URI
            val rows = context.contentResolver.delete(uri, "${CallLog.Calls._ID} = ?", arrayOf(id.toString()))
            NexusApplication.log("INFO", "CallLog", "Deleted call log ID $id (rows deleted=$rows)")
            rows > 0
        } catch (e: Exception) {
            NexusApplication.log("ERROR", "CallLog", "Failed to delete call log ID $id: ${e.message}")
            false
        }
    }
}
