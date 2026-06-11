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


def capture_frame(camera):
    """Capture a still image from a running camera.

    Returns a JPEG data URL string: "data:image/jpeg;base64,..."
    Suitable for passing directly to a VLM API as an image input.
    The camera must have produced at least one frame before calling this.
    """
    camera_handle = object.__getattribute__(camera, "_handle")
    return _decode(_cv_capture_frame(camera_handle))  # type: ignore


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


def start_face_detector(camera, delegate="GPU"):
    """Attach a MediaPipe face detector to a running camera.

    delegate: "GPU" (default) or "CPU". Falls back to CPU with a warning if
    GPU is unavailable.
    Loads the BlazeFace model (first call only), then runs detection on demand.
    Returns a detector with .get_detections() and .stop() methods.
    Each detection: {"type": "face", "x", "y", "w", "h", "confidence"}.
    """
    camera_handle = object.__getattribute__(camera, "_handle")
    return _decode(_cv_start_face_detector(camera_handle, delegate))  # type: ignore


def start_object_detector(camera, delegate="GPU"):
    """Attach a MediaPipe EfficientDet-Lite0 object detector to a running camera.

    delegate: "CPU" (default) or "GPU". If GPU is unavailable a warning is
    printed and the detector falls back to CPU automatically.
    Returns a detector with .get_detections() and .stop() methods.
    Each detection: {"type": "<label>", "x", "y", "w", "h", "confidence"}.
    """
    camera_handle = object.__getattribute__(camera, "_handle")
    return _decode(_cv_start_object_detector(camera_handle, delegate))  # type: ignore


def start_pose_detector(camera, delegate="GPU", num_poses=1):
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


def start_gesture_detector(camera, delegate="GPU", num_hands=2):
    """Attach a MediaPipe Gesture Recognizer to a running camera.

    delegate: "CPU" (default) or "GPU". Falls back to CPU with a warning if
    GPU is unavailable.
    num_hands: maximum number of hands to detect simultaneously (default 2).
    Returns a detector with .get_detections() and .stop() methods.
    Each detection is a dict:
      {"gesture": str, "confidence": float, "handedness": "Left"|"Right",
       "landmarks": [{"x": int, "y": int, "z": float}, ...]}  # 21 landmarks
    Use cv.HAND constants to index landmarks, e.g. cv.HAND.THUMB_TIP.
    Gesture values: "None", "Closed_Fist", "Open_Palm", "Pointing_Up",
                    "Thumb_Down", "Thumb_Up", "Victory", "ILoveYou".
    """
    camera_handle = object.__getattribute__(camera, "_handle")
    return _decode(_cv_start_gesture_detector(camera_handle, delegate, num_hands))  # type: ignore


def start_segmenter(camera, delegate="GPU"):
    """Attach a MediaPipe Selfie Multi-Class segmenter to a running camera.

    delegate: "GPU" (default) or "CPU". Falls back to CPU with a warning if
    GPU is unavailable.
    Returns a segmenter with .get_segments() and .stop() methods.
    .get_segments() returns a list of class names visible in the current frame,
    e.g. ["background", "hair", "clothes"].
    Use cv.color_segment() or cv.apply_image_to_segment() to paint segments.
    """
    camera_handle = object.__getattribute__(camera, "_handle")
    return _decode(_cv_start_segmenter(camera_handle, delegate))  # type: ignore


def color_segment(canvas, segmenter, class_name, color, opacity=0.5):
    """Paint a segment class with a solid color on the canvas overlay.

    canvas: the graphics canvas.
    segmenter: a segmenter returned by cv.start_segmenter().
    class_name: one of cv.SEGMENT constants or a string:
                "background", "hair", "body_skin", "face_skin", "clothes", "others".
    color: any CSS color string, e.g. "#ff0000" or "red".
    opacity: 0.0 (transparent) to 1.0 (opaque), default 0.5.
    Replaces any previous overlay (draw_poses, draw_hands, etc.).
    """
    canvas_handle = object.__getattribute__(canvas, "_handle")
    segmenter_handle = object.__getattribute__(segmenter, "_handle")
    _cv_color_segment(canvas_handle, segmenter_handle, class_name, color, opacity)  # type: ignore


def apply_image_to_segment(canvas, segmenter, class_name, image_path, opacity=0.8):
    """Apply an image to a segment class, clipped to the segment shape.

    canvas: the graphics canvas.
    segmenter: a segmenter returned by cv.start_segmenter().
    class_name: one of cv.SEGMENT constants or a string.
    image_path: path to an image file, e.g. "/sample_files/fabric.jpg".
    opacity: 0.0 to 1.0, default 0.8.
    The image is scaled to fill the full canvas and clipped to the segment.
    Replaces any previous overlay.
    """
    canvas_handle = object.__getattribute__(canvas, "_handle")
    segmenter_handle = object.__getattribute__(segmenter, "_handle")
    _cv_apply_image_to_segment(canvas_handle, segmenter_handle, class_name, image_path, opacity)  # type: ignore


class _SegmentClasses:
    BACKGROUND = 'background'
    HAIR = 'hair'
    BODY_SKIN = 'body_skin'
    FACE_SKIN = 'face_skin'
    CLOTHES = 'clothes'
    OTHERS = 'others'


SEGMENT = _SegmentClasses()

class _HandLandmarks:
    WRIST = 0
    THUMB_CMC = 1
    THUMB_MCP = 2
    THUMB_IP = 3
    THUMB_TIP = 4
    INDEX_FINGER_MCP = 5
    INDEX_FINGER_PIP = 6
    INDEX_FINGER_DIP = 7
    INDEX_FINGER_TIP = 8
    MIDDLE_FINGER_MCP = 9
    MIDDLE_FINGER_PIP = 10
    MIDDLE_FINGER_DIP = 11
    MIDDLE_FINGER_TIP = 12
    RING_FINGER_MCP = 13
    RING_FINGER_PIP = 14
    RING_FINGER_DIP = 15
    RING_FINGER_TIP = 16
    PINKY_MCP = 17
    PINKY_PIP = 18
    PINKY_DIP = 19
    PINKY_TIP = 20


HAND = _HandLandmarks()

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
_cv_mod.capture_frame = capture_frame
_cv_mod.start_camera = start_camera
_cv_mod.start_face_detector = start_face_detector
_cv_mod.start_object_detector = start_object_detector
_cv_mod.start_pose_detector = start_pose_detector
_cv_mod.POSE = POSE
_cv_mod.start_gesture_detector = start_gesture_detector
_cv_mod.HAND = HAND
_cv_mod.start_segmenter = start_segmenter
_cv_mod.color_segment = color_segment
_cv_mod.apply_image_to_segment = apply_image_to_segment
_cv_mod.SEGMENT = SEGMENT
_cv_mod.DOMProxy = DOMProxy
sys.modules["cv"] = _cv_mod
