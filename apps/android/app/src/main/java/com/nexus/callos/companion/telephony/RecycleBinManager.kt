package com.nexus.callos.companion.telephony

import android.content.Context
import com.nexus.callos.companion.NexusApplication
import com.nexus.callos.companion.model.CallLogRecord
import com.nexus.callos.companion.model.CallLogType
import com.nexus.callos.companion.model.CallRecordingRecord
import com.nexus.callos.companion.model.RecycleBinItem
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class RecycleBinManager(private val context: Context) {

    private val binFile = File(context.filesDir, "recycle_bin.json")
    private val dateFormat = SimpleDateFormat("MMM d, yyyy h:mm a", Locale.getDefault())

    @Synchronized
    fun getAllItems(): List<RecycleBinItem> {
        val list = mutableListOf<RecycleBinItem>()
        if (!binFile.exists()) return list

        try {
            val content = binFile.readText(Charsets.UTF_8)
            val arr = JSONArray(content)
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val id = obj.optString("id", "bin_$i")
                val itemType = obj.optString("itemType", "CALL_LOG")
                val deletedAt = obj.optLong("deletedAtTimestamp", System.currentTimeMillis())
                val formattedDate = obj.optString("formattedDeletedDate", dateFormat.format(Date(deletedAt)))

                var callRecord: CallLogRecord? = null
                if (obj.has("callLogRecord")) {
                    val cObj = obj.getJSONObject("callLogRecord")
                    callRecord = CallLogRecord(
                        id = cObj.optLong("id"),
                        number = cObj.optString("number"),
                        normalizedNumber = cObj.optString("normalizedNumber"),
                        contactName = cObj.optString("contactName").ifBlank { null },
                        photoUri = cObj.optString("photoUri").ifBlank { null },
                        type = when (cObj.optString("type")) {
                            "OUTGOING" -> CallLogType.OUTGOING
                            "MISSED" -> CallLogType.MISSED
                            else -> CallLogType.INCOMING
                        },
                        timestamp = cObj.optLong("timestamp"),
                        durationSec = cObj.optLong("durationSec"),
                        formattedTime = cObj.optString("formattedTime"),
                        formattedDuration = cObj.optString("formattedDuration"),
                        dateFormattedLong = cObj.optString("dateFormattedLong"),
                        simSlot = cObj.optInt("simSlot", -1),
                        phoneAccountId = cObj.optString("phoneAccountId").ifBlank { null }
                    )
                }

                var recRecord: CallRecordingRecord? = null
                if (obj.has("recordingRecord")) {
                    val rObj = obj.getJSONObject("recordingRecord")
                    recRecord = CallRecordingRecord(
                        id = rObj.optString("id"),
                        callId = rObj.optString("callId"),
                        contactName = rObj.optString("contactName").ifBlank { null },
                        phoneNumber = rObj.optString("phoneNumber"),
                        direction = rObj.optString("direction"),
                        timestamp = rObj.optLong("timestamp"),
                        durationSec = rObj.optLong("durationSec"),
                        filePath = rObj.optString("filePath"),
                        fileSizeBytes = rObj.optLong("fileSizeBytes"),
                        simSlot = rObj.optInt("simSlot", 0),
                        simName = rObj.optString("simName"),
                        status = rObj.optString("status"),
                        formattedDate = rObj.optString("formattedDate"),
                        formattedDuration = rObj.optString("formattedDuration"),
                        formattedSize = rObj.optString("formattedSize")
                    )
                }

                list.add(
                    RecycleBinItem(
                        id = id,
                        itemType = itemType,
                        callLogRecord = callRecord,
                        recordingRecord = recRecord,
                        deletedAtTimestamp = deletedAt,
                        formattedDeletedDate = formattedDate
                    )
                )
            }
        } catch (e: Exception) {
            NexusApplication.log("WARN", "RecycleBin", "Error loading recycle bin: ${e.message}")
        }
        return list.sortedByDescending { it.deletedAtTimestamp }
    }

    @Synchronized
    fun moveCallLogToRecycleBin(record: CallLogRecord) {
        val current = getAllItems().toMutableList()
        val item = RecycleBinItem(
            id = "call_${record.id}_${System.currentTimeMillis()}",
            itemType = "CALL_LOG",
            callLogRecord = record,
            deletedAtTimestamp = System.currentTimeMillis(),
            formattedDeletedDate = dateFormat.format(Date())
        )
        current.add(0, item)
        persistItems(current)
        NexusApplication.log("INFO", "RecycleBin", "Moved call log ID ${record.id} to Recycle Bin.")
    }

    @Synchronized
    fun moveRecordingToRecycleBin(record: CallRecordingRecord) {
        val current = getAllItems().toMutableList()
        val item = RecycleBinItem(
            id = "rec_${record.id}_${System.currentTimeMillis()}",
            itemType = "RECORDING",
            recordingRecord = record,
            deletedAtTimestamp = System.currentTimeMillis(),
            formattedDeletedDate = dateFormat.format(Date())
        )
        current.add(0, item)
        persistItems(current)
        NexusApplication.log("INFO", "RecycleBin", "Moved recording ID ${record.id} to Recycle Bin.")
    }

    @Synchronized
    fun restoreItem(
        id: String,
        callLogManager: CallLogManager,
        recordingManager: RecordingManager
    ): Boolean {
        val current = getAllItems().toMutableList()
        val found = current.find { it.id == id } ?: return false

        if (found.itemType == "RECORDING" && found.recordingRecord != null) {
            recordingManager.saveRecording(found.recordingRecord)
            NexusApplication.log("INFO", "RecycleBin", "Restored recording ${found.recordingRecord.id} from Recycle Bin.")
        } else if (found.itemType == "CALL_LOG" && found.callLogRecord != null) {
            // Restored in local state
            NexusApplication.log("INFO", "RecycleBin", "Restored call log ${found.callLogRecord.id} from Recycle Bin.")
        }

        current.remove(found)
        persistItems(current)
        return true
    }

    @Synchronized
    fun permanentlyDeleteItem(
        id: String,
        callLogManager: CallLogManager,
        recordingManager: RecordingManager
    ): Boolean {
        val current = getAllItems().toMutableList()
        val found = current.find { it.id == id } ?: return false

        if (found.itemType == "RECORDING" && found.recordingRecord != null) {
            recordingManager.deleteRecordingFileAndMeta(found.recordingRecord.id)
        } else if (found.itemType == "CALL_LOG" && found.callLogRecord != null) {
            callLogManager.deleteCallLogEntry(found.callLogRecord.id)
        }

        current.remove(found)
        persistItems(current)
        NexusApplication.log("INFO", "RecycleBin", "Permanently deleted recycle bin item ID $id")
        return true
    }

    @Synchronized
    fun emptyRecycleBin(
        callLogManager: CallLogManager,
        recordingManager: RecordingManager
    ): Int {
        val current = getAllItems()
        val count = current.size
        for (item in current) {
            if (item.itemType == "RECORDING" && item.recordingRecord != null) {
                recordingManager.deleteRecordingFileAndMeta(item.recordingRecord.id)
            } else if (item.itemType == "CALL_LOG" && item.callLogRecord != null) {
                callLogManager.deleteCallLogEntry(item.callLogRecord.id)
            }
        }
        persistItems(emptyList())
        NexusApplication.log("INFO", "RecycleBin", "Emptied Recycle Bin ($count items permanently removed).")
        return count
    }

    fun getItemCount(): Int = getAllItems().size

    private fun persistItems(list: List<RecycleBinItem>) {
        try {
            val arr = JSONArray()
            for (item in list) {
                val obj = JSONObject().apply {
                    put("id", item.id)
                    put("itemType", item.itemType)
                    put("deletedAtTimestamp", item.deletedAtTimestamp)
                    put("formattedDeletedDate", item.formattedDeletedDate)

                    if (item.callLogRecord != null) {
                        val c = item.callLogRecord
                        val cObj = JSONObject().apply {
                            put("id", c.id)
                            put("number", c.number)
                            put("normalizedNumber", c.normalizedNumber)
                            put("contactName", c.contactName ?: "")
                            put("photoUri", c.photoUri ?: "")
                            put("type", c.type.name)
                            put("timestamp", c.timestamp)
                            put("durationSec", c.durationSec)
                            put("formattedTime", c.formattedTime)
                            put("formattedDuration", c.formattedDuration)
                            put("dateFormattedLong", c.dateFormattedLong)
                            put("simSlot", c.simSlot)
                            put("phoneAccountId", c.phoneAccountId ?: "")
                        }
                        put("callLogRecord", cObj)
                    }

                    if (item.recordingRecord != null) {
                        val r = item.recordingRecord
                        val rObj = JSONObject().apply {
                            put("id", r.id)
                            put("callId", r.callId)
                            put("contactName", r.contactName ?: "")
                            put("phoneNumber", r.phoneNumber)
                            put("direction", r.direction)
                            put("timestamp", r.timestamp)
                            put("durationSec", r.durationSec)
                            put("filePath", r.filePath)
                            put("fileSizeBytes", r.fileSizeBytes)
                            put("simSlot", r.simSlot)
                            put("simName", r.simName)
                            put("status", r.status)
                            put("formattedDate", r.formattedDate)
                            put("formattedDuration", r.formattedDuration)
                            put("formattedSize", r.formattedSize)
                        }
                        put("recordingRecord", rObj)
                    }
                }
                arr.put(obj)
            }
            binFile.writeText(arr.toString(), Charsets.UTF_8)
        } catch (e: Exception) {
            NexusApplication.log("ERROR", "RecycleBin", "Failed to persist recycle bin: ${e.message}")
        }
    }
}
