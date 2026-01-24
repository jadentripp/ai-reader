import os
import sys
import pytest
import time
import torch

# Add the parent directory to sys.path to allow importing server.py
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_model_identifier():
    import server
    # Verify we are using the 0.6B CustomVoice model
    assert server._model_name == "Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice"

def test_model_loading_and_latency():
    import server
    
    print(f"\n[Test] Loading model: {server._model_name}")
    start_load = time.time()
    model = server.get_model()
    load_time = time.time() - start_load
    print(f"[Test] Model loaded in {load_time:.2f}s")
    
    assert model is not None
    
    # Test generation latency
    text = "This is a speed test for the 0.6B model."
    speaker = "Aiden"
    
    print(f"[Test] Generating speech for '{text}' with speaker {speaker}")
    start_gen = time.time()
    wavs, sr = model.generate_custom_voice(
        text=text,
        speaker=speaker,
        language="English"
    )
    gen_time = time.time() - start_gen
    
    audio = wavs[0] if isinstance(wavs, list) else wavs
    duration = len(audio) / sr
    
    print(f"[Test] Generated {duration:.2f}s audio in {gen_time:.2f}s")
    print(f"[Test] Real-time factor: {gen_time/duration:.2f}x")
    
    assert len(audio) > 0
    assert sr == 24000
