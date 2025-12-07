"""
Audio preprocessing pipeline for WhisperLive
Handles AEC, normalization, and audio format conversion
"""

import numpy as np
import logging
from typing import Optional, Tuple
from .aec_processor import create_aec_processor

class AudioProcessor:
    """
    Complete audio preprocessing pipeline including AEC, normalization, and format conversion.
    """

    def __init__(self, sample_rate: int = 16000, enable_aec: bool = True):
        """
        Initialize audio processor.

        Args:
            sample_rate: Target sample rate for processing
            enable_aec: Whether to enable acoustic echo cancellation
        """
        self.sample_rate = sample_rate
        self.enable_aec = enable_aec

        # Initialize AEC processor using factory function
        self.aec_processor = create_aec_processor(sample_rate=sample_rate) if enable_aec else None

        # Audio processing state
        self.audio_buffer = np.array([], dtype=np.float32)
        self.buffer_size = sample_rate * 2  # 2 second buffer

        logging.info(f"🎵 Audio processor initialized (AEC: {enable_aec})")

    def process_audio_chunk(self, audio_chunk: np.ndarray,
                          speaker_chunk: Optional[np.ndarray] = None) -> np.ndarray:
        """
        Process a chunk of audio data through the complete pipeline.

        Args:
            audio_chunk: Raw audio chunk from microphone
            speaker_chunk: Corresponding speaker output (for AEC reference)

        Returns:
            Processed audio chunk ready for transcription
        """
        try:
            # Check for empty arrays (prevent AEC errors)
            if audio_chunk is None or len(audio_chunk) == 0:
                logging.debug("⚠️ Received empty audio chunk, skipping processing")
                return np.array([], dtype=np.float32)

            # Ensure audio_chunk is a numpy array
            if not isinstance(audio_chunk, np.ndarray):
                audio_chunk = np.array(audio_chunk, dtype=np.float32)

            # Step 1: Format conversion and normalization
            processed_chunk = self._normalize_audio(audio_chunk)

            # Check again after normalization (in case normalization failed)
            if len(processed_chunk) == 0:
                logging.debug("⚠️ Processed chunk is empty, returning empty array")
                return np.array([], dtype=np.float32)

            # Step 2: AEC processing (if enabled)
            if self.enable_aec and self.aec_processor and self.aec_processor.is_enabled():
                # Provide speaker reference if available
                if speaker_chunk is not None and len(speaker_chunk) > 0:
                    speaker_normalized = self._normalize_audio(speaker_chunk)
                    if len(speaker_normalized) > 0:
                        self.aec_processor.set_speaker_data(speaker_normalized)

                # Apply AEC (only if we have valid audio)
                if len(processed_chunk) > 0:
                    try:
                        processed_chunk = self.aec_processor.process_audio(processed_chunk)
                    except Exception as aec_error:
                        logging.warning(f"⚠️ AEC processing error (non-critical): {aec_error}")
                        # Continue without AEC if it fails
                        pass

            # Step 3: Additional audio enhancements
            if len(processed_chunk) > 0:
                processed_chunk = self._enhance_audio(processed_chunk)

            # Step 4: Buffer management for continuous processing
            if len(processed_chunk) > 0:
                processed_chunk = self._manage_buffer(processed_chunk)

            return processed_chunk

        except Exception as e:
            logging.error(f"❌ Audio processing error: {e}")
            # Return empty array instead of crashing
            return np.array([], dtype=np.float32)

    def _normalize_audio(self, audio: np.ndarray) -> np.ndarray:
        """
        Normalize audio to float32 format and ensure proper levels.
        """
        # Convert to float32 if needed
        if audio.dtype != np.float32:
            if audio.dtype == np.int16:
                audio = (audio.astype(np.float32) / 32767.0).astype(np.float32)
            elif audio.dtype == np.int32:
                audio = (audio.astype(np.float32) / 2147483647.0).astype(np.float32)
            elif audio.dtype == np.float64:
                # Explicitly convert float64 (double) to float32
                audio = audio.astype(np.float32)
            else:
                audio = audio.astype(np.float32)

        # Ensure values are in valid range [-1, 1] and maintain float32
        audio = np.clip(audio, -1.0, 1.0).astype(np.float32)

        return audio

    def _enhance_audio(self, audio: np.ndarray) -> np.ndarray:
        """
        Apply additional audio enhancements.
        """
        # Ensure float32 dtype before processing
        if audio.dtype != np.float32:
            audio = audio.astype(np.float32)
        
        # Apply very gentle high-pass filter to remove low-frequency noise
        # Reduced filter strength to preserve speech (was 0.95/0.05, now 0.98/0.02)
        # This preserves more of the original audio signal for better transcription
        if len(audio) > 1:
            filtered = np.zeros_like(audio, dtype=np.float32)
            filtered[0] = (audio[0] * 0.02).astype(np.float32)
            for i in range(1, len(audio)):
                filtered[i] = (0.98 * filtered[i-1] + 0.02 * audio[i]).astype(np.float32)
            audio = filtered.astype(np.float32)

        # Apply gentle dynamic range compression (reduced threshold to preserve more audio)
        # Lower threshold = less compression = more audio preserved
        threshold = np.float32(0.8)  # Increased from 0.6 to 0.8 (less aggressive)
        ratio = np.float32(2.0)  # Reduced from 4.0 to 2.0 (gentler compression)

        over_threshold = np.abs(audio) > threshold
        if np.any(over_threshold):
            sign = np.sign(audio[over_threshold]).astype(np.float32)
            magnitude = np.abs(audio[over_threshold]).astype(np.float32)
            compressed = (threshold + (magnitude - threshold) / ratio).astype(np.float32)
            audio = np.where(over_threshold, sign * compressed, audio).astype(np.float32)

        # Final dtype check - ensure float32
        return audio.astype(np.float32)

    def _manage_buffer(self, audio_chunk: np.ndarray) -> np.ndarray:
        """
        Manage audio buffer for continuous processing.
        """
        # Add new chunk to buffer
        self.audio_buffer = np.concatenate([self.audio_buffer, audio_chunk])

        # Keep buffer size manageable
        if len(self.audio_buffer) > self.buffer_size:
            # Keep the most recent audio
            self.audio_buffer = self.audio_buffer[-self.buffer_size:]

        return audio_chunk  # Return the processed chunk, not the entire buffer

    def reset(self):
        """Reset audio processor state."""
        self.audio_buffer = np.array([], dtype=np.float32)
        if self.aec_processor:
            self.aec_processor.reset()
        logging.info("🔄 Audio processor reset")

    def get_stats(self) -> dict:
        """Get audio processing statistics."""
        stats = {
            "sample_rate": self.sample_rate,
            "aec_enabled": self.enable_aec,
            "buffer_size": len(self.audio_buffer),
            "buffer_duration_seconds": len(self.audio_buffer) / self.sample_rate if self.sample_rate > 0 else 0
        }

        if self.aec_processor:
            stats.update({"aec_stats": self.aec_processor.get_stats()})

        return stats

    def set_aec_enabled(self, enabled: bool):
        """Enable or disable AEC processing."""
        self.enable_aec = enabled
        if not enabled and self.aec_processor:
            logging.info("🔇 AEC disabled")
        elif enabled and self.aec_processor:
            logging.info("🔊 AEC enabled")

    def get_buffered_audio(self, duration_seconds: float = 1.0) -> np.ndarray:
        """
        Get recent buffered audio for analysis.

        Args:
            duration_seconds: How many seconds of recent audio to return

        Returns:
            Recent audio buffer
        """
        samples_needed = int(duration_seconds * self.sample_rate)
        if len(self.audio_buffer) >= samples_needed:
            return self.audio_buffer[-samples_needed:]
        else:
            return self.audio_buffer.copy()
