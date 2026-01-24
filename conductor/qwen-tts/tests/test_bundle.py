import os
import pytest
import sys

# Add the parent directory to sys.path to allow importing bundle.py
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_bundle_script_exists():
    # Adjusted path for running from conductor/qwen-tts
    assert os.path.exists("bundle.py")

def test_bundle_function_defined():
    import bundle
    assert callable(bundle.run_bundle)
