#!/bin/bash

# Setup script for WhisperLive with Hybrid AEC (Browser + Server)
# This script installs all necessary dependencies and configures the system

echo "🎯 Setting up WhisperLive with Hybrid AEC"
echo "=========================================="

# Check if we're in the correct directory
if [ ! -d "WhisperLive" ]; then
    echo "❌ Error: WhisperLive directory not found. Please run this script from the project root."
    exit 1
fi

cd WhisperLive

echo "📦 Installing Python dependencies..."

# Install webrtc-audio-processing for server-side AEC
pip install webrtc-audio-processing

# Verify installation
python -c "import webrtc_audio_processing; print('✅ WebRTC Audio Processing installed successfully')"

echo "🔧 Setting up WhisperLive server..."

# Make sure the preprocessing modules are available
if [ ! -d "whisper_live/preprocessing" ]; then
    echo "❌ Error: Preprocessing modules not found. Please ensure AEC implementation is complete."
    exit 1
fi

echo "✅ WhisperLive server setup complete!"
echo ""
echo "🚀 To start the server with AEC enabled:"
echo "   cd WhisperLive"
echo "   python run_server.py --backend faster_whisper --port 9090"
echo ""
echo "🌐 Frontend will connect automatically to ws://localhost:9090"
echo ""
echo "🔍 To test the AEC functionality:"
echo "   1. Start the WhisperLive server"
echo "   2. Start the frontend (npm run dev)"
echo "   3. Switch to continuous conversation mode"
echo "   4. Speak while avatar is responding to test echo cancellation"
