# .gitignore Explanation

This document explains what files are excluded from Git and why.

## 🚫 Files/Folders Excluded

### 1. **Virtual Environments** (`whisper_env/`, `WhisperLive/whisper_env/`)
**Why**: Virtual environments are large (hundreds of MB) and platform-specific. Each developer should create their own.
**Action**: Run `setup_virtual_env.sh` or `python -m venv whisper_env` to create locally.

### 2. **Python Cache** (`__pycache__/`, `*.pyc`)
**Why**: Compiled Python bytecode files are automatically generated and platform-specific.
**Action**: Automatically regenerated when Python runs.

### 3. **Node Modules** (`node_modules/`)
**Why**: Frontend dependencies are large (hundreds of MB) and can be reinstalled from `package.json`.
**Action**: Run `npm install` in `Frontend/` directory to restore.

### 4. **Build Artifacts** (`dist/`, `build/`, `*.egg-info/`)
**Why**: Generated files from build processes, can be recreated.
**Action**: Automatically generated during build.

### 5. **OS Files** (`.DS_Store`, `Thumbs.db`)
**Why**: Operating system metadata files, not needed in repository.
**Action**: Automatically created by OS, safe to ignore.

### 6. **IDE Files** (`.vscode/`, `.idea/`)
**Why**: Editor-specific settings, each developer has their own preferences.
**Action**: Configure your IDE locally as needed.

### 7. **Environment Files** (`.env`, `.env.local`)
**Why**: May contain secrets, API keys, or local configuration.
**Action**: Create `.env.example` with template values (without secrets).

### 8. **Media Files** (`*.mp3`, `*.wav`, `*.flac`)
**Why**: Large binary files bloat the repository. Use Git LFS if needed.
**Action**: Store test audio files elsewhere or use Git LFS.

### 9. **Archive Files** (`*.zip`, `*.tar.gz`)
**Why**: Compressed archives are usually temporary or can be regenerated.
**Action**: Extract and commit source files instead.

### 10. **Documentation Build** (`docs/_build/`, `docs/html/`)
**Why**: Generated documentation, can be rebuilt from source.
**Action**: Run documentation build tools to regenerate.

### 11. **Log Files** (`*.log`)
**Why**: Runtime logs are temporary and can be large.
**Action**: Logs are generated during runtime.

### 12. **Cache Directories** (`.cache/`, `~/.cache/whisper-live/`)
**Why**: Model caches and temporary files can be very large (GB).
**Action**: Models are downloaded automatically on first use.

### 13. **Test Outputs** (`.coverage`, `htmlcov/`)
**Why**: Generated test reports, can be recreated.
**Action**: Run tests to regenerate.

## ✅ Files That ARE Committed

These important files are **NOT** ignored:

- ✅ Source code (`.py`, `.js`, `.jsx`, `.css`)
- ✅ Configuration files (`package.json`, `requirements.txt`, `setup.py`)
- ✅ Documentation (`README.md`, `QUICK_START.md`, `*.md` in docs/)
- ✅ Scripts (`*.sh`, `*.py` test scripts)
- ✅ Frontend public assets (`Frontend/public/*.txt`, `Frontend/public/images/`)
- ✅ License files (`LICENSE`)
- ✅ Git configuration (`.gitignore`, `.gitattributes`)

## 📝 Special Cases

### Debug Documentation Files
Some temporary debug documentation files are ignored:
- `DEBUG_*.md`
- `*_DEBUG.md`
- `FIXES_APPLIED.md`
- `COMPLETE_FIX_SUMMARY.md`

**Why**: These are temporary debugging notes, not permanent documentation.

**Important docs are kept**:
- `QUICK_START.md`
- `README.md`
- `TRANSCRIPTION_FIX.md`
- `AEC_TESTING_GUIDE.md`

### Text Files
Most `.txt` files are ignored, **except**:
- `requirements/*.txt` (dependency lists)
- `Frontend/public/*.txt` (content files)
- `Frontend/docs/*.txt` (documentation)

## 🔧 If You Need to Commit Ignored Files

### Option 1: Force Add (Not Recommended)
```bash
git add -f path/to/file
```

### Option 2: Update .gitignore
If a file should be committed, remove or modify the relevant pattern in `.gitignore`.

### Option 3: Use Git LFS for Large Files
For large binary files (models, media):
```bash
git lfs track "*.bin"
git lfs track "*.mp3"
git add .gitattributes
```

## 📊 Repository Size Impact

**Before .gitignore**: Would include:
- Virtual environments: ~500MB+
- Node modules: ~200MB+
- Python cache: ~50MB+
- Model caches: ~1GB+
- **Total**: ~2GB+

**After .gitignore**: Only source code and configs
- Source code: ~10MB
- Documentation: ~5MB
- **Total**: ~15MB

## ✅ Verification

To check what would be committed:
```bash
git status
git ls-files
```

To see what's being ignored:
```bash
git status --ignored
```

---

**Last Updated**: December 2024
**Maintained By**: Project Team

