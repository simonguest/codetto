var r=`from graphics import Canvas

class Camera:
    def stop(self) -> None: ...

class Detector:
    def get_detections(self) -> list: ...
    def stop(self) -> None: ...

class _PoseLandmarks:
    NOSE: int
    LEFT_EYE_INNER: int
    LEFT_EYE: int
    LEFT_EYE_OUTER: int
    RIGHT_EYE_INNER: int
    RIGHT_EYE: int
    RIGHT_EYE_OUTER: int
    LEFT_EAR: int
    RIGHT_EAR: int
    MOUTH_LEFT: int
    MOUTH_RIGHT: int
    LEFT_SHOULDER: int
    RIGHT_SHOULDER: int
    LEFT_ELBOW: int
    RIGHT_ELBOW: int
    LEFT_WRIST: int
    RIGHT_WRIST: int
    LEFT_PINKY: int
    RIGHT_PINKY: int
    LEFT_INDEX: int
    RIGHT_INDEX: int
    LEFT_THUMB: int
    RIGHT_THUMB: int
    LEFT_HIP: int
    RIGHT_HIP: int
    LEFT_KNEE: int
    RIGHT_KNEE: int
    LEFT_ANKLE: int
    RIGHT_ANKLE: int
    LEFT_HEEL: int
    RIGHT_HEEL: int
    LEFT_FOOT_INDEX: int
    RIGHT_FOOT_INDEX: int

POSE: _PoseLandmarks

class _HandLandmarks:
    WRIST: int
    THUMB_CMC: int
    THUMB_MCP: int
    THUMB_IP: int
    THUMB_TIP: int
    INDEX_FINGER_MCP: int
    INDEX_FINGER_PIP: int
    INDEX_FINGER_DIP: int
    INDEX_FINGER_TIP: int
    MIDDLE_FINGER_MCP: int
    MIDDLE_FINGER_PIP: int
    MIDDLE_FINGER_DIP: int
    MIDDLE_FINGER_TIP: int
    RING_FINGER_MCP: int
    RING_FINGER_PIP: int
    RING_FINGER_DIP: int
    RING_FINGER_TIP: int
    PINKY_MCP: int
    PINKY_PIP: int
    PINKY_DIP: int
    PINKY_TIP: int

HAND: _HandLandmarks

class _SegmentClasses:
    BACKGROUND: str
    HAIR: str
    BODY_SKIN: str
    FACE_SKIN: str
    CLOTHES: str
    OTHERS: str

SEGMENT: _SegmentClasses

class Segmenter:
    def get_segments(self) -> list[str]: ...
    def stop(self) -> None: ...

def capture_frame(camera: Camera) -> str: ...
def start_camera(canvas: Canvas | None = None) -> Camera: ...
def start_face_detector(camera: Camera, delegate: str = "GPU") -> Detector: ...
def start_object_detector(camera: Camera, delegate: str = "GPU") -> Detector: ...
def start_pose_detector(camera: Camera, delegate: str = "GPU", num_poses: int = 1) -> Detector: ...
def start_gesture_detector(camera: Camera, delegate: str = "GPU", num_hands: int = 2) -> Detector: ...
def start_segmenter(camera: Camera, delegate: str = "GPU") -> Segmenter: ...
def color_segment(canvas: Canvas, segmenter: Segmenter, class_name: str, color: str, opacity: float = 0.5) -> None: ...
def apply_image_to_segment(canvas: Canvas, segmenter: Segmenter, class_name: str, image_path: str, opacity: float = 0.8) -> None: ...
`,l=`from typing import Optional, Union

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
`,c=`class Canvas:
    def get_context(self, context_type: str) -> Context: ...
    def clear(self) -> None: ...
    def draw_bounding_boxes(self, detections: list) -> None: ...
    def draw_pose(self, pose: list) -> None: ...
    def draw_poses(self, poses: list) -> None: ...
    def draw_hand(self, hand: dict) -> None: ...
    def draw_hands(self, hands: list) -> None: ...
    def get_width(self) -> int: ...
    def get_height(self) -> int: ...

class Context:
    fill_style: str
    stroke_style: str
    line_width: float
    font: str
    text_align: str
    text_baseline: str
    def begin_path(self) -> None: ...
    def arc(self, x: float, y: float, radius: float, start_angle: float, end_angle: float) -> None: ...
    def fill(self) -> None: ...
    def stroke(self) -> None: ...
    def fill_text(self, text: str, x: float, y: float) -> None: ...
    def stroke_rect(self, x: float, y: float, width: float, height: float) -> None: ...
    def fill_rect(self, x: float, y: float, width: float, height: float) -> None: ...
    def clear_rect(self, x: float, y: float, width: float, height: float) -> None: ...

class Colors:
    BLACK: str
    WHITE: str
    RED: str
    GREEN: str
    BLUE: str
    YELLOW: str
    CYAN: str
    MAGENTA: str
    ORANGE: str
    PURPLE: str
    PINK: str
    BROWN: str
    GRAY: str
    GREY: str
    LIGHT_GRAY: str
    LIGHT_GREY: str
    DARK_GRAY: str
    DARK_GREY: str

colors: Colors

def canvas(width: int = 0, height: int = 0) -> Canvas: ...
def draw_image(canvas: Canvas, path: str) -> None: ...
`,_=`from typing import Any, Callable

class DOMProxy:
    def __getattr__(self, name: str) -> Any: ...
    def __setattr__(self, name: str, value: Any) -> None: ...

class Mesh:
    def set_position(self, x: float = 0, y: float = 0, z: float = 0) -> "Mesh": ...
    def set_rotation(self, x: float = 0, y: float = 0, z: float = 0) -> "Mesh": ...
    def set_color(self, color: str) -> "Mesh": ...
    def set_texture(self, source: str) -> "Mesh": ...
    def set_scale(self, x: float = 1, y: float = 1, z: float = 1) -> "Mesh": ...
    def on_click(self, fn: Callable[[], None]) -> "Mesh": ...

class Scene:
    def set_sky(self, color: str = "#87CEEB") -> "Scene": ...
    def set_ground(self, length: float = 10, width: float = 10) -> "Scene": ...
    def add(self, mesh: Mesh) -> "Scene": ...
    def get_context(self, ctx_type: str = "2d") -> DOMProxy: ...
    def on_frame(self, fn: Callable[[float], None]) -> Callable[[float], None]: ...
    def run(self) -> None: ...

class _Shapes:
    @staticmethod
    def Box(width: float = 1, height: float = 1, depth: float = 1) -> Mesh: ...
    @staticmethod
    def Sphere(diameter: float = 1, segments: int = 16) -> Mesh: ...
    @staticmethod
    def Cylinder(diameter: float = 1, height: float = 1, tessellation: int = 24) -> Mesh: ...

Shapes: _Shapes
`;let e;const f=`
import jedi
import json

def _get_docstring(c):
    try:
        doc = c.docstring(raw=True)
        if not doc:
            return ''
        first_para = doc.split('\\n\\n')[0].strip()
        return ' '.join(first_para.split())[:200]
    except Exception:
        return ''

def _get_completions(source, line, column):
    try:
        script = jedi.Script(source)
        completions = script.complete(line, column)
        return json.dumps([
            {
                'name': c.name,
                'type': c.type,
                'prefixLen': len(c.name) - len(c.complete),
                'docstring': _get_docstring(c),
            }
            for c in completions
        ])
    except Exception:
        return '[]'

def _get_signatures(source, line, column):
    try:
        script = jedi.Script(source)
        sigs = script.get_signatures(line, column)
        if not sigs:
            return '[]'
        return json.dumps([
            {
                'name': s.name,
                'params': [p.description for p in s.params],
                'docstring': s.docstring(raw=True),
                'index': s.index,
            }
            for s in sigs
        ])
    except Exception:
        return '[]'
`;async function d(){{const{loadPyodide:s}=await import(new URL("../pyodide/pyodide.mjs",import.meta.url).toString());e=await s()}await e.loadPackage(["jedi","parso"]),e.FS.mkdirTree("/stubs");for(const[s,a]of[["cv",r],["audio",l],["graphics",c],["scene3d",_]])e.FS.writeFile(`/stubs/${s}.pyi`,a);await e.runPythonAsync(`import sys
if '/stubs' not in sys.path: sys.path.insert(0, '/stubs')`),await e.runPythonAsync(f)}let i=Promise.resolve();function o(s){i=i.then(s).catch(()=>{})}self.onmessage=s=>{const{type:a,...n}=s.data;switch(a){case"initialize":o(async()=>{try{await d(),self.postMessage({type:"initialized"})}catch(t){console.error("JediWorker: Initialization failed:",t),self.postMessage({type:"error",error:String(t)})}});break;case"sync_packages":o(async()=>{try{e&&n.code&&await e.loadPackagesFromImports(n.code)}catch(t){console.warn("JediWorker: Failed to sync packages:",t)}});break;case"signatures":o(async()=>{if(!e){self.postMessage({type:"sig_results",requestId:n.requestId,signatures:[]});return}let t="[]";try{t=await e.runPythonAsync(`_get_signatures(${JSON.stringify(n.script)}, ${n.line}, ${n.column})`)}catch{}self.postMessage({type:"sig_results",requestId:n.requestId,signatures:JSON.parse(t)})});break;case"complete":o(async()=>{if(!e){self.postMessage({type:"completions",requestId:n.requestId,completions:[]});return}let t="[]";try{t=await e.runPythonAsync(`_get_completions(${JSON.stringify(n.script)}, ${n.line}, ${n.column})`)}catch{}self.postMessage({type:"completions",requestId:n.requestId,completions:JSON.parse(t)})}),o(async()=>{try{e&&await e.loadPackagesFromImports(n.script)}catch{}});break}};
