package com.nexus.callos.companion.audio

import android.annotation.SuppressLint
import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.media.AudioTrack
import android.media.MediaRecorder
import androidx.core.content.ContextCompat
import com.nexus.callos.companion.NexusApplication
import java.util.concurrent.atomic.AtomicBoolean

class CallAudioManager(private val context: Context) {

    companion object {
        const val SAMPLE_RATE = 16000
        const val CHANNEL_CONFIG_IN = AudioFormat.CHANNEL_IN_MONO
        const val CHANNEL_CONFIG_OUT = AudioFormat.CHANNEL_OUT_MONO
        const val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
        const val BUFFER_SIZE_BYTES = 2048
    }

    private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager

    private var audioRecord: AudioRecord? = null
    private var audioTrack: AudioTrack? = null

    private val isRecording = AtomicBoolean(false)
    private val isPlaying = AtomicBoolean(false)
    private var isMuted = false

    var onAudioChunkCaptured: ((ByteArray) -> Unit)? = null

    @SuppressLint("MissingPermission")
    fun startCapture() {
        if (isRecording.get()) return

        val hasMicPermission = ContextCompat.checkSelfPermission(
            context,
            android.Manifest.permission.RECORD_AUDIO
        ) == android.content.pm.PackageManager.PERMISSION_GRANTED

        if (!hasMicPermission) {
            NexusApplication.log("WARN", "Audio", "Cannot start capture: RECORD_AUDIO permission missing.")
            return
        }

        val minBuf = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG_IN, AUDIO_FORMAT)
        val bufSize = maxOf(minBuf, BUFFER_SIZE_BYTES * 2)

        try {
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.VOICE_COMMUNICATION,
                SAMPLE_RATE,
                CHANNEL_CONFIG_IN,
                AUDIO_FORMAT,
                bufSize
            )

            audioRecord?.startRecording()
            isRecording.set(true)
            NexusApplication.log("INFO", "Audio", "AudioRecord 16kHz PCM duplex recording started.")

            Thread {
                val buffer = ByteArray(BUFFER_SIZE_BYTES)
                while (isRecording.get()) {
                    val read = audioRecord?.read(buffer, 0, buffer.size) ?: -1
                    if (read > 0 && !isMuted) {
                        val chunk = buffer.copyOf(read)
                        onAudioChunkCaptured?.invoke(chunk)
                    }
                }
            }.start()

        } catch (e: Exception) {
            NexusApplication.log("ERROR", "Audio", "AudioRecord initialization error: ${e.message}")
        }
    }

    fun stopCapture() {
        isRecording.set(false)
        try {
            audioRecord?.stop()
            audioRecord?.release()
        } catch (e: Exception) {
            // Ignore
        }
        audioRecord = null
        NexusApplication.log("INFO", "Audio", "AudioRecord capture stopped.")
    }

    fun initPlayback() {
        if (isPlaying.get()) return

        val minBuf = AudioTrack.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG_OUT, AUDIO_FORMAT)
        val bufSize = maxOf(minBuf, BUFFER_SIZE_BYTES * 4)

        try {
            val attributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build()

            val format = AudioFormat.Builder()
                .setSampleRate(SAMPLE_RATE)
                .setEncoding(AUDIO_FORMAT)
                .setChannelMask(CHANNEL_CONFIG_OUT)
                .build()

            audioTrack = AudioTrack.Builder()
                .setAudioAttributes(attributes)
                .setAudioFormat(format)
                .setBufferSizeInBytes(bufSize)
                .setTransferMode(AudioTrack.MODE_STREAM)
                .build()

            audioTrack?.play()
            isPlaying.set(true)
            NexusApplication.log("INFO", "Audio", "AudioTrack 16kHz PCM playback engine ready.")
        } catch (e: Exception) {
            NexusApplication.log("ERROR", "Audio", "AudioTrack init error: ${e.message}")
        }
    }

    fun writePlaybackChunk(pcmChunk: ByteArray) {
        if (!isPlaying.get()) {
            initPlayback()
        }
        try {
            audioTrack?.write(pcmChunk, 0, pcmChunk.size)
        } catch (e: Exception) {
            NexusApplication.log("WARN", "Audio", "Error writing audio chunk: ${e.message}")
        }
    }

    fun stopPlayback() {
        isPlaying.set(false)
        try {
            audioTrack?.stop()
            audioTrack?.release()
        } catch (e: Exception) {
            // Ignore
        }
        audioTrack = null
        NexusApplication.log("INFO", "Audio", "AudioTrack playback stopped.")
    }

    fun setMute(mute: Boolean) {
        isMuted = mute
        NexusApplication.log("INFO", "Audio", "Microphone mute state set to: $mute")
    }

    fun setSpeakerphone(enable: Boolean) {
        try {
            audioManager?.mode = AudioManager.MODE_IN_COMMUNICATION
            audioManager?.isSpeakerphoneOn = enable
            NexusApplication.log("INFO", "Audio", "Speakerphone set to: $enable")
        } catch (e: Exception) {
            NexusApplication.log("WARN", "Audio", "Failed to set speakerphone: ${e.message}")
        }
    }
}
