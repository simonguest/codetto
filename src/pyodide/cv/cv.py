# type: ignore
import sys
import types
import json


def _camel(name):
    """Convert snake_case attribute names to camelCase for JS DOM APIs."""
    parts = name.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def _decode(json_str):
    """Decode a via.js result JSON string from the bridge."""
    result = json.loads(json_str)
    if result.get("type") == "handle":
        if result.get("warning"):
            print(f"Warning: {result['warning']}", flush=True)
        return DOMProxy(result["id"])
    if result.get("type") == "error":
        raise RuntimeError(result.get("message", "Bridge error"))
    return result.get("value")


class DOMProxy:
    """Wraps a main-thread DOM object handle.

    Attribute reads return callable methods that proxy to the main thread.
    Attribute writes proxy as property sets. All calls block synchronously
    via SharedArrayBuffer + Atomics.wait until the main thread responds.
    """

    def __init__(self, handle):
        object.__setattr__(self, "_handle", handle)

    def __getattr__(self, name):
        js_name = _camel(name)
        handle = object.__getattribute__(self, "_handle")

        def method(*args):
            return _decode(_via_call(handle, js_name, list(args)))  # type: ignore

        return method

    def __setattr__(self, name, value):
        if name.startswith("_"):
            object.__setattr__(self, name, value)
        else:
            handle = object.__getattribute__(self, "_handle")
            _via_set(handle, _camel(name), value)  # type: ignore


def get_canvas(width=0, height=0):
    """Create a canvas in the cell output area and return a DOMProxy for it.

    With no arguments the canvas fills the output cell width at a 4:3 aspect
    ratio and scales responsively on narrow screens. Supply both width and
    height (in pixels) to use explicit dimensions instead.
    """
    return _decode(_cv_create_canvas(width, height))  # type: ignore


def start_camera(canvas):
    """Start a webcam stream that draws frames into canvas.

    Blocks until the user grants camera permission (or raises RuntimeError if
    denied). Returns a camera controller with a .stop() method.
    """
    canvas_handle = object.__getattribute__(canvas, "_handle")
    return _decode(_cv_start_camera(canvas_handle))  # type: ignore


def start_face_detector(camera):
    """Attach a MediaPipe face detector to a running camera.

    Loads the BlazeFace model (first call only), then runs detection on demand.
    Returns a detector with .get_detections() and .stop() methods.
    Each detection: {"type": "face", "x", "y", "w", "h", "confidence"}.
    """
    camera_handle = object.__getattribute__(camera, "_handle")
    return _decode(_cv_start_face_detector(camera_handle))  # type: ignore


def start_object_detector(camera, delegate="CPU"):
    """Attach a MediaPipe EfficientDet-Lite0 object detector to a running camera.

    delegate: "CPU" (default) or "GPU". If GPU is unavailable a warning is
    printed and the detector falls back to CPU automatically.
    Returns a detector with .get_detections() and .stop() methods.
    Each detection: {"type": "<label>", "x", "y", "w", "h", "confidence"}.
    """
    camera_handle = object.__getattribute__(camera, "_handle")
    return _decode(_cv_start_object_detector(camera_handle, delegate))  # type: ignore


_cv_mod = types.ModuleType("cv")
_cv_mod.get_canvas = get_canvas
_cv_mod.start_camera = start_camera
_cv_mod.start_face_detector = start_face_detector
_cv_mod.start_object_detector = start_object_detector
_cv_mod.DOMProxy = DOMProxy
sys.modules["cv"] = _cv_mod
