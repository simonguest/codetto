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


def start_camera(canvas=None):
    """Start a webcam stream.

    If canvas is provided, frames are drawn into it each animation frame.
    Without a canvas the camera runs headlessly — useful when you only need
    detection data (e.g. inside a pygame loop).
    Blocks until the user grants camera permission (or raises RuntimeError if
    denied). Returns a camera controller with a .stop() method.
    """
    canvas_handle = object.__getattribute__(canvas, "_handle") if canvas is not None else None
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


def start_pose_detector(camera, delegate="CPU", num_poses=1):
    """Attach a MediaPipe Pose Landmarker to a running camera.

    delegate: "CPU" (default) or "GPU". If GPU is unavailable a warning is
    printed and the detector falls back to CPU automatically.
    num_poses: maximum number of poses to detect simultaneously (default 1).
    Returns a detector with .get_detections() and .stop() methods.
    Each detection is a list of 33 landmark dicts:
      {"x": int, "y": int, "z": float, "visibility": float}
    Use cv.POSE constants to index landmarks, e.g. cv.POSE.LEFT_ELBOW.
    """
    camera_handle = object.__getattribute__(camera, "_handle")
    return _decode(_cv_start_pose_detector(camera_handle, delegate, num_poses))  # type: ignore


class _PoseLandmarks:
    NOSE = 0
    LEFT_EYE_INNER = 1
    LEFT_EYE = 2
    LEFT_EYE_OUTER = 3
    RIGHT_EYE_INNER = 4
    RIGHT_EYE = 5
    RIGHT_EYE_OUTER = 6
    LEFT_EAR = 7
    RIGHT_EAR = 8
    MOUTH_LEFT = 9
    MOUTH_RIGHT = 10
    LEFT_SHOULDER = 11
    RIGHT_SHOULDER = 12
    LEFT_ELBOW = 13
    RIGHT_ELBOW = 14
    LEFT_WRIST = 15
    RIGHT_WRIST = 16
    LEFT_PINKY = 17
    RIGHT_PINKY = 18
    LEFT_INDEX = 19
    RIGHT_INDEX = 20
    LEFT_THUMB = 21
    RIGHT_THUMB = 22
    LEFT_HIP = 23
    RIGHT_HIP = 24
    LEFT_KNEE = 25
    RIGHT_KNEE = 26
    LEFT_ANKLE = 27
    RIGHT_ANKLE = 28
    LEFT_HEEL = 29
    RIGHT_HEEL = 30
    LEFT_FOOT_INDEX = 31
    RIGHT_FOOT_INDEX = 32


POSE = _PoseLandmarks()

_cv_mod = types.ModuleType("cv")
_cv_mod.start_camera = start_camera
_cv_mod.start_face_detector = start_face_detector
_cv_mod.start_object_detector = start_object_detector
_cv_mod.start_pose_detector = start_pose_detector
_cv_mod.POSE = POSE
_cv_mod.DOMProxy = DOMProxy
sys.modules["cv"] = _cv_mod
