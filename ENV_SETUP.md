# Environment Variables Setup

## 🔐 Required Environment Variables

This project requires API keys for Azure services. **Never commit these keys to Git!**

### Frontend Environment Variables

Create a `.env` file in the `Frontend/` directory:

```bash
cd Frontend
cp .env.example .env
```

Then edit `.env` and add your keys:

```env
# Azure OpenAI Configuration
VITE_AZURE_OPENAI_API_KEY=your_azure_openai_key_here
VITE_AZURE_OPENAI_ENDPOINT=https://openai-04.openai.azure.com/
VITE_AZURE_OPENAI_API_VERSION=2024-12-01-preview
VITE_AZURE_OPENAI_DEPLOYMENT=gpt-4o

# Azure Speech Services Configuration
VITE_AZURE_SPEECH_KEY=your_azure_speech_key_here
VITE_AZURE_SPEECH_REGION=centralindia

# WhisperLive Server (optional, defaults to localhost)
VITE_WHISPER_SERVER_URL=ws://localhost:9090
```

### Where to Get API Keys

1. **Azure OpenAI Key**:
   - Go to: https://portal.azure.com
   - Navigate to your Azure OpenAI resource
   - Go to "Keys and Endpoint"
   - Copy the key

2. **Azure Speech Key**:
   - Go to: https://portal.azure.com
   - Navigate to your Speech Services resource
   - Go to "Keys and Endpoint"
   - Copy the key

### Security Notes

- ✅ `.env` files are already in `.gitignore` - they won't be committed
- ✅ API keys are loaded from environment variables only
- ✅ No hardcoded keys in the codebase
- ⚠️ **Never share your `.env` file or commit it to Git**

### Verification

After creating `.env`, restart the frontend:
```bash
cd Frontend
npm run dev
```

Check browser console - you should NOT see warnings about missing API keys.

---

**Status**: ✅ Secrets removed from codebase
**Action**: Create `.env` file with your actual API keys

