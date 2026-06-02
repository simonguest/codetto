# type: ignore
import sys
import types
import json
import base64 as _base64
import os as _os


def _camel(name):
    """Convert snake_case attribute names to camelCase for JS DOM APIs."""
    parts = name.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def _decode(json_str):
    """Decode a via.js result JSON string from the bridge."""
    result = json.loads(json_str)
    if result.get("type") == "handle":
        return DOMProxy(result["id"])
    if result.get("type") == "error":
        raise RuntimeError(result.get("message", "Bridge error"))
    return result.get("value")


class DOMProxy:
    """Wraps a main-thread DOM object handle."""

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


def canvas(width=0, height=0):
    """Create a canvas in the cell output area and return a DOMProxy for it.

    With no arguments the canvas fills the output cell width at a 4:3 aspect
    ratio. Supply both width and height (in pixels) for explicit dimensions.
    """
    return _decode(_graphics_create_canvas(width, height))  # type: ignore


def draw_image(canvas_proxy, path):
    """Draw an image file onto a canvas, scaled to fill it.

    canvas_proxy -- a Canvas returned by graphics.canvas()
    path         -- filesystem path to a PNG or JPEG image
    """
    with open(path, "rb") as f:
        data = f.read()
    ext = _os.path.splitext(path)[1].lower().lstrip(".")
    mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "gif": "image/gif",
            "webp": "image/webp"}.get(ext, "image/png")
    data_url = f"data:{mime};base64,{_base64.b64encode(data).decode()}"
    handle = object.__getattribute__(canvas_proxy, "_handle")
    _graphics_draw_image(handle, data_url)  # type: ignore


class _Colors:
    BLACK = "#000000"
    WHITE = "#ffffff"
    RED = "#ff0000"
    GREEN = "#008000"
    BLUE = "#0000ff"
    YELLOW = "#ffff00"
    CYAN = "#00ffff"
    MAGENTA = "#ff00ff"
    ORANGE = "#ffa500"
    PURPLE = "#800080"
    PINK = "#ffc0cb"
    BROWN = "#a52a2a"
    GRAY = "#808080"
    GREY = "#808080"
    LIGHT_GRAY = "#d3d3d3"
    LIGHT_GREY = "#d3d3d3"
    DARK_GRAY = "#404040"
    DARK_GREY = "#404040"


colors = _Colors()

_graphics_mod = types.ModuleType("graphics")
_graphics_mod.canvas = canvas
_graphics_mod.draw_image = draw_image
_graphics_mod.DOMProxy = DOMProxy
_graphics_mod.colors = colors
sys.modules["graphics"] = _graphics_mod
