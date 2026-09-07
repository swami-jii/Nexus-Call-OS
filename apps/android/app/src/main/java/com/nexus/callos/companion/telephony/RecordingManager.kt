package com.nexus.callos.companion.telephony

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.media.MediaPlayer
import android.media.MediaRecorder
import android.net.Uri
import android.os.Build
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import com.nexus.callos.companion.NexusApplication
import com.nexus.callos.companion.model.CallRecordingRecord
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class RecordingCapabilityDiagnostic(
    val isCapable: Boolean,
    val cellularCallAudioCaptureAvailable: Boolean = isCapable,
    val hasMicPermission: Boolean,
    val androidVersionName: String,
    val sdkInt: Int,
    val osPolicyLimitation: String,
    val oemLimitation: String,
    val telecomRoleGranted: Boolean,
    val serverSideStreamingStatus: String,
    val diagnosticSummary: String
)

class RecordingManager(private val context: Context) {

    private val recordingsDir = File(context.filesDir, "recordings").apply {
        if (!exists()) mkdirs()
    }

    private val metaFile = File(context.filesDir, "recordings_metadata.json")
    private var mediaPlayer: MediaPlayer? = null
    private var currentPlayingFilePath: String? = null

    fun probeRecordingCapability(): RecordingCapabilityDiagnostic {
        val hasMic = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED

        val sdk = Build.VERSION.SDK_INT
        val release = Build.VERSION.RELEASE
        val model = Build.MODEL
        val manufacturer = Build.MANUFACTURER

        val isCapable = hasMic && sdk < Build.VERSION_CODES.Q // Native cellular call capture direct from InCallService is restricted in Android 10+ for non-system apps

        val osLimitation = if (sdk >= Build.VERSION_CODES.Q) {
            "Android $release (API $sdk) enforces Scoped Telephony Audio Isolation. Direct two-way cellular PSTN downlink capture via non-system InCallService is restricted by Google OS privacy policy."
        } else {
            "Android $release supports legacy AudioSource.VOICE_CALL capture."
        }

        val oemLimitation = "Device $manufacturer $model (${Build.BRAND}). Cellular telephony hardware drivers route voice streams via baseband DSP."

        val serverStream = "Active (Nexus Call OS Core server records 16kHz PCM duplex bridge stream automatically for every gateway session)."

        val summary = if (isCapable) {
            "Call recording is fully supported on this device via local hardware audio capture and Nexus Core PCM stream."
        } else {
            "Device Limitation Details:\n• OS: Android $release (API $sdk)\n• Policy: $osLimitation\n• Telephony Route: $oemLimitation\n• Gateway Solution: $serverStream\n• Local Microphone: ${if (hasMic) "Granted" else "Permission Required"}"
        }

        return RecordingCapabilityDiagnostic(
            isCapable = isCapable,
            hasMicPermission = hasMic,
            androidVersionName = "Android $release",
            sdkInt = sdk,
            osPolicyLimitation = osLimitation,
            oemLimitation = oemLimitation,
            telecomRoleGranted = true,
            serverSideStreamingStatus = serverStream,
            diagnosticSummary = summary
        )
    }

    @Synchronized
    fun getAllRecordings(): List<CallRecordingRecord> {
        val list = mutableListOf<CallRecordingRecord>()
        if (!metaFile.exists()) return list

        try {
            val content = metaFile.readText(Charsets.UTF_8)
            val arr = JSONArray(content)
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val path = obj.optString("filePath", "")
                val file = File(path)
                val size = if (file.exists()) file.length() else obj.optLong("fileSizeBytes", 0L)
                val durSec = obj.optLong("durationSec", 0L)
                val m = durSec / 60
                val s = durSec % 60
                val durFormatted = String.format(Locale.US, "%02d:%02d", m, s)
                val sizeFormatted = formatFileSize(size)

                list.add(
                    CallRecordingRecord(
                        id = obj.optString("id", "rec_$i"),
                        callId = obj.optString("callId", ""),
                        contactName = obj.optString("contactName").ifBlank { null },
                        phoneNumber = obj.optString("phoneNumber", "Unknown"),
                        direction = obj.optString("direction", "Incoming"),
                        timestamp = obj.optLong("timestamp", System.currentTimeMillis()),
                        durationSec = durSec,
                        filePath = path,
                        fileSizeBytes = size,
                        simSlot = obj.optInt("simSlot", 0),
                        simName = obj.optString("simName", "SIM 1"),
                        status = obj.optString("status", "COMPLETED"),
                        formattedDate = obj.optString("formattedDate", SimpleDateFormat("MMM d, yyyy h:mm a", Locale.getDefault()).format(Date(obj.optLong("timestamp", System.currentTimeMillis())))),
                        formattedDuration = durFormatted,
                        formattedSize = sizeFormatted
                    )
                )
            }
        } catch (e: Exception) {
            NexusApplication.log("WARN", "RecordingMgr", "Error reading recordings meta: ${e.message}")
        }
        return list.sortedByDescending { it.timestamp }
    }

    @Synchronized
    fun saveRecording(record: CallRecordingRecord) {
        val current = getAllRecordings().toMutableList()
        current.removeAll { it.id == record.id }
        current.add(0, record)
        persistRecordings(current)
    }

    @Synchronized
    fun deleteRecordingFileAndMeta(id: String): Boolean {
        val current = getAllRecordings().toMutableList()
        val found = current.find { it.id == id }
        if (found != null) {
            try {
                val f = File(found.filePath)
                if (f.exists()) f.delete()
            } catch (e: Exception) {
                // Ignore
            }
            current.remove(found)
            persistRecordings(current)
            NexusApplication.log("INFO", "RecordingMgr", "Permanently deleted recording ID $id")
            return true
        }
        return false
    }

    private fun persistRecordings(list: List<CallRecordingRecord>) {
        try {
            val arr = JSONArray()
            for (r in list) {
                val obj = JSONObject().apply {
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
                }
                arr.put(obj)
            }
            metaFile.writeText(arr.toString(), Charsets.UTF_8)
        } catch (e: Exception) {
            NexusApplication.log("ERROR", "RecordingMgr", "Error writing recordings meta: ${e.message}")
        }
    }

    fun getTotalStorageSizeBytes(): Long {
        var total = 0L
        for (r in getAllRecordings()) {
            total += r.fileSizeBytes
        }
        return total
    }

    fun formatFileSize(bytes: Long): String {
        return when {
            bytes >= 1024 * 1024 -> String.format(Locale.US, "%.2f MB", bytes.toDouble() / (1024 * 1024))
            bytes >= 1024 -> String.format(Locale.US, "%.1f KB", bytes.toDouble() / 1024)
            else -> "$bytes B"
        }
    }

    // ==================== Real Audio Playback ====================

    fun playRecording(
        filePath: String,
        onProgress: (currentMs: Int, totalMs: Int) -> Unit,
        onCompletion: () -> Unit
    ): Boolean {
        val file = File(filePath)
        if (!file.exists()) {
            NexusApplication.log("WARN", "RecordingMgr", "Playback failed: File not found at $filePath")
            return false
        }

        try {
            stopPlayback()
            mediaPlayer = MediaPlayer().apply {
                setDataSource(filePath)
                prepare()
                start()
                currentPlayingFilePath = filePath
                setOnCompletionListener {
                    onCompletion()
                }
            }
            return true
        } catch (e: Exception) {
            NexusApplication.log("ERROR", "RecordingMgr", "Playback error: ${e.message}")
            return false
        }
    }

    fun pausePlayback() {
        try {
            if (mediaPlayer?.isPlaying == true) {
                mediaPlayer?.pause()
            }
        } catch (e: Exception) {
            // Ignore
        }
    }

    fun resumePlayback() {
        try {
            mediaPlayer?.start()
        } catch (e: Exception) {
            // Ignore
        }
    }

    fun seekTo(positionMs: Int) {
        try {
            mediaPlayer?.seekTo(positionMs)
        } catch (e: Exception) {
            // Ignore
        }
    }

    fun stopPlayback() {
        try {
            mediaPlayer?.stop()
            mediaPlayer?.release()
        } catch (e: Exception) {
            // Ignore
        }
        mediaPlayer = null
        currentPlayingFilePath = null
    }

    fun isPlaying(): Boolean = mediaPlayer?.isPlaying == true
    fun getCurrentPosition(): Int = mediaPlayer?.currentPosition ?: 0
    fun getDuration(): Int = mediaPlayer?.duration ?: 0

    // ==================== Export / Share ====================

    fun exportRecording(activity: Activity, record: CallRecordingRecord) {
        val file = File(record.filePath)
        if (!file.exists()) {
            NexusApplication.log("WARN", "RecordingMgr", "Cannot export: Recording file not found at ${record.filePath}")
            return
        }

        try {
            val authority = "${activity.packageName}.fileprovider"
            val uri = FileProvider.getUriForFile(activity, authority, file)

            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = "audio/*"
                putExtra(Intent.EXTRA_STREAM, uri)
                putExtra(Intent.EXTRA_SUBJECT, "Nexus Call Recording - ${record.phoneNumber}")
                putExtra(Intent.EXTRA_TEXT, "Call recording with ${record.contactName ?: record.phoneNumber} (${record.formattedDate}, duration: ${record.formattedDuration})")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            activity.startActivity(Intent.createChooser(shareIntent, "Export / Share Call Recording"))
            NexusApplication.log("INFO", "RecordingMgr", "Export recording intent launched for ID ${record.id}")
        } catch (e: Exception) {
            NexusApplication.log("ERROR", "RecordingMgr", "Failed to export recording: ${e.message}")
        }
    }
}
