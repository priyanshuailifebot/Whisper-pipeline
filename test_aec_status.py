#!/usr/bin/env python3
"""
AEC Status and Effectiveness Test Script
Tests if AEC is working on the server and provides diagnostics
"""

import os
import sys
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s: %(message)s'
)

def test_aec_status():
    """Test AEC status and configuration"""
    print("=" * 60)
    print("🔍 AEC Status Test")
    print("=" * 60)
    print()
    
    # Check environment variable
    aec_env = os.environ.get('WHISPER_LIVE_AEC_ENABLED', 'true')
    print(f"📋 Environment Variable: WHISPER_LIVE_AEC_ENABLED = {aec_env}")
    
    if aec_env.lower() == 'false':
        print("   ⚠️  AEC is DISABLED via environment variable")
        print("   💡 To enable: Set WHISPER_LIVE_AEC_ENABLED=true or remove the line in run_server.py")
    else:
        print("   ✅ AEC is ENABLED via environment variable")
    print()
    
    # Try to import and test AEC processor
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'WhisperLive'))
        from whisper_live.preprocessing.aec_processor import create_aec_processor
        
        print("🧪 Testing AEC Processor Creation...")
        processor = create_aec_processor(sample_rate=16000)
        
        if processor:
            stats = processor.get_stats()
            print(f"   ✅ AEC Processor created successfully")
            print(f"   📊 AEC Stats: {stats}")
            
            if stats.get('enabled', False):
                print("   ✅ AEC is FUNCTIONAL")
                print(f"   📋 Type: {stats.get('type', 'Unknown')}")
                print(f"   🔊 AEC Enabled: {stats.get('aec_enabled', False)}")
                print(f"   🔇 Noise Suppression: {stats.get('ns_enabled', False)}")
                print(f"   📈 AGC: {stats.get('agc_enabled', False)}")
            else:
                print("   ⚠️  AEC Processor exists but is not enabled")
                print(f"   📋 Reason: {stats.get('reason', 'Unknown')}")
        else:
            print("   ❌ Failed to create AEC processor")
            
    except ImportError as e:
        print(f"   ❌ Cannot import AEC processor: {e}")
        print("   💡 Make sure you're running from the Whisper-pipeline directory")
    except Exception as e:
        print(f"   ❌ Error testing AEC: {e}")
        import traceback
        traceback.print_exc()
    
    print()
    
    # Test AudioProcessor
    try:
        from whisper_live.preprocessing.audio_processor import AudioProcessor
        
        print("🧪 Testing AudioProcessor with AEC...")
        processor_enabled = AudioProcessor(sample_rate=16000, enable_aec=True)
        processor_disabled = AudioProcessor(sample_rate=16000, enable_aec=False)
        
        print(f"   ✅ AudioProcessor with AEC=True: aec_processor={processor_enabled.aec_processor is not None}")
        print(f"   ✅ AudioProcessor with AEC=False: aec_processor={processor_disabled.aec_processor is not None}")
        
    except Exception as e:
        print(f"   ❌ Error testing AudioProcessor: {e}")
    
    print()
    print("=" * 60)
    print("📊 Summary")
    print("=" * 60)
    print()
    print("To check AEC status in running server:")
    print("   1. Look for these log messages when server starts:")
    print("      ✅ '🎯 Hybrid AEC enabled' = AEC is working")
    print("      ⚠️  '🔇 Server AEC disabled' = AEC is disabled")
    print("      ⚠️  '⚠️ Server AEC not available' = AEC failed to initialize")
    print()
    print("To test AEC effectiveness:")
    print("   1. Start server with AEC enabled")
    print("   2. Play audio from speakers (avatar speaking)")
    print("   3. Speak into microphone while audio is playing")
    print("   4. Check transcriptions - should NOT include speaker audio")
    print()
    print("Current Configuration:")
    print(f"   • Environment: WHISPER_LIVE_AEC_ENABLED={aec_env}")
    print(f"   • Status: {'DISABLED' if aec_env.lower() == 'false' else 'ENABLED'}")
    print()

if __name__ == "__main__":
    test_aec_status()

