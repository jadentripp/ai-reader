# Implementation Plan: Qwen TTS 0.6B Model Switch

## Phase 1: Model Update & Server Refactor
- [x] Task: Update default model in `server.py` 89700c3
    - [x] Update `_model_name` variable to `Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice` in `conductor/qwen-tts/server.py`.
- [x] Task: Enable Hardware Acceleration & Speed Optimizations 89700c3
    - [x] Update `server.py` to use `do_sample=False` for faster inference.
    - [x] Attempted MPS acceleration (reverted as it was slower on this hardware).
- [x] Task: TDD - Verify Model Loading & Latency d1991f7
- [x] Task: Conductor - User Manual Verification 'Phase 1: Model Update & Server Refactor' (Protocol in workflow.md) 89700c3

## Phase 2: Final Verification & Cleanup
- [ ] Task: Full System Integration Test
    - [ ] Run the AI Reader application with the updated TTS sidecar.
    - [ ] Manually verify TTS generation in the reader interface.
- [ ] Task: Documentation & Final Notes
    - [ ] Update `conductor/qwen-tts/README.md` if the model identifier or requirements have changed.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Final Verification & Cleanup' (Protocol in workflow.md)
