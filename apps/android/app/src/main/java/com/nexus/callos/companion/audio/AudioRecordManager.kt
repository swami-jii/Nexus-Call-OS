package com.nexus.callos.companion.audio

import android.annotation.SuppressLint
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.media.audiofx.AcousticEchoCanceler
import android.media.audiofx.NoiseSuppressor
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class AudioRecordManager(private val onAudioFrame: (ByteArray) -> Unit) {

    companion object {
        private const val TAG = "NexusAudioRecord"
        const val SAMPLE_RATE = 16000
        const val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO
        const val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
        const val CHUNK_SIZE_BYTES = 640 // 20ms frame at 16kHz 16-bit mono
    }

    private val bufferSize = maxOf(
        AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT),
        CHUNK_SIZE_BYTES * 4
    )

    private var audioRecord: AudioRecord? = null
    private var recordingJob: Job? = null
    private var echoCanceler: AcousticEchoCanceler? = null
    private var noiseSuppressor: NoiseSuppressor? = null

    @SuppressLint("MissingPermission")
    fun start() {
        if (recordingJob?.isActive == true) return

        try {
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.VOICE_COMMUNICATION,
                SAMPLE_RATE,
                CHANNEL_CONFIG,
                AUDIO_FORMAT,
                bufferSize
            )

            val audioSessionId = audioRecord?.audioSessionId ?: 0
            if (audioSessionId != 0) {
                if (AcousticEchoCanceler.isAvailable()) {
                    echoCanceler = AcousticEchoCanceler.create(audioSessionId)?.apply {
                        enabled = true
                        Log.d(TAG, "Hardware Acoustic Echo Canceler enabled")
                    }
                }
                if (NoiseSuppressor.isAvailable()) {
                    noiseSuppressor = NoiseSuppressor.create(audioSessionId)?.apply {
                        enabled = true
                        Log.d(TAG, "Hardware Noise Suppressor enabled")
                    }
                }
            }

            audioRecord?.startRecording()
            Log.d(TAG, "AudioRecord started at $SAMPLE_RATE Hz (Mono 16-bit)")

            recordingJob = CoroutineScope(Dispatchers.IO).launch {
                val buffer = ByteArray(CHUNK_SIZE_BYTES)
                while (isActive && audioRecord?.recordingState == AudioRecord.RECORDSTATE_RECORDING) {
                    val read = audioRecord?.read(buffer, 0, buffer.size) ?: 0
                    if (read > 0) {
                        onAudioFrame(buffer.copyOf(read))
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start AudioRecord", e)
            stop()
        }
    }

    fun stop() {
        recordingJob?.cancel()
        recordingJob = null
        try {
            echoCanceler?.release()
            echoCanceler = null
            noiseSuppressor?.release()
            noiseSuppressor = null
            audioRecord?.stop()
            audioRecord?.release()
        } catch (e: Exception) {
            Log.w(TAG, "Error stopping AudioRecord", e)
        }
        audioRecord = null
        Log.d(TAG, "AudioRecord stopped")
    }
}
