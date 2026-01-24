# Implementation Plan: Qwen TTS 0.6B Model Switch [checkpoint: 75f8f7b]

## Phase 1: Model Update & Server Refactor [checkpoint: 75f8f7b]
- [x] Task: Update default model in `server.py` 89700c3
    - [x] Update `_model_name` variable to `Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice` in `conductor/qwen-tts/server.py`.
- [x] Task: Enable Hardware Acceleration & Speed Optimizations 75f8f7b
    - [x] Update `server.py` to use `do_sample=False` for faster inference.
    - [x] Attempted MPS acceleration (reverted as it was slower on this hardware).
- [x] Task: TDD - Verify Model Loading & Latency d1991f7
- [x] Task: Conductor - User Manual Verification 'Phase 1: Model Update & Server Refactor' (Protocol in workflow.md) 75f8f7b

## Phase 2: Final Verification & Cleanup [checkpoint: b03bc50]
- [x] Task: Full System Integration Test
    - [x] Run the AI Reader application with the updated TTS sidecar.
    - [x] Manually verify TTS generation in the reader interface.
- [x] Task: Documentation & Final Notes
    - [x] Update `conductor/qwen-tts/README.md` if the model identifier or requirements have changed.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Final Verification & Cleanup' (Protocol in workflow.md) b03bc50
