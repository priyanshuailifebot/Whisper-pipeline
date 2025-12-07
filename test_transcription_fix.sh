#!/bin/bash

# Quick fix script for transcription repetition issue

echo "🔧 Applying fixes for transcription repetition..."
echo ""

# Show current status
echo "📋 Current Issues:"
echo "   1. Transcriptions appearing multiple times"
echo "   2. Audio may be filtered too aggressively by AEC"
echo "   3. Low audio levels in browser"
echo ""

# Applied fixes
echo "✅ Fixes Applied:"
echo "   1. send_last_n_segments: 10 → 1 (prevent repetition)"
echo "   2. AEC temporarily disabled (test if it's causing silence)"
echo "   3. no_speech_thresh: 0.45 → 0.6 (less aggressive filtering)"
echo "   4. Enhanced server logging (track transcription flow)"
echo ""

echo "🚀 To test the fixes:"
echo ""
echo "1. Restart WhisperLive Server:"
echo "   cd /Volumes/Projects/Whisper-pipeline/WhisperLive"
echo "   source ../whisper_env/bin/activate"
echo "   python run_server.py --backend faster_whisper --port 9090"
echo ""
echo "2. Refresh browser (hard refresh: Cmd+Shift+R)"
echo ""
echo "3. Speak and observe:"
echo "   - Each phrase should appear ONCE (not repeated)"
echo "   - Server should show transcriptions being generated"
echo "   - Audio levels should be > 0.001 in browser console"
echo ""

echo "📊 What to check in server logs:"
echo "   ✅ GOOD: '🎯 Transcription result for client ...: 1 segments'"
echo "   ✅ GOOD: '✅ Added completed segment to transcript'"
echo "   ✅ GOOD: '📤 Sending 1 segments to client'"
echo "   ❌ BAD:  '⚠️ No transcription segments returned'"
echo ""

echo "📊 What to check in browser console:"
echo "   ✅ GOOD: '📝 WhisperLive transcript: [text]' (appears once)"
echo "   ✅ GOOD: 'Audio streaming: chunk X, level: 0.0024, avg: 0.0024'"
echo "   ❌ BAD:  'Audio level is very low - microphone may not be capturing'"
echo ""

echo "🎯 If repetition is FIXED but transcriptions still missing:"
echo "   - AEC was the problem"
echo "   - Keep AEC disabled or use gentler settings"
echo ""

echo "🎯 If repetition is FIXED and transcriptions work:"
echo "   - Success! All issues resolved"
echo "   - Can optionally re-enable AEC with gentler settings later"
echo ""

echo "📄 See TRANSCRIPTION_REPETITION_FIX.md for detailed explanation"
echo ""

