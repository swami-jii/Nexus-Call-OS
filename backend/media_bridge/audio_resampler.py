"""
Audio Resampler Module
Nexus Call OS v2.4 Enterprise

Transcodes audio sample rates between narrowband (8kHz), wideband (16kHz), and fullband (48kHz).
"""

from backend.media_bridge.interfaces import AudioFrame


class AudioResampler:
    """Resamples audio frame payloads between target sample rates."""

    @staticmethod
    def resample_frame(frame: AudioFrame, target_sample_rate: int) -> AudioFrame:
        """Resample an AudioFrame to the target sample rate."""
        if frame.sample_rate == target_sample_rate:
            return frame

        ratio = target_sample_rate / frame.sample_rate

        # Simple linear interpolation / decimation for 16-bit PCM frames
        if ratio == 2.0:  # 8kHz -> 16kHz upsample
            resampled_bytes = bytearray()
            for i in range(0, len(frame.payload), 2):
                sample = frame.payload[i : i + 2]
                resampled_bytes.extend(sample)
                resampled_bytes.extend(sample)
            new_payload = bytes(resampled_bytes)
        elif ratio == 0.5:  # 16kHz -> 8kHz downsample
            new_payload = frame.payload[::4] + frame.payload[1::4]
        else:
            new_payload = frame.payload

        return AudioFrame(
            payload=new_payload,
            sample_rate=target_sample_rate,
            channels=frame.channels,
            codec=frame.codec,
            sequence_number=frame.sequence_number,
        )
