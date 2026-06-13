from typing import Any, Callable, Sequence

class _MatBricks:
    DarkClay: str
    RoughStone: str

class _MatCarpet:
    BlueCheckerboard: str
    BeigePattern: str

class _MatChip:
    CircuitGreen: str
    CircuitRed: str
    CircuitOrange: str
    CircuitBlue: str

class _MatFabric:
    BurgundyRibbed: str
    BlueQuilted: str
    BlackTartan: str
    RedBlueCheck: str
    Denim: str

class _MatGrass:
    Bright: str
    Dark: str
    Olive: str

class _MatGravel:
    LightGray: str
    DarkGray: str

class _MatMarble:
    Brown: str
    Gray: str
    Black: str
    Charcoal: str

class _MatPlanets:
    Earth: str
    Jupiter: str
    Mars: str
    Mercury: str
    Moon: str
    Neptune: str
    Saturn: str
    Uranus: str
    Venus: str

class _MatRoad:
    PatchedAsphalt: str
    AsphaltEdges: str
    Highway: str

class _MatRoofingTiles:
    DarkSlate: str

class _MatSnow:
    Fresh: str

class _MatSports:
    Soccerball: str
    Tennis: str

class _MatTiles:
    LimeGreen: str
    GreenMosaic: str
    WoodHexagon: str
    Checkerboard: str

class _MatWood:
    Oak: str

class _MatWoodFloor:
    PinePlanks: str

class _Material:
    Bricks: _MatBricks
    Carpet: _MatCarpet
    Chip: _MatChip
    Fabric: _MatFabric
    Grass: _MatGrass
    Gravel: _MatGravel
    Marble: _MatMarble
    Planets: _MatPlanets
    Road: _MatRoad
    RoofingTiles: _MatRoofingTiles
    Snow: _MatSnow
    Sports: _MatSports
    Tiles: _MatTiles
    Wood: _MatWood
    WoodFloor: _MatWoodFloor

class Key:
    LEFT: str
    RIGHT: str
    UP: str
    DOWN: str
    SPACE: str
    ENTER: str
    ESCAPE: str

class Sky:
    CLOUDS: str
    DEEP_SPACE: str
    MODERN_BUILDINGS: str
    ORLANDO_STADIUM: str
    PURE_SKY: str

class DOMProxy:
    def __getattr__(self, name: str) -> Any: ...
    def __setattr__(self, name: str, value: Any) -> None: ...

class Mesh:
    def set_position(self, x: float = 0, y: float = 0, z: float = 0) -> "Mesh": ...
    def set_rotation(self, x: float = 0, y: float = 0, z: float = 0) -> "Mesh": ...
    def set_color(self, color: str) -> "Mesh": ...
    def set_texture(self, source: str) -> "Mesh": ...
    def set_material(self, material: str) -> "Mesh":
        """Apply a PBR material or simple texture (e.g. scene3d.Material.Bricks.DarkClay or scene3d.Material.Planets.Earth)."""
        ...
    def set_glossiness(self, value: float) -> "Mesh":
        """Set surface glossiness for PBR materials: 0.0 = completely matte, 1.0 = mirror-like. Has no effect on plain colour or texture meshes."""
        ...
    def set_tiling(self, u: float, v: float = ...) -> "Mesh":
        """Set how many times the texture repeats across the mesh. u = horizontal repeats, v = vertical (defaults to u). Persists across set_material calls."""
        ...
    def set_scale(self, x: float = 1, y: float = 1, z: float = 1) -> "Mesh": ...
    def get_position(self) -> tuple[float, float, float]: ...
    def get_rotation(self) -> tuple[float, float, float]: ...
    def get_scale(self) -> tuple[float, float, float]: ...
    def get_color(self) -> str: ...
    def on_click(self, fn: Callable[[], None]) -> "Mesh": ...
    def on_collide(self, other: "Mesh", fn: Callable[[], None]) -> "Mesh":
        """Register a callback invoked when this mesh first intersects another. Call before scene.run()."""
        ...

class Group:
    def add(self, mesh: Mesh) -> "Group": ...
    def set_position(self, x: float = 0, y: float = 0, z: float = 0) -> "Group": ...
    def set_rotation(self, x: float = 0, y: float = 0, z: float = 0) -> "Group": ...
    def set_scale(self, x: float = 1, y: float = 1, z: float = 1) -> "Group": ...
    def get_position(self) -> tuple[float, float, float]: ...
    def get_rotation(self) -> tuple[float, float, float]: ...
    def get_scale(self) -> tuple[float, float, float]: ...

class AmbientLight:
    def set_brightness(self, value: float) -> "AmbientLight":
        """Set world light brightness 0–100 (default 90). 0 = pitch black, 100 = fully lit."""
        ...
    def set_color(self, color: str) -> "AmbientLight": ...

class Light:
    def set_position(self, x: float = 0, y: float = 0, z: float = 0) -> "Light": ...
    def set_brightness(self, value: float) -> "Light":
        """Set point light brightness 0–100 (default 100). Maps to 0–20 internally."""
        ...
    def set_color(self, color: str) -> "Light": ...
    def set_visible(self, visible: bool) -> "Light":
        """Show (True) or hide (False) the indicator sphere at this light's position."""
        ...
    def remove(self) -> None: ...

class Camera:
    def set_position(self, x: float = 0, y: float = 0, z: float = 0) -> "Camera": ...
    def move(self, dx: float = 0, dy: float = 0, dz: float = 0) -> "Camera": ...
    def look_at(self, target: "Mesh | Group | float", y: float = 0, z: float = 0) -> "Camera":
        """Point the camera at a mesh (look_at(mesh)) or world coordinates (look_at(x, y, z))."""
        ...
    def set_distance(self, r: float) -> "Camera":
        """Set camera zoom distance from its target."""
        ...
    def follow(self, target: "Mesh | Group | None", distance: float = ...) -> "Camera":
        """Continuously track a mesh each frame. Pass None to stop following."""
        ...
    def reset(self) -> "Camera":
        """Return the camera to its default position and orientation."""
        ...

class Scene:
    camera: Camera
    ambient: AmbientLight
    def set_sky(self, color: str = "#87CEEB") -> "Scene":
        """Set the sky to a hex colour (e.g. "#87CEEB") or an environment map (e.g. scene3d.Sky.CLOUDS)."""
        ...
    def set_ground(self, length: float = 10, width: float = 10) -> Mesh: ...
    def add(self, obj: "Mesh | Group") -> "Scene": ...
    def import_meshes(self, meshes: Sequence[Any]) -> "Scene":
        """Create and add meshes from a list of descriptors (dicts or Pydantic model instances).

        Each descriptor may have: type ("Box"|"Sphere"|"Cylinder"), position [x,y,z],
        rotation [x,y,z], scale [x,y,z], color (hex), material ("Category.Name"),
        and shape params (width/height/depth for Box; diameter/segments for Sphere;
        diameter/height/tessellation for Cylinder).
        """
        ...
    def add_light(self, x: float = 0, y: float = 5, z: float = 0) -> Light: ...
    def get_context(self, ctx_type: str = "2d") -> DOMProxy: ...
    def on_key(self, key: str, fn: Callable[[], None]) -> "Scene":
        """Register a callback for a key press. Use Key constants (e.g. scene3d.Key.LEFT) for special keys, or plain strings for letters ('w', 'a', 's', 'd'). Camera arrow-key bindings are removed automatically when any on_key is registered."""
        ...
    def on_frame(self, fn: Callable[[float], None]) -> Callable[[float], None]: ...
    def run(self) -> None: ...

class _Shapes:
    @staticmethod
    def Box(width: float = 1, height: float = 1, depth: float = 1) -> Mesh: ...
    @staticmethod
    def Sphere(diameter: float = 1, segments: int = 16) -> Mesh: ...
    @staticmethod
    def Cylinder(diameter: float = 1, height: float = 1, tessellation: int = 24) -> Mesh: ...

Shapes: _Shapes
Material: _Material
