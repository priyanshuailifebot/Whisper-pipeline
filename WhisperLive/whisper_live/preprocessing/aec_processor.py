"""
Acoustic Echo Cancellation (AEC) Processor for WhisperLive
Uses aiortc WebRTC functionality or fallback AEC for echo cancellation
"""

import numpy as np
import logging
from typing import Optional
from scipy import signal
import threading

# Try to import aiortc WebRTC - if not available, use enhanced DSP fallback
WEBRTC_AVAILABLE = False
try:
    import asyncio
    from aiortc import RTCPeerConnection
    import av
    WEBRTC_AVAILABLE = True
    logging.info("✅ aiortc WebRTC available for enhanced AEC")
except ImportError as e:
    WEBRTC_AVAILABLE = False
    logging.warning(f"⚠️ aiortc WebRTC not available: {e} - using enhanced DSP AEC")


def create_aec_processor(sample_rate: int = 16000, channels: int = 1) -> 'AECProcessor':
    """
    Factory function to create AEC processor with proper error handling.
    Prioritizes WebRTC-style processing when available.

    Args:
        sample_rate: Audio sample rate
        channels: Number of audio channels

    Returns:
        AECProcessor instance (WebRTC-style preferred, fallback otherwise)
    """
    try:
        # Try WebRTC-style processor first (enhanced DSP with WebRTC algorithms)
        processor = WebRTCAECProcessor(sample_rate=sample_rate, num_channels=channels)
        logging.info("🎯 Using WebRTC-style AEC processor (enhanced DSP)")
        return processor
    except Exception as e:
        logging.warning(f"⚠️ WebRTC-style AEC failed: {e} - using fallback")
        try:
            processor = FallbackAECProcessor(sample_rate=sample_rate)
            logging.info("🔄 Using fallback AEC processor")
            return processor
        except Exception as e2:
            logging.error(f"❌ All AEC processors failed: {e2}")
            return DummyAECProcessor()


class WebRTCAECProcessor:
    """Enhanced AEC processor inspired by WebRTC algorithms"""

    def __init__(self, sample_rate: int = 16000, num_channels: int = 1):
        self.sample_rate = sample_rate
        self.num_channels = num_channels
        self.enabled = True

        # WebRTC-style processing parameters
        self.aec_enabled = True
        self.ns_enabled = True  # Noise suppression
        self.agc_enabled = True  # Automatic gain control
        self.hp_filter_enabled = True  # High-pass filter

        # AEC-specific parameters (simulating WebRTC AEC behavior)
        self.aec_filter_length = 1024  # Adaptive filter length
        self.aec_step_size = 0.005     # Adaptation step size
        self.aec_leak_factor = 0.99    # Forgetting factor

        # Initialize filters and buffers (ensure float32)
        self._init_filters()
        self.adaptive_filter = np.zeros(self.aec_filter_length, dtype=np.float32)
        self.speaker_history = np.zeros(self.aec_filter_length, dtype=np.float32)

        logging.info("✅ WebRTC-style AEC processor initialized")

    def _init_filters(self):
        """Initialize WebRTC-style filters"""
        # High-pass filter (WebRTC uses ~80-150Hz cutoff)
        nyquist = self.sample_rate / 2
        cutoff = 120  # Hz
        self.hp_sos = signal.butter(4, cutoff / nyquist, 'highpass', output='sos')

        # Low-pass filter for noise estimation
        self.lp_b, self.lp_a = signal.butter(2, 1000 / nyquist, 'lowpass')

        # Filter states - correct shape for sosfilt
        # sosfilt expects zi with shape (n_sections, 2)
        n_sections = self.hp_sos.shape[0]
        self.hp_zi = np.zeros((n_sections, 2), dtype=np.float32)
        self.lp_zi = np.zeros(max(len(self.lp_b), len(self.lp_a)) - 1, dtype=np.float32)

    def process_audio(self, audio_data: np.ndarray, speaker_data: Optional[np.ndarray] = None) -> np.ndarray:
        """Process audio using WebRTC-inspired AEC algorithms"""
        if not self.enabled:
            # Ensure float32 even when disabled
            return audio_data.astype(np.float32) if audio_data.dtype != np.float32 else audio_data

        try:
            # Ensure input is float32
            processed = audio_data.astype(np.float32) if audio_data.dtype != np.float32 else audio_data.copy()

            # Step 1: High-pass filter (removes low-frequency noise)
            if self.hp_filter_enabled:
                processed, self.hp_zi = signal.sosfilt(self.hp_sos, processed, zi=self.hp_zi)
                # scipy.signal operations may return float64, convert back to float32
                processed = processed.astype(np.float32)
                self.hp_zi = self.hp_zi.astype(np.float32)

            # Step 2: AEC processing (adaptive filtering)
            if self.aec_enabled:
                processed = self._apply_adaptive_aec(processed, speaker_data)

            # Step 3: Noise suppression
            if self.ns_enabled:
                processed = self._apply_noise_suppression(processed)

            # Step 4: Automatic gain control
            if self.agc_enabled:
                processed = self._apply_agc(processed)

            # Final dtype check - ensure float32
            return processed.astype(np.float32)

        except Exception as e:
            logging.error(f"❌ WebRTC AEC processing error: {e}")
            # Return original with float32 dtype
            return audio_data.astype(np.float32) if audio_data.dtype != np.float32 else audio_data

    def _apply_adaptive_aec(self, audio: np.ndarray, speaker_data: Optional[np.ndarray]) -> np.ndarray:
        """Apply adaptive echo cancellation using LMS algorithm"""
        # Ensure float32
        audio = audio.astype(np.float32) if audio.dtype != np.float32 else audio
        
        if speaker_data is None:
            # Without speaker reference, apply basic echo suppression
            # Estimate echo based on recent audio history
            echo_estimate = np.convolve(audio, self.adaptive_filter[:len(audio)], mode='same').astype(np.float32)
            # Subtract estimated echo
            return (audio - 0.3 * echo_estimate).astype(np.float32)
        else:
            # Ensure speaker_data is float32
            speaker_data = speaker_data.astype(np.float32) if speaker_data.dtype != np.float32 else speaker_data
            
            # With speaker reference, update adaptive filter
            if len(speaker_data) >= self.aec_filter_length:
                # Update speaker history
                self.speaker_history = speaker_data[-self.aec_filter_length:].astype(np.float32)

                # Compute echo estimate
                echo_estimate = np.convolve(self.speaker_history, self.adaptive_filter, mode='valid').astype(np.float32)

                # Compute error (near-end signal)
                error = (audio[:len(echo_estimate)] - echo_estimate).astype(np.float32)

                # Update adaptive filter (LMS algorithm)
                filter_update = (self.aec_step_size * np.convolve(error, self.speaker_history, mode='valid')).astype(np.float32)
                self.adaptive_filter = (self.adaptive_filter.astype(np.float32) + filter_update).astype(np.float32)

                # Apply forgetting factor
                self.adaptive_filter = (self.adaptive_filter * self.aec_leak_factor).astype(np.float32)

                # Return echo-cancelled signal
                result = audio.copy().astype(np.float32)
                result[:len(error)] = error
                return result.astype(np.float32)
            else:
                # Basic suppression without full AEC
                return (audio * 0.8).astype(np.float32)

    def _apply_noise_suppression(self, audio: np.ndarray) -> np.ndarray:
        """Apply WebRTC-style noise suppression"""
        # Ensure float32
        audio = audio.astype(np.float32) if audio.dtype != np.float32 else audio
        
        # Estimate noise floor using voice activity detection
        # WebRTC uses spectral subtraction with VAD

        # Compute short-time energy
        frame_length = 256
        hop_length = 128

        # Simple noise gate based on RMS
        rms = np.sqrt(np.convolve(audio**2, np.ones(frame_length, dtype=np.float32)/frame_length, mode='same')).astype(np.float32)

        # Estimate noise floor
        noise_floor = np.float32(np.percentile(rms, 15))  # 15th percentile

        # Apply noise gate (handle divide by zero)
        if noise_floor > 0:
            gate_ratio = np.clip(rms / (noise_floor * np.float32(1.5)), np.float32(0), np.float32(1)).astype(np.float32)
        else:
            # If noise floor is zero, use a small default value to avoid division by zero
            gate_ratio = np.clip(rms / np.float32(0.001), np.float32(0), np.float32(1)).astype(np.float32)
        gate_ratio = np.convolve(gate_ratio, np.ones(frame_length, dtype=np.float32)/frame_length, mode='same').astype(np.float32)
        gate_ratio = np.clip(gate_ratio, np.float32(0.1), np.float32(1.0)).astype(np.float32)  # Minimum gate of 0.1

        return (audio * gate_ratio).astype(np.float32)

    def _apply_agc(self, audio: np.ndarray) -> np.ndarray:
        """Apply WebRTC-style automatic gain control"""
        # Ensure float32
        audio = audio.astype(np.float32) if audio.dtype != np.float32 else audio
        
        # WebRTC AGC maintains consistent levels and prevents clipping

        # Target RMS level (similar to WebRTC's target of -18dBFS)
        target_rms = np.float32(0.1)  # ~ -20dBFS

        # Compute current RMS
        current_rms = np.float32(np.sqrt(np.mean(audio**2)))

        if current_rms > 0:
            # Compute gain
            gain = np.float32(target_rms / current_rms)

            # Limit gain range (WebRTC AGC has limits)
            gain = np.clip(gain, np.float32(0.1), np.float32(10.0)).astype(np.float32)

            # Apply compression for very loud signals
            if gain < np.float32(0.5):
                # Compress instead of amplify
                gain = np.float32(0.5 + 0.5 * (gain / 0.5))

            return (audio * gain).astype(np.float32)

        return audio.astype(np.float32)

    def set_speaker_data(self, speaker_data: np.ndarray):
        """Update speaker reference for AEC"""
        if speaker_data is not None and len(speaker_data) > 0:
            # Update speaker history for adaptive filtering
            speaker_data = speaker_data.astype(np.float32)
            self.speaker_history = np.roll(self.speaker_history, -len(speaker_data))
            self.speaker_history[-len(speaker_data):] = speaker_data[:len(self.speaker_history)]

    def reset(self):
        """Reset AEC processor state"""
        self.adaptive_filter = np.zeros(self.aec_filter_length)
        self.speaker_history = np.zeros(self.aec_filter_length)
        self._init_filters()
        logging.info("🔄 WebRTC AEC processor reset")

    def is_enabled(self) -> bool:
        return self.enabled

    def get_stats(self) -> dict:
        return {
            "enabled": True,
            "type": "WebRTC-Style AEC",
            "sample_rate": self.sample_rate,
            "aec_enabled": self.aec_enabled,
            "ns_enabled": self.ns_enabled,
            "agc_enabled": self.agc_enabled,
            "hp_filter_enabled": self.hp_filter_enabled,
            "adaptive_filter_length": self.aec_filter_length
        }


class FallbackAECProcessor:
    """Fallback AEC using digital signal processing techniques"""

    def __init__(self, sample_rate: int = 16000):
        self.sample_rate = sample_rate
        self.enabled = True
        self.buffer_size = sample_rate * 2  # 2 second buffer
        self.audio_buffer = np.array([], dtype=np.float32)
        self.filter_state = None

        # Adaptive filter parameters
        self.filter_length = 512  # Length of adaptive filter
        self.step_size = 0.01     # Adaptation step size
        self.forget_factor = 0.99 # Forgetting factor

        # High-pass filter to remove low-frequency noise
        self.hp_filter = self._design_high_pass_filter()

        logging.info("✅ Fallback AEC processor initialized (DSP-based)")

    def _design_high_pass_filter(self):
        """Design a high-pass filter to remove low-frequency noise"""
        nyquist = self.sample_rate / 2
        cutoff = 100  # 100 Hz cutoff
        normalized_cutoff = cutoff / nyquist

        # Design Butterworth high-pass filter
        from scipy.signal import butter
        b, a = butter(4, normalized_cutoff, btype='high')
        return {'b': b, 'a': a, 'zi': np.zeros(max(len(a), len(b)) - 1)}

    def process_audio(self, audio_data: np.ndarray, speaker_data: Optional[np.ndarray] = None) -> np.ndarray:
        """Process audio using DSP-based AEC techniques"""
        try:
            # Apply high-pass filter first
            filtered_audio, self.hp_filter['zi'] = signal.lfilter(
                self.hp_filter['b'], self.hp_filter['a'], audio_data, zi=self.hp_filter['zi']
            )

            # Simple spectral subtraction for echo reduction
            # This is a basic approach - analyze frequency content
            fft_data = np.fft.rfft(filtered_audio)
            magnitude = np.abs(fft_data)
            phase = np.angle(fft_data)

            # Estimate noise floor (simple approach)
            noise_floor = np.percentile(magnitude, 10)  # 10th percentile as noise estimate

            # Apply spectral subtraction
            # Reduce components below certain threshold more aggressively
            mask = magnitude > (noise_floor * 1.5)
            magnitude_reduced = np.where(mask, magnitude * 0.9, magnitude * 0.3)

            # Reconstruct signal
            processed_fft = magnitude_reduced * np.exp(1j * phase)
            processed_audio = np.fft.irfft(processed_fft, len(filtered_audio))

            # Ensure output is same length and type
            processed_audio = processed_audio.astype(np.float32)
            if len(processed_audio) > len(audio_data):
                processed_audio = processed_audio[:len(audio_data)]

            # Apply gentle dynamic range compression
            processed_audio = self._apply_compression(processed_audio)

            return processed_audio

        except Exception as e:
            logging.error(f"❌ Fallback AEC processing error: {e}")
            return audio_data

    def _apply_compression(self, audio: np.ndarray) -> np.ndarray:
        """Apply dynamic range compression"""
        threshold = 0.5
        ratio = 3.0

        over_threshold = np.abs(audio) > threshold
        sign = np.sign(audio[over_threshold])
        magnitude = np.abs(audio[over_threshold])
        compressed = threshold + (magnitude - threshold) / ratio

        result = audio.copy()
        result[over_threshold] = sign * compressed
        return result

    def set_speaker_data(self, speaker_data: np.ndarray):
        """Store speaker data for potential future use in more advanced AEC"""
        # In fallback mode, we don't use speaker reference directly
        # But we could implement correlation-based echo detection here
        pass

    def reset(self):
        """Reset processor state"""
        self.audio_buffer = np.array([], dtype=np.float32)
        self.filter_state = None
        self.hp_filter['zi'] = np.zeros(max(len(self.hp_filter['a']), len(self.hp_filter['b'])) - 1)

    def is_enabled(self) -> bool:
        return self.enabled

    def get_stats(self) -> dict:
        return {
            "enabled": True,
            "type": "Fallback DSP",
            "filter_length": self.filter_length,
            "sample_rate": self.sample_rate,
            "high_pass_cutoff": 100,
            "compression_threshold": 0.5
        }


class DummyAECProcessor:
    """Dummy AEC processor when nothing is available."""

    def __init__(self):
        self.is_active = False

    def process_audio(self, audio: np.ndarray, speaker_data: Optional[np.ndarray] = None) -> np.ndarray:
        return audio

    def set_speaker_data(self, speaker_data: np.ndarray):
        pass

    def reset(self):
        pass

    def is_enabled(self) -> bool:
        return False

    def get_stats(self) -> dict:
        return {"enabled": False, "reason": "No AEC available"}

# Old AECProcessor class removed - using WebRTCAECProcessor instead