# Implementation Plan: Qwen TTS 0.6B Model Switch

## Phase 1: Model Update & Server Refactor
- [x] Task: Update default model in `server.py` 89700c3
    - [x] Update `_model_name` variable to `Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice` in `conductor/qwen-tts/server.py`.
- [ ] Task: TDD - Verify Model Loading & Latency
    - [ ] Write tests in `conductor/qwen-tts/tests/test_server_optimization.py` to:
        - [ ] Verify the server loads the 0.6B model successfully.
        - [ ] Measure and log the latency for a sample TTS request.
        - [ ] Assert that the generated audio is valid.
    - [ ] Implement model switch if not already done.
    - [ ] Run tests and ensure they pass.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Model Update & Server Refactor' (Protocol in workflow.md)

## Phase 2: Final Verification & Cleanup
- [ ] Task: Full System Integration Test
    - [ ] Run the AI Reader application with the updated TTS sidecar.
    - [ ] Manually verify TTS generation in the reader interface.
- [ ] Task: Documentation & Final Notes
    - [ ] Update `conductor/qwen-tts/README.md` if the model identifier or requirements have changed.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Final Verification & Cleanup' (Protocol in workflow.md)
