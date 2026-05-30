# type:ignore
import builtins
import sys
import types
import base64

def _override_input_wrapper(prompt=''):
    return _override_input(prompt)

sys.stdout = _override_stdout
builtins.input = _override_input_wrapper

# Override IPython display() so students can use:
#   from IPython.display import display
#   display(pil_image)
def _display_func(*objs, **kwargs):
    for obj in objs:
        if hasattr(obj, '_repr_png_'):
            data = obj._repr_png_()
            if isinstance(data, bytes):
                data = base64.b64encode(data).decode('utf-8')
            js.imageBase64(data)  # type: ignore
        elif hasattr(obj, '_repr_svg_'):
            svg = obj._repr_svg_()
            if isinstance(svg, bytes):
                svg = svg.decode('utf-8')
            js.imageSvg(svg)  # type: ignore
        elif hasattr(obj, '_repr_html_'):
            html = obj._repr_html_()
            if isinstance(html, bytes):
                html = html.decode('utf-8')
            js.displayHtml(html)  # type: ignore

# Inject our stub so `from IPython.display import display` gets our version.
# setdefault() means we don't clobber a real IPython installation if present.
_ipython_display_mod = types.ModuleType('IPython.display')
_ipython_display_mod.display = _display_func
_ipython_mock = types.ModuleType('IPython')
_ipython_mock.display = _ipython_display_mod
_ipython_mock.get_ipython = lambda: None
sys.modules.setdefault('IPython', _ipython_mock)
sys.modules.setdefault('IPython.display', _ipython_display_mod)
# Also patch in case IPython was already loaded before this runs
if 'IPython.display' in sys.modules:
    sys.modules['IPython.display'].display = _display_func

# Patch time.sleep to check for interrupts in small chunks, working around
# https://github.com/pyodide/pyodide/issues/5927 (Chrome ignores interrupts
# during a native sleep call).
import time as _time
_real_sleep = _time.sleep

def _patched_sleep(secs):
    if _interrupt_buffer is None:  # type: ignore[name-defined]  # noqa: F821
        _real_sleep(secs)
        return
    from js import Atomics
    remaining_ms = float(secs) * 1000
    chunk_ms = 50.0
    while remaining_ms > 0:
        # Atomics.wait blocks while buffer[0]==0, waking early if interrupted
        Atomics.wait(_interrupt_buffer, 0, 0, min(chunk_ms, remaining_ms))  # type: ignore[name-defined]  # noqa: F821
        if _interrupt_buffer[0] != 0:  # type: ignore[name-defined]  # noqa: F821
            _interrupt_buffer[0] = 0  # type: ignore[name-defined]  # noqa: F821
            raise KeyboardInterrupt()
        remaining_ms -= chunk_ms

_time.sleep = _patched_sleep
