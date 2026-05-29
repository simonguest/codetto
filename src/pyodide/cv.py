# type: ignore
import sys
import types
import json


class Canvas:
    def __init__(self, width=400, height=300):
        self.width = width
        self.height = height
        self._commands = []

    def clear(self, color="#ffffff"):
        self._commands.append({"op": "clear", "color": color})
        return self

    def set_text(self, text, x, y, color="#000000", size=16):
        self._commands.append({
            "op": "text", "text": str(text),
            "x": x, "y": y, "color": color, "size": size,
        })
        return self

    def draw_rect(self, x, y, w, h, color="#0000ff", fill=True):
        self._commands.append({
            "op": "rect", "x": x, "y": y, "w": w, "h": h,
            "color": color, "fill": fill,
        })
        return self

    def draw_circle(self, cx, cy, r, color="#ff0000", fill=True):
        self._commands.append({
            "op": "circle", "cx": cx, "cy": cy, "r": r,
            "color": color, "fill": fill,
        })
        return self

    def draw_line(self, x1, y1, x2, y2, color="#000000", width=1):
        self._commands.append({
            "op": "line", "x1": x1, "y1": y1, "x2": x2, "y2": y2,
            "color": color, "width": width,
        })
        return self


def display(canvas):
    payload = json.dumps({
        "width": canvas.width,
        "height": canvas.height,
        "commands": canvas._commands,
    })
    _cv_display(payload)  # type: ignore


_cv_mod = types.ModuleType("cv")
_cv_mod.Canvas = Canvas
_cv_mod.display = display
sys.modules["cv"] = _cv_mod
