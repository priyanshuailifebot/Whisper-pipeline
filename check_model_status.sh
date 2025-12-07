#!/bin/bash

echo "🔍 Checking WhisperLive large-v3 model download status..."
echo ""

MODEL_DIR="$HOME/.cache/whisper-live/whisper-ct2-models/large-v3"

if [ ! -d "$MODEL_DIR" ]; then
    echo "❌ Model directory doesn't exist yet: $MODEL_DIR"
    echo "   The server is still downloading..."
    echo ""
    echo "💡 To monitor download progress, run:"
    echo "   watch -n 2 'du -sh ~/.cache/whisper-live 2>/dev/null || echo \"Download not started yet\"'"
else
    echo "✅ Model directory exists: $MODEL_DIR"
    echo ""
    echo "📦 Files in model directory:"
    ls -lh "$MODEL_DIR" 2>/dev/null
    echo ""
    TOTAL_SIZE=$(du -sh "$MODEL_DIR" 2>/dev/null | cut -f1)
    echo "📊 Total size: $TOTAL_SIZE"
    echo ""
    
    # Check if model is complete (should have config.json, model.bin, vocabulary files, etc.)
    if [ -f "$MODEL_DIR/config.json" ] && [ -f "$MODEL_DIR/model.bin" ]; then
        echo "✅ Model appears to be COMPLETE (config.json and model.bin exist)"
        echo ""
        echo "🎯 You can now refresh your browser - SERVER_READY should appear!"
    else
        echo "⏳ Model is DOWNLOADING (files are incomplete)"
        echo "   Current files:"
        ls -1 "$MODEL_DIR" 2>/dev/null | head -10
    fi
fi

echo ""
echo "📍 Expected final size: ~3GB for large-v3"
echo "⏱️  Expected download time: 5-10 minutes (depending on your internet)"

