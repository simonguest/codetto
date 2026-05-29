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


def get_canvas(width=400, height=300):
    """Create a canvas in the cell output area and return a DOMProxy for it.

    The canvas element is created on the main thread synchronously; the
    cell result tab is updated to display it before this call returns.
    """
    return _decode(_cv_create_canvas(width, height))  # type: ignore


_cv_mod = types.ModuleType("cv")
_cv_mod.get_canvas = get_canvas
_cv_mod.DOMProxy = DOMProxy
sys.modules["cv"] = _cv_mod
