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


def _resolve_material(mat_str):
    parts = mat_str.split(".")
    obj = Material
    for part in parts:
        obj = getattr(obj, part, None)
        if obj is None:
            return None
    return obj


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
    Moon = "mat-simple:planets/moon.jpg"
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


class Key:
    LEFT   = 'ArrowLeft'
    RIGHT  = 'ArrowRight'
    UP     = 'ArrowUp'
    DOWN   = 'ArrowDown'
    SPACE  = ' '
    ENTER  = 'Enter'
    ESCAPE = 'Escape'


class Sky:
    CLOUDS = "env:clouds"
    DEEP_SPACE = "env:deep_space"
    MODERN_BUILDINGS = "env:modern_buildings"
    ORLANDO_STADIUM = "env:orlando_stadium"
    PURE_SKY = "env:puresky"


class _AmbientLight:
    def __init__(self, scene_handle):
        self._scene = scene_handle

    def __repr__(self):
        return ""

    def set_brightness(self, value):
        _s3d_call("ambient_set_brightness", scene=self._scene, value=value)
        return self

    def set_color(self, color):
        _s3d_call("ambient_set_color", scene=self._scene, color=color)
        return self


class _Light:
    def __init__(self, handle):
        self._handle = handle

    def __repr__(self):
        return ""

    def set_position(self, x=0, y=0, z=0):
        _s3d_call("light_set_position", light=self._handle, x=x, y=y, z=z)
        return self

    def set_brightness(self, value):
        _s3d_call("light_set_brightness", light=self._handle, value=value)
        return self

    def set_color(self, color):
        _s3d_call("light_set_color", light=self._handle, color=color)
        return self

    def set_visible(self, visible):
        _s3d_call("light_set_visible", light=self._handle, visible=visible)
        return self

    def remove(self):
        _s3d_call("light_remove", light=self._handle)


class _Camera:
    def __init__(self, scene_handle):
        self._scene = scene_handle

    def __repr__(self):
        return ""

    def set_position(self, x=0, y=0, z=0):
        _s3d_call("camera_set_position", scene=self._scene, x=x, y=y, z=z)
        return self

    def move(self, dx=0, dy=0, dz=0):
        _s3d_call("camera_move", scene=self._scene, dx=dx, dy=dy, dz=dz)
        return self

    def look_at(self, target, y=None, z=None):
        if isinstance(target, (_Mesh, Group)):
            _s3d_call("camera_look_at", scene=self._scene, mesh=target._handle)
        else:
            _s3d_call("camera_look_at", scene=self._scene, x=target, y=y or 0, z=z or 0)
        return self

    def set_distance(self, r):
        _s3d_call("camera_set_distance", scene=self._scene, r=r)
        return self

    def follow(self, target, distance=None):
        if target is None:
            _s3d_call("camera_follow", scene=self._scene, mesh=None)
        else:
            kw = {"scene": self._scene, "mesh": target._handle}
            if distance is not None:
                kw["distance"] = distance
            _s3d_call("camera_follow", **kw)
        return self

    def reset(self):
        _s3d_call("camera_reset", scene=self._scene)
        return self


class Scene:
    def __init__(self):
        handle = _s3d_call("create_scene")
        self._handle = handle
        self._meshes = []
        self._click_handlers = {}
        self._collide_handlers = {}
        self._key_handlers = {}
        self._frame_handler = None
        self._frame_registered = False
        self.camera = _Camera(handle)
        self.ambient = _AmbientLight(handle)

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

    def _add_mesh(self, mesh, parent=None):
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
        kw = {"scene": self._handle, "config": config}
        if parent is not None:
            kw["parent"] = parent
        handle = _s3d_call("create_mesh", **kw)
        mesh._handle = handle
        self._meshes.append(mesh)
        if mesh._click_handler is not None:
            self._click_handlers[handle] = mesh._click_handler
            _s3d_call("register_click", scene=self._handle, mesh=handle)

    def add(self, obj):
        if isinstance(obj, Group):
            group_handle = _s3d_call("create_group", scene=self._handle,
                                     position=obj._position,
                                     rotation=obj._rotation,
                                     scale=obj._scale)
            obj._handle = group_handle
            for mesh in obj._children:
                self._add_mesh(mesh, parent=group_handle)
            return self
        self._add_mesh(obj)
        return self

    def add_light(self, x=0, y=5, z=0):
        handle = _s3d_call("light_add", scene=self._handle, x=x, y=y, z=z)
        return _Light(handle)

    def import_meshes(self, meshes):
        for m in meshes:
            if hasattr(m, "model_dump"):
                m = m.model_dump()

            mesh_type = m.get("type", "Box").lower()
            if mesh_type == "box":
                mesh = Shapes.Box(width=m.get("width", 1), height=m.get("height", 1), depth=m.get("depth", 1))
            elif mesh_type == "sphere":
                mesh = Shapes.Sphere(diameter=m.get("diameter", 1), segments=m.get("segments", 16))
            elif mesh_type == "cylinder":
                mesh = Shapes.Cylinder(diameter=m.get("diameter", 1), height=m.get("height", 1), tessellation=m.get("tessellation", 24))
            else:
                continue

            pos = m.get("position") or [0, 0, 0]
            mesh.set_position(pos[0], pos[1], pos[2])

            rot = m.get("rotation") or [0, 0, 0]
            mesh.set_rotation(rot[0], rot[1], rot[2])

            scale = m.get("scale") or [1, 1, 1]
            mesh.set_scale(scale[0], scale[1], scale[2])

            if m.get("color"):
                mesh.set_color(m["color"])

            if m.get("material"):
                resolved = _resolve_material(m["material"])
                if resolved:
                    mesh.set_material(resolved)

            self.add(mesh)
        return self

    def get_context(self, ctx_type='2d'):
        """Return a DOMProxy for the 2D overlay canvas.

        Use this to draw HUD elements (text, shapes) on top of the 3D scene.
        All standard Canvas2D methods work via the bridge, plus ctx.clear()
        to wipe the overlay between frames.
        """
        handle = _s3d_call("get_context", scene=self._handle)
        return DOMProxy(handle)

    def on_key(self, key, fn):
        self._key_handlers[key] = fn
        return self

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
        if self._key_handlers:
            _s3d_call("register_keys", scene=self._handle, keys=list(self._key_handlers.keys()))
        for mesh in self._meshes:
            for other, fn in mesh._collide_intents:
                if mesh._handle is not None and other._handle is not None:
                    key = (mesh._handle, other._handle)
                    if key not in self._collide_handlers:
                        self._collide_handlers[key] = fn
                        _s3d_call("register_collide", scene=self._handle, mesh=mesh._handle, other=other._handle)
            mesh._collide_intents = []
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
            elif result["type"] == "collide":
                handler = self._collide_handlers.get((result["mesh"], result["other"]))
                if handler is not None:
                    handler()
            elif result["type"] == "key":
                handler = self._key_handlers.get(result["key"])
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
        self._collide_intents = []  # list of (other_mesh, callback); registered at scene.run()
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

    def on_collide(self, other, fn):
        self._collide_intents.append((other, fn))
        return self


class Group:
    def __init__(self):
        self._children = []
        self._position = {"x": 0, "y": 0, "z": 0}
        self._rotation = {"x": 0, "y": 0, "z": 0}
        self._scale = {"x": 1, "y": 1, "z": 1}
        self._handle = None

    def __repr__(self):
        return ""

    def add(self, mesh):
        self._children.append(mesh)
        return self

    def set_position(self, x=0, y=0, z=0):
        self._position = {"x": x, "y": y, "z": z}
        if self._handle is not None:
            _s3d_call("set_position", mesh=self._handle, x=x, y=y, z=z)
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

    def get_position(self):
        return (self._position["x"], self._position["y"], self._position["z"])

    def get_rotation(self):
        return (self._rotation["x"], self._rotation["y"], self._rotation["z"])

    def get_scale(self):
        return (self._scale["x"], self._scale["y"], self._scale["z"])


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
_scene3d_mod.Group = Group
_scene3d_mod.Sky = Sky
_scene3d_mod.Key = Key
_scene3d_mod.Material = Material
sys.modules["scene3d"] = _scene3d_mod
