from graphics import Canvas

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
