#!/bin/bash

# Script to restart WhisperLive server with improved transcription

echo "🔧 Restarting WhisperLive Server with Enhanced Logging..."

# Kill any existing WhisperLive servers on port 9090
echo "🛑 Checking for existing servers..."
lsof -ti:9090 | xargs kill -9 2>/dev/null || echo "   No existing servers found"

# Wait a moment for port to be released
sleep 2

echo "✅ Port 9090 is now available"
echo ""
echo "📋 Server will use the following settings:"
echo "   - Backend: faster_whisper"
echo "   - Model: base"
echo "   - Port: 9090"
echo "   - Max connection time: 600 seconds (10 minutes)"
echo "   - Enhanced logging: ENABLED"
echo "   - no_speech_thresh: 0.6 (less aggressive filtering)"
echo ""
echo "🚀 Starting server..."
echo "   (Press Ctrl+C to stop)"
echo ""

cd /Volumes/Projects/Whisper-pipeline/WhisperLive
source ../whisper_env/bin/activate
python run_server.py --backend faster_whisper --port 9090

