from typing import Any, Callable

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

class Group:
    def add(self, mesh: Mesh) -> "Group": ...
    def set_position(self, x: float = 0, y: float = 0, z: float = 0) -> "Group": ...
    def set_rotation(self, x: float = 0, y: float = 0, z: float = 0) -> "Group": ...
    def set_scale(self, x: float = 1, y: float = 1, z: float = 1) -> "Group": ...
    def get_position(self) -> tuple[float, float, float]: ...
    def get_rotation(self) -> tuple[float, float, float]: ...
    def get_scale(self) -> tuple[float, float, float]: ...

class Scene:
    def set_sky(self, color: str = "#87CEEB") -> "Scene":
        """Set the sky to a hex colour (e.g. "#87CEEB") or an environment map (e.g. scene3d.Sky.CLOUDS)."""
        ...
    def set_ground(self, length: float = 10, width: float = 10) -> Mesh: ...
    def add(self, obj: "Mesh | Group") -> "Scene": ...
    def get_context(self, ctx_type: str = "2d") -> DOMProxy: ...
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
