from typing import Optional, Union

class _VoiceSpec: ...

class _VoiceLocale:
    FEMALE: _VoiceSpec
    MALE: _VoiceSpec

class Voice:
    """Voice constants for text-to-speech. Each locale has .FEMALE and .MALE."""
    EN_US: _VoiceLocale
    EN_GB: _VoiceLocale
    EN_AU: _VoiceLocale
    FR_FR: _VoiceLocale
    DE_DE: _VoiceLocale
    ES_ES: _VoiceLocale
    IT_IT: _VoiceLocale
    PT_BR: _VoiceLocale
    JA_JP: _VoiceLocale
    ZH_CN: _VoiceLocale
    KO_KR: _VoiceLocale
    HI_IN: _VoiceLocale
    AR_SA: _VoiceLocale

Note = Union[str, list[str]]
NoteSequence = list[tuple[Note, float]]

def play_note(note: Note, duration: float) -> None:
    """Play a note or chord and block until it finishes.

    note: note name like "C4", "F#3", "Bb5", or a list of note names for a chord
    duration: length in seconds
    """
    ...

async def play_note_async(note: Note, duration: float) -> None:
    """Play a note or chord without blocking.

    note: note name like "C4", "F#3", "Bb5", or a list of note names for a chord
    duration: length in seconds
    """
    ...

def play_notes(notes: NoteSequence) -> None:
    """Play a sequence of notes/chords and block until finished.

    notes: list of (note, duration) tuples, e.g. [("C4", 0.5), (["C4","E4","G4"], 1.0)]
    """
    ...

async def play_notes_async(notes: NoteSequence) -> None:
    """Play a sequence of notes/chords without blocking.

    notes: list of (note, duration) tuples, e.g. [("C4", 0.5), (["C4","E4","G4"], 1.0)]
    """
    ...

def play(path: str) -> None:
    """Play an audio file and block until it finishes.

    path: path to the audio file (WAV, MP3, OGG, M4A, FLAC)
    """
    ...

async def play_async(path: str) -> None:
    """Start playing an audio file without waiting for it to finish.

    path: path to the audio file (WAV, MP3, OGG, M4A, FLAC)
    """
    ...

def speak(text: str, voice: Optional[_VoiceSpec] = None) -> None:
    """Speak text using the browser's text-to-speech and block until finished.

    text: the text to speak
    voice: optional Voice constant, e.g. Voice.EN_US.FEMALE
    """
    ...

async def speak_async(text: str, voice: Optional[_VoiceSpec] = None) -> None:
    """Speak text without blocking.

    text: the text to speak
    voice: optional Voice constant, e.g. Voice.EN_US.FEMALE
    """
    ...
