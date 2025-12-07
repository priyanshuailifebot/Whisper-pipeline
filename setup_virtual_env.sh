#!/bin/bash

# Setup virtual environment for WhisperLive with Hybrid AEC
echo "🐍 Setting up Python virtual environment for WhisperLive"

# Check if we're in the correct directory
if [ ! -d "WhisperLive" ]; then
    echo "❌ Error: Please run this script from the Whisper-pipeline directory"
    echo "Usage: cd /Volumes/Projects/Whisper-pipeline && ./setup_virtual_env.sh"
    exit 1
fi

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv whisper_env

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source whisper_env/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install WebRTC Audio Processing first (it's a dependency)
echo "🎯 Installing WebRTC Audio Processing..."
pip install webrtc-audio-processing

# Install WhisperLive and its dependencies
echo "🎤 Installing WhisperLive dependencies..."
cd WhisperLive
pip install -e .

# Install additional dependencies that might be needed
echo "📚 Installing additional dependencies..."
pip install numpy scipy torch torchaudio faster-whisper websockets

# Verify installation
echo "✅ Verifying installation..."
python -c "import webrtc_audio_processing; print('✅ WebRTC AEC available')"
python -c "import whisper_live; print('✅ WhisperLive available')"

echo ""
echo "🎉 Virtual environment setup complete!"
echo ""
echo "🚀 To activate the environment for future use:"
echo "   cd /Volumes/Projects/Whisper-pipeline"
echo "   source whisper_env/bin/activate"
echo ""
echo "🔥 To run WhisperLive server:"
echo "   source whisper_env/bin/activate"
echo "   cd WhisperLive"
echo "   python run_server.py --backend faster_whisper --port 9090"
echo ""
echo "💡 To deactivate: deactivate"
