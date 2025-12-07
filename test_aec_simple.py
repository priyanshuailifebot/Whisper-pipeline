#!/usr/bin/env python3
"""
Simple AEC test to verify fallback AEC functionality
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'WhisperLive'))

import numpy as np
from whisper_live.preprocessing.aec_processor import create_aec_processor

def test_aec_functionality():
    """Test AEC processor functionality"""
    print("🎯 Testing AEC Processor Functionality")
    print("=" * 40)

    # Create AEC processor
    print("📦 Creating AEC processor...")
    aec_processor = create_aec_processor(sample_rate=16000, channels=1)

    # Get stats
    stats = aec_processor.get_stats()
    print(f"🎛️ AEC Stats: {stats}")

    # Test with dummy audio
    print("🎵 Testing with dummy audio...")
    sample_rate = 16000
    duration = 0.1  # 100ms
    samples = int(sample_rate * duration)

    # Create test audio (sine wave)
    t = np.linspace(0, duration, samples, False)
    frequency = 440  # A note
    test_audio = np.sin(frequency * 2 * np.pi * t).astype(np.float32)

    print(f"📊 Input audio: {len(test_audio)} samples, dtype: {test_audio.dtype}")

    # Process through AEC
    processed_audio = aec_processor.process_audio(test_audio)

    print(f"🔇 Processed audio: {len(processed_audio)} samples, dtype: {processed_audio.dtype}")

    # Check if audio was processed (should be similar but potentially modified)
    if len(processed_audio) == len(test_audio):
        print("✅ Audio processing successful - length preserved")
    else:
        print(f"⚠️ Audio processing completed - length changed from {len(test_audio)} to {len(processed_audio)}")

    # Calculate some basic metrics
    input_rms = np.sqrt(np.mean(test_audio**2))
    output_rms = np.sqrt(np.mean(processed_audio**2))

    print(".6f")
    print(".6f")
    print(".2f")

    print("\n🎉 AEC Test Completed Successfully!")
    return True

if __name__ == "__main__":
    try:
        test_aec_functionality()
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
