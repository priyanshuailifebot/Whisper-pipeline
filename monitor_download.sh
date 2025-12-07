#!/bin/bash

echo "📊 Real-time WhisperLive Model Download Monitor"
echo "================================================"
echo ""
echo "Press Ctrl+C to stop monitoring"
echo ""

CACHE_DIR="$HOME/.cache/whisper-live"

while true; do
    clear
    echo "📊 WhisperLive Model Download Status - $(date '+%H:%M:%S')"
    echo "=============================================="
    echo ""
    
    # Check cache size
    if [ -d "$CACHE_DIR" ]; then
        SIZE=$(du -sh "$CACHE_DIR" 2>/dev/null | cut -f1)
        echo "💾 Cache size: $SIZE (Target: ~3GB)"
    else
        echo "💾 Cache size: Not created yet"
    fi
    
    # Check if model directory exists
    MODEL_DIR="$CACHE_DIR/whisper-ct2-models/large-v3"
    if [ -d "$MODEL_DIR" ]; then
        MODEL_SIZE=$(du -sh "$MODEL_DIR" 2>/dev/null | cut -f1)
        echo "📦 Model size: $MODEL_SIZE"
        echo ""
        echo "📁 Files:"
        ls -lh "$MODEL_DIR" 2>/dev/null | tail -n +2 | head -10
    else
        echo "📦 Model: Downloading..."
    fi
    
    echo ""
    echo "🔄 Server process:"
    ps aux | grep "run_server.py" | grep -v grep | awk '{printf "   PID: %s, CPU: %s%%, MEM: %sMB\n", $2, $3, int($6/1024)}'
    
    echo ""
    echo "🌐 Network connections:"
    lsof -p $(pgrep -f "run_server.py" | head -1) 2>/dev/null | grep -E "ESTABLISHED|cloudfront" | grep -v "localhost" | head -3 | awk '{print "   " $0}'
    
    echo ""
    echo "⏱️  Refreshing in 3 seconds..."
    sleep 3
done

