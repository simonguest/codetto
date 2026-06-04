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
    if result.get("type") == "unavailable":
        print("Speech synthesis is not supported in this browser.")
        return None
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


class _VoiceSpec:
    def __init__(self, lang, gender):
        self._lang = lang
        self._gender = gender

    def _to_json(self):
        return json.dumps({"lang": self._lang, "gender": self._gender})


class _VoiceLocale:
    def __init__(self, lang):
        self.FEMALE = _VoiceSpec(lang, "female")
        self.MALE = _VoiceSpec(lang, "male")


class Voice:
    EN_US = _VoiceLocale("en-US")
    EN_GB = _VoiceLocale("en-GB")
    EN_AU = _VoiceLocale("en-AU")
    FR_FR = _VoiceLocale("fr-FR")
    DE_DE = _VoiceLocale("de-DE")
    ES_ES = _VoiceLocale("es-ES")
    IT_IT = _VoiceLocale("it-IT")
    PT_BR = _VoiceLocale("pt-BR")
    JA_JP = _VoiceLocale("ja-JP")
    ZH_CN = _VoiceLocale("zh-CN")
    KO_KR = _VoiceLocale("ko-KR")
    HI_IN = _VoiceLocale("hi-IN")
    AR_SA = _VoiceLocale("ar-SA")


def _voice_json(voice):
    if voice is None:
        return json.dumps({"lang": None, "gender": None})
    return voice._to_json()


def speak(text, voice=None):
    """Speak text and block until finished."""
    _audio_decode(_tts_speak(str(text), _voice_json(voice), True))  # type: ignore


async def speak_async(text, voice=None):
    """Speak text without blocking."""
    _audio_decode(_tts_speak(str(text), _voice_json(voice), False))  # type: ignore


_audio_mod = types.ModuleType("audio")
_audio_mod.play = play
_audio_mod.play_async = play_async
_audio_mod.speak = speak
_audio_mod.speak_async = speak_async
_audio_mod.Voice = Voice
sys.modules["audio"] = _audio_mod
