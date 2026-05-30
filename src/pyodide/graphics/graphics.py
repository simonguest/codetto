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


_graphics_mod = types.ModuleType("graphics")
_graphics_mod.canvas = canvas
_graphics_mod.DOMProxy = DOMProxy
sys.modules["graphics"] = _graphics_mod
