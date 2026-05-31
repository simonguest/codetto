# type: ignore
import sys
import types
import json
import base64 as _base64
import os as _os


def _audio_decode(json_str):
    result = json.loads(json_str)
    if result.get("type") == "error":
        raise RuntimeError(result.get("message", "Audio error"))
    return result.get("value")


def _audio_to_data_url(path):
    ext = _os.path.splitext(path)[1].lower().lstrip(".")
    mime = {
        "mp3": "audio/mpeg",
        "ogg": "audio/ogg",
        "m4a": "audio/mp4",
        "flac": "audio/flac",
    }.get(ext, "audio/wav")
    with open(path, "rb") as f:
        data = f.read()
    return f"data:{mime};base64,{_base64.b64encode(data).decode()}"


def play(path):
    """Play an audio file and block until it finishes."""
    _audio_decode(_audio_play(_audio_to_data_url(path)))  # type: ignore


async def play_async(path):
    """Start playing an audio file without waiting for it to finish."""
    _audio_decode(_audio_play_nowait(_audio_to_data_url(path)))  # type: ignore


_audio_mod = types.ModuleType("audio")
_audio_mod.play = play
_audio_mod.play_async = play_async
sys.modules["audio"] = _audio_mod
