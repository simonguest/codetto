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


class _MatBricks:
    DarkClay = "mat:bricks/Bricks057"
    RoughStone = "mat:bricks/Bricks075A"

class _MatCarpet:
    BlueCheckerboard = "mat:carpet/Carpet006"
    BeigePattern = "mat:carpet/Carpet008"

class _MatChip:
    CircuitGreen = "mat:chip/Chip001"
    CircuitRed = "mat:chip/Chip002"
    CircuitOrange = "mat:chip/Chip004"
    CircuitBlue = "mat:chip/Chip005"

class _MatFabric:
    BurgundyRibbed = "mat:fabric/Fabric026"
    BlueQuilted = "mat:fabric/Fabric046"
    BlackTartan = "mat:fabric/Fabric051"
    RedBlueCheck = "mat:fabric/Fabric057"
    Denim = "mat:fabric/Fabric069"

class _MatGrass:
    Bright = "mat:grass/Grass001"
    Dark = "mat:grass/Grass002"
    Olive = "mat:grass/Grass003"

class _MatGravel:
    LightGray = "mat:gravel/Gravel026"
    DarkGray = "mat:gravel/Gravel035"

class _MatMarble:
    Brown = "mat:marble/Marble008"
    Gray = "mat:marble/Marble012"
    Black = "mat:marble/Marble017"
    Charcoal = "mat:marble/Marble023"

class _MatPlanets:
    Earth = "mat-simple:planets/earth.jpg"
    Jupiter = "mat-simple:planets/jupiter.jpg"
    Mars = "mat-simple:planets/mars.jpg"
    Mercury = "mat-simple:planets/mercury.jpg"
    Neptune = "mat-simple:planets/neptune.jpg"
    Saturn = "mat-simple:planets/saturn.jpg"
    Uranus = "mat-simple:planets/uranus.jpg"
    Venus = "mat-simple:planets/venus.jpg"

class _MatRoad:
    PatchedAsphalt = "mat:road/Road003"
    AsphaltEdges = "mat:road/Road006"
    Highway = "mat:road/Road007"

class _MatRoofingTiles:
    DarkSlate = "mat:roofingtiles/RoofingTiles003"

class _MatSnow:
    Fresh = "mat:snow/Snow004"

class _MatSports:
    Soccerball = "mat-simple:sports/soccerball.png"
    Tennis = "mat-simple:sports/tennis.png"

class _MatTiles:
    LimeGreen = "mat:tiles/Tiles033"
    GreenMosaic = "mat:tiles/Tiles053"
    WoodHexagon = "mat:tiles/Tiles065"
    Checkerboard = "mat:tiles/Tiles074"

class _MatWood:
    Oak = "mat:wood/Wood048"

class _MatWoodFloor:
    PinePlanks = "mat:woodfloor/WoodFloor042"

class Material:
    Bricks = _MatBricks()
    Carpet = _MatCarpet()
    Chip = _MatChip()
    Fabric = _MatFabric()
    Grass = _MatGrass()
    Gravel = _MatGravel()
    Marble = _MatMarble()
    Planets = _MatPlanets()
    Road = _MatRoad()
    RoofingTiles = _MatRoofingTiles()
    Snow = _MatSnow()
    Sports = _MatSports()
    Tiles = _MatTiles()
    Wood = _MatWood()
    WoodFloor = _MatWoodFloor()


class Sky:
    CLOUDS = "env:clouds"
    DEEP_SPACE = "env:deep_space"
    MODERN_BUILDINGS = "env:modern_buildings"
    ORLANDO_STADIUM = "env:orlando_stadium"
    PURE_SKY = "env:puresky"


class Scene:
    def __init__(self):
        handle = _s3d_call("create_scene")
        self._handle = handle
        self._click_handlers = {}
        self._frame_handler = None
        self._frame_registered = False

    def __repr__(self):
        return ""

    def set_sky(self, color="#87CEEB"):
        _s3d_call("set_sky", scene=self._handle, color=color)
        return self

    def set_ground(self, length=10, width=10):
        handle = _s3d_call("set_ground", scene=self._handle, length=length, width=width)
        ground = _Mesh("ground")
        ground._handle = handle
        return ground

    def add(self, mesh):
        config = {
            "type": mesh._type,
            "position": mesh._position,
            "rotation": mesh._rotation,
            "scale": mesh._scale,
            "color": mesh._color,
            "texture": mesh._texture,
            "material": mesh._material,
            "glossiness": mesh._glossiness,
            "tiling": mesh._tiling,
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
        self._texture = None
        self._material = None
        self._glossiness = None
        self._tiling = None
        self._rotation = {"x": 0, "y": 0, "z": 0}
        self._click_handler = None
        self._handle = None

    def __repr__(self):
        return ""

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

    def set_texture(self, source):
        if source.startswith("data:"):
            data_url = source
        elif source.startswith("/"):
            ext = source.rsplit(".", 1)[-1].lower() if "." in source else "png"
            mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
                    "gif": "image/gif", "webp": "image/webp"}.get(ext, "image/png")
            import base64
            with open(source, "rb") as f:
                data_url = f"data:{mime};base64," + base64.b64encode(f.read()).decode()
        else:
            data_url = "data:image/png;base64," + source
        self._texture = data_url
        if self._handle is not None:
            _s3d_call("set_texture", mesh=self._handle, texture=data_url)
        return self

    def set_rotation(self, x=0, y=0, z=0):
        self._rotation = {"x": x, "y": y, "z": z}
        if self._handle is not None:
            _s3d_call("set_rotation", mesh=self._handle, x=x, y=y, z=z)
        return self

    def set_scale(self, x=1, y=1, z=1):
        self._scale = {"x": x, "y": y, "z": z}
        if self._handle is not None:
            _s3d_call("set_scale", mesh=self._handle, x=x, y=y, z=z)
        return self

    def set_material(self, material):
        self._material = material
        if self._handle is not None:
            _s3d_call("set_material", mesh=self._handle, material=material)
        return self

    def set_glossiness(self, value):
        self._glossiness = value
        if self._handle is not None:
            _s3d_call("set_glossiness", mesh=self._handle, value=value)
        return self

    def set_tiling(self, u, v=None):
        if v is None:
            v = u
        self._tiling = {"u": u, "v": v}
        if self._handle is not None:
            _s3d_call("set_tiling", mesh=self._handle, u=u, v=v)
        return self

    def get_position(self):
        return (self._position["x"], self._position["y"], self._position["z"])

    def get_rotation(self):
        return (self._rotation["x"], self._rotation["y"], self._rotation["z"])

    def get_scale(self):
        return (self._scale["x"], self._scale["y"], self._scale["z"])

    def get_color(self):
        return self._color

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
_scene3d_mod.Sky = Sky
_scene3d_mod.Material = Material
sys.modules["scene3d"] = _scene3d_mod
