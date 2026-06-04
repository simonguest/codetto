# type: ignore
import sys
import types
import json


def _camel(name):
    parts = name.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def _s3d_decode(json_str):
    result = json.loads(json_str)
    if result.get("type") == "error":
        raise RuntimeError(result.get("message", "Bridge error"))
    return result.get("value")


def _s3d_call(cmd, **kwargs):
    return _s3d_decode(_scene3d_call(json.dumps({"cmd": cmd, **kwargs})))  # type: ignore


class DOMProxy:
    """Wraps a main-thread object handle for the 2D overlay context.

    Attribute reads return callables that proxy to the main thread via the
    generic _via_call bridge. Attribute writes proxy as property sets via
    _via_set. Snake_case names are converted to camelCase automatically.
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


class Scene:
    def __init__(self):
        handle = _s3d_call("create_scene")
        self._handle = handle
        self._click_handlers = {}
        self._frame_handler = None
        self._frame_registered = False

    def set_sky(self, color="#87CEEB"):
        _s3d_call("set_sky", scene=self._handle, color=color)
        return self

    def set_ground(self, length=10, width=10):
        _s3d_call("set_ground", scene=self._handle, length=length, width=width)
        return self

    def add(self, mesh):
        config = {
            "type": mesh._type,
            "position": mesh._position,
            "scale": mesh._scale,
            "color": mesh._color,
            **mesh._params,
        }
        handle = _s3d_call("create_mesh", scene=self._handle, config=config)
        mesh._handle = handle
        if mesh._click_handler is not None:
            self._click_handlers[handle] = mesh._click_handler
            _s3d_call("register_click", scene=self._handle, mesh=handle)
        return self

    def get_context(self, ctx_type='2d'):
        """Return a DOMProxy for the 2D overlay canvas.

        Use this to draw HUD elements (text, shapes) on top of the 3D scene.
        All standard Canvas2D methods work via the bridge, plus ctx.clear()
        to wipe the overlay between frames.
        """
        handle = _s3d_call("get_context", scene=self._handle)
        return DOMProxy(handle)

    def on_frame(self, fn):
        """Register a callback invoked before each rendered frame.

        fn(dt) receives the elapsed time in seconds since the last call.
        Only one handler is active at a time; calling on_frame again replaces it.
        Can be used as a decorator: @scene.on_frame
        """
        self._frame_handler = fn
        if not self._frame_registered:
            self._frame_registered = True
            _s3d_call("register_frame", scene=self._handle)
        return fn  # enables use as a decorator

    def run(self):
        while True:
            result_json = _scene3d_wait_event(self._handle)  # type: ignore
            result = json.loads(result_json)
            if result["type"] == "timeout":
                continue  # allows Pyodide to check interrupt buffer each 250 ms
            elif result["type"] == "closed":
                break
            elif result["type"] == "frame":
                if self._frame_handler is not None:
                    self._frame_handler(result["dt"])
            elif result["type"] == "click":
                handler = self._click_handlers.get(result["mesh"])
                if handler is not None:
                    handler()


class _Mesh:
    def __init__(self, mesh_type, **params):
        self._type = mesh_type
        self._params = params
        self._position = {"x": 0, "y": 0, "z": 0}
        self._scale = {"x": 1, "y": 1, "z": 1}
        self._color = "#888888"
        self._click_handler = None
        self._handle = None

    def set_position(self, x=0, y=0, z=0):
        self._position = {"x": x, "y": y, "z": z}
        if self._handle is not None:
            _s3d_call("set_position", mesh=self._handle, x=x, y=y, z=z)
        return self

    def set_color(self, color):
        self._color = color
        if self._handle is not None:
            _s3d_call("set_color", mesh=self._handle, color=color)
        return self

    def set_scale(self, x=1, y=1, z=1):
        self._scale = {"x": x, "y": y, "z": z}
        if self._handle is not None:
            _s3d_call("set_scale", mesh=self._handle, x=x, y=y, z=z)
        return self

    def on_click(self, fn):
        self._click_handler = fn
        return self


class _Shapes:
    @staticmethod
    def Box(width=1, height=1, depth=1):
        return _Mesh("box", width=width, height=height, depth=depth)

    @staticmethod
    def Sphere(diameter=1, segments=16):
        return _Mesh("sphere", diameter=diameter, segments=segments)

    @staticmethod
    def Cylinder(diameter=1, height=1, tessellation=24):
        return _Mesh("cylinder", diameter=diameter, height=height, tessellation=tessellation)


Shapes = _Shapes()

_scene3d_mod = types.ModuleType("scene3d")
_scene3d_mod.Scene = Scene
_scene3d_mod.Shapes = Shapes
sys.modules["scene3d"] = _scene3d_mod
