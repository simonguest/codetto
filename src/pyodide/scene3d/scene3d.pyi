from typing import Any, Callable

class _MatBricks:
    Bricks057: str
    Bricks075A: str

class _MatCarpet:
    Carpet006: str
    Carpet008: str

class _MatChip:
    Chip001: str
    Chip002: str
    Chip004: str
    Chip005: str

class _MatFabric:
    Fabric026: str
    Fabric046: str
    Fabric051: str
    Fabric057: str
    Fabric069: str

class _MatGrass:
    Grass001: str
    Grass002: str
    Grass003: str

class _MatGravel:
    Gravel026: str
    Gravel035: str

class _MatMarble:
    Marble008: str
    Marble012: str
    Marble017: str
    Marble023: str

class _MatPlanets:
    Earth: str
    Jupiter: str
    Mars: str
    Mercury: str
    Neptune: str
    Saturn: str
    Uranus: str
    Venus: str

class _MatRoad:
    Road003: str
    Road006: str
    Road007: str

class _MatRoofingTiles:
    RoofingTiles003: str

class _MatSnow:
    Snow004: str

class _MatSports:
    Soccerball: str
    Tennis: str

class _MatTiles:
    Tiles033: str
    Tiles053: str
    Tiles065: str
    Tiles074: str

class _MatWood:
    Wood048: str

class _MatWoodFloor:
    WoodFloor042: str

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
        """Apply a PBR material or simple texture (e.g. scene3d.Material.Bricks.Bricks057 or scene3d.Material.Planets.Earth)."""
        ...
    def set_scale(self, x: float = 1, y: float = 1, z: float = 1) -> "Mesh": ...
    def on_click(self, fn: Callable[[], None]) -> "Mesh": ...

class Scene:
    def set_sky(self, color: str = "#87CEEB") -> "Scene":
        """Set the sky to a hex colour (e.g. "#87CEEB") or an environment map (e.g. scene3d.Sky.CLOUDS)."""
        ...
    def set_ground(self, length: float = 10, width: float = 10) -> "Scene": ...
    def add(self, mesh: Mesh) -> "Scene": ...
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
