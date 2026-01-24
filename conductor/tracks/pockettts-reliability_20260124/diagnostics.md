# PocketTTS Diagnostics (Phase 1)

## Asset Verification (local)
Command:
- `bun run tts:verify`

Result (January 24, 2026):
- All required PocketTTS assets present and non-trivial size (tokenizer, voices, ONNX, ort runtime).

## Reproduction Attempts
- **Tauri dev**: Not executed in this environment (no GUI). Needs manual run in local dev environment to capture runtime stack traces.
- **Web dev**: Not executed in this environment (no browser audio). Needs manual run to reproduce garbled output and capture logs.

## Temporary Instrumentation Added
- Added timing/status logs in `src/lib/pocket-tts.ts` for model load, voice registration, and generation duration.
- Logs include load attempt count, elapsed times, and generation duration.

## Suggested Manual Repro Steps (for follow-up)
1. Run `bun run tauri dev` and attempt PocketTTS playback on several pages (repeat 3–5 times) to capture any `Models are not loaded yet` errors or garbled audio.
2. Run `bun run dev` (web), open the reader, and repeat PocketTTS playback to capture any garbled audio and corresponding console logs.
3. Save console output and worker logs (PocketTTS prefix) for analysis.
