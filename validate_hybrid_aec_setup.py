#!/usr/bin/env python3
"""
Simple validation script for Hybrid AEC setup
Checks file structure and basic imports without external dependencies
"""

import os
import sys
import json

def check_file_exists(filepath, description):
    """Check if a file exists"""
    if os.path.exists(filepath):
        print(f"✅ {description}: {filepath}")
        return True
    else:
        print(f"❌ {description} NOT FOUND: {filepath}")
        return False

def check_directory_exists(dirpath, description):
    """Check if a directory exists"""
    if os.path.isdir(dirpath):
        print(f"✅ {description}: {dirpath}")
        return True
    else:
        print(f"❌ {description} NOT FOUND: {dirpath}")
        return False

def validate_frontend_files():
    """Validate frontend implementation files"""
    print("\n🌐 Frontend Validation")
    print("=" * 30)

    frontend_checks = [
        ("WhisperLiveClient", "Frontend/src/utils/whisperLiveClient.js"),
        ("Modified App.jsx", "Frontend/src/App.jsx"),
        ("Setup script", "setup_whisperlive_aec.sh"),
    ]

    all_passed = True
    for desc, path in frontend_checks:
        if not check_file_exists(path, desc):
            all_passed = False

    # Check if App.jsx imports the new client
    if os.path.exists("Frontend/src/App.jsx"):
        with open("Frontend/src/App.jsx", "r") as f:
            content = f.read()
            if "WhisperLiveClient" in content:
                print("✅ App.jsx imports WhisperLiveClient")
            else:
                print("❌ App.jsx does not import WhisperLiveClient")
                all_passed = False

    return all_passed

def validate_backend_files():
    """Validate backend implementation files"""
    print("\n🖥️ Backend Validation")
    print("=" * 30)

    backend_checks = [
        ("AEC Processor", "WhisperLive/whisper_live/preprocessing/aec_processor.py"),
        ("Audio Processor", "WhisperLive/whisper_live/preprocessing/audio_processor.py"),
        ("Modified Server", "WhisperLive/whisper_live/server.py"),
        ("Preprocessing __init__", "WhisperLive/whisper_live/preprocessing/__init__.py"),
    ]

    all_passed = True
    for desc, path in backend_checks:
        if not check_file_exists(path, desc):
            all_passed = False

    # Check preprocessing directory
    if not check_directory_exists("WhisperLive/whisper_live/preprocessing", "Preprocessing directory"):
        all_passed = False

    # Check if server.py imports audio processor
    if os.path.exists("WhisperLive/whisper_live/server.py"):
        with open("WhisperLive/whisper_live/server.py", "r") as f:
            content = f.read()
            if "AudioProcessor" in content:
                print("✅ Server.py imports AudioProcessor")
            else:
                print("❌ Server.py does not import AudioProcessor")
                all_passed = False

    return all_passed

def validate_configuration():
    """Validate configuration files"""
    print("\n⚙️ Configuration Validation")
    print("=" * 30)

    config_checks = [
        ("Test script", "test_hybrid_aec_system.py"),
        ("Documentation", "HYBRID_AEC_README.md"),
        ("Setup script", "setup_whisperlive_aec.sh"),
    ]

    all_passed = True
    for desc, path in config_checks:
        if not check_file_exists(path, desc):
            all_passed = False

    return all_passed

def check_key_implementations():
    """Check for key implementation details"""
    print("\n🔍 Implementation Validation")
    print("=" * 30)

    checks_passed = 0
    total_checks = 0

    # Check WhisperLiveClient for key features
    total_checks += 1
    if os.path.exists("Frontend/src/utils/whisperLiveClient.js"):
        with open("Frontend/src/utils/whisperLiveClient.js", "r") as f:
            content = f.read()
            required_features = [
                "WebSocket",
                "MediaRecorder",
                "echoCancellation",
                "processAndSendAudio",
                "handleServerMessage"
            ]
            found_features = sum(1 for feature in required_features if feature in content)
            if found_features == len(required_features):
                print(f"✅ WhisperLiveClient has all required features ({found_features}/{len(required_features)})")
                checks_passed += 1
            else:
                print(f"❌ WhisperLiveClient missing features ({found_features}/{len(required_features)})")
    else:
        print("❌ Cannot check WhisperLiveClient - file not found")

    # Check AEC processor for WebRTC usage
    total_checks += 1
    if os.path.exists("WhisperLive/whisper_live/preprocessing/aec_processor.py"):
        with open("WhisperLive/whisper_live/preprocessing/aec_processor.py", "r") as f:
            content = f.read()
            if "webrtc" in content.lower() and "aec" in content.lower():
                print("✅ AEC processor includes WebRTC AEC implementation")
                checks_passed += 1
            else:
                print("❌ AEC processor missing WebRTC AEC implementation")
    else:
        print("❌ Cannot check AEC processor - file not found")

    # Check audio processor integration
    total_checks += 1
    if os.path.exists("WhisperLive/whisper_live/preprocessing/audio_processor.py"):
        with open("WhisperLive/whisper_live/preprocessing/audio_processor.py", "r") as f:
            content = f.read()
            if "AECProcessor" in content and "process_audio_chunk" in content:
                print("✅ Audio processor includes AEC integration")
                checks_passed += 1
            else:
                print("❌ Audio processor missing AEC integration")
    else:
        print("❌ Cannot check audio processor - file not found")

    return checks_passed == total_checks

def main():
    """Main validation function"""
    print("🎯 Hybrid AEC Implementation Validation")
    print("=" * 50)
    print("Validating complete hybrid AEC system implementation...")
    print("This checks file structure and basic implementation completeness.")
    print("For full functionality testing, run with proper Python environment.\n")

    # Run all validations
    frontend_ok = validate_frontend_files()
    backend_ok = validate_backend_files()
    config_ok = validate_configuration()
    implementation_ok = check_key_implementations()

    # Summary
    print("\n" + "=" * 50)
    print("📊 Validation Summary")
    print("=" * 50)

    results = [
        ("Frontend Files", frontend_ok),
        ("Backend Files", backend_ok),
        ("Configuration", config_ok),
        ("Implementation", implementation_ok)
    ]

    all_passed = True
    for component, status in results:
        result_icon = "✅" if status else "❌"
        print(f"{result_icon} {component}: {'PASS' if status else 'FAIL'}")
        if not status:
            all_passed = False

    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 All validations passed!")
        print("\n🚀 Implementation Complete!")
        print("\nNext steps:")
        print("1. Install dependencies: pip install webrtc-audio-processing")
        print("2. Start WhisperLive server: python run_server.py --backend faster_whisper")
        print("3. Start frontend: npm run dev")
        print("4. Test continuous conversation mode")
        print("\n📖 See HYBRID_AEC_README.md for detailed documentation")
    else:
        print("⚠️ Some validations failed. Please check the errors above.")
        print("\n🔧 Common fixes:")
        print("- Ensure all files were created correctly")
        print("- Check file paths and names")
        print("- Verify imports are correct")
        print("- Run: python3 validate_hybrid_aec_setup.py")

    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
