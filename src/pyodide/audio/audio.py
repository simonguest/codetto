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


_NOTE_OFFSETS = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def _note_to_freq(note):
    n = note.strip()
    letter = n[0].upper()
    i = 1
    accidental = 0
    if i < len(n) and n[i] in ("#", "b"):
        accidental = 1 if n[i] == "#" else -1
        i += 1
    octave = int(n[i:])
    midi = (octave + 1) * 12 + _NOTE_OFFSETS[letter] + accidental
    return 440.0 * (2.0 ** ((midi - 69) / 12.0))


def _note_or_chord_to_freqs(note):
    if isinstance(note, (list, tuple)):
        return [_note_to_freq(n) for n in note]
    return [_note_to_freq(note)]


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


def play_note(note, duration):
    """Play a note or chord and block until it finishes."""
    notes_json = json.dumps([{"freqs": _note_or_chord_to_freqs(note), "duration": duration}])
    _audio_decode(_audio_note_play(notes_json, True))  # type: ignore


async def play_note_async(note, duration):
    """Play a note or chord without blocking."""
    notes_json = json.dumps([{"freqs": _note_or_chord_to_freqs(note), "duration": duration}])
    _audio_decode(_audio_note_play(notes_json, False))  # type: ignore


def play_notes(notes):
    """Play a sequence of notes/chords and block until finished."""
    items = [{"freqs": _note_or_chord_to_freqs(n), "duration": d} for n, d in notes]
    _audio_decode(_audio_note_play(json.dumps(items), True))  # type: ignore


async def play_notes_async(notes):
    """Play a sequence of notes/chords without blocking."""
    items = [{"freqs": _note_or_chord_to_freqs(n), "duration": d} for n, d in notes]
    _audio_decode(_audio_note_play(json.dumps(items), False))  # type: ignore


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
_audio_mod.play_note = play_note
_audio_mod.play_note_async = play_note_async
_audio_mod.play_notes = play_notes
_audio_mod.play_notes_async = play_notes_async
_audio_mod.speak = speak
_audio_mod.speak_async = speak_async
_audio_mod.Voice = Voice
sys.modules["audio"] = _audio_mod
