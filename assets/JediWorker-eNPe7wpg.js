let I;const V=`
import jedi
import json

def _get_docstring(c):
    try:
        doc = c.docstring(raw=True)
        if not doc:
            return ''
        first_para = doc.split('\\n\\n')[0].strip()
        return ' '.join(first_para.split())[:200]
    except Exception:
        return ''

def _get_completions(source, line, column):
    try:
        script = jedi.Script(source)
        completions = script.complete(line, column)
        return json.dumps([
            {
                'name': c.name,
                'type': c.type,
                'prefixLen': len(c.name) - len(c.complete),
                'docstring': _get_docstring(c),
            }
            for c in completions
        ])
    except Exception:
        return '[]'
`;async function c(){{const{loadPyodide:i}=await import(new URL("../pyodide/pyodide.mjs",import.meta.url).toString());I=await i()}await I.loadPackage(["jedi","parso"]);const t=await(await fetch(new URL("data:application/octet-stream;base64,ZnJvbSBncmFwaGljcyBpbXBvcnQgQ2FudmFzCgpjbGFzcyBDYW1lcmE6CiAgICBkZWYgc3RvcChzZWxmKSAtPiBOb25lOiAuLi4KCmNsYXNzIERldGVjdG9yOgogICAgZGVmIGdldF9kZXRlY3Rpb25zKHNlbGYpIC0+IGxpc3Q6IC4uLgogICAgZGVmIHN0b3Aoc2VsZikgLT4gTm9uZTogLi4uCgpjbGFzcyBfUG9zZUxhbmRtYXJrczoKICAgIE5PU0U6IGludAogICAgTEVGVF9FWUVfSU5ORVI6IGludAogICAgTEVGVF9FWUU6IGludAogICAgTEVGVF9FWUVfT1VURVI6IGludAogICAgUklHSFRfRVlFX0lOTkVSOiBpbnQKICAgIFJJR0hUX0VZRTogaW50CiAgICBSSUdIVF9FWUVfT1VURVI6IGludAogICAgTEVGVF9FQVI6IGludAogICAgUklHSFRfRUFSOiBpbnQKICAgIE1PVVRIX0xFRlQ6IGludAogICAgTU9VVEhfUklHSFQ6IGludAogICAgTEVGVF9TSE9VTERFUjogaW50CiAgICBSSUdIVF9TSE9VTERFUjogaW50CiAgICBMRUZUX0VMQk9XOiBpbnQKICAgIFJJR0hUX0VMQk9XOiBpbnQKICAgIExFRlRfV1JJU1Q6IGludAogICAgUklHSFRfV1JJU1Q6IGludAogICAgTEVGVF9QSU5LWTogaW50CiAgICBSSUdIVF9QSU5LWTogaW50CiAgICBMRUZUX0lOREVYOiBpbnQKICAgIFJJR0hUX0lOREVYOiBpbnQKICAgIExFRlRfVEhVTUI6IGludAogICAgUklHSFRfVEhVTUI6IGludAogICAgTEVGVF9ISVA6IGludAogICAgUklHSFRfSElQOiBpbnQKICAgIExFRlRfS05FRTogaW50CiAgICBSSUdIVF9LTkVFOiBpbnQKICAgIExFRlRfQU5LTEU6IGludAogICAgUklHSFRfQU5LTEU6IGludAogICAgTEVGVF9IRUVMOiBpbnQKICAgIFJJR0hUX0hFRUw6IGludAogICAgTEVGVF9GT09UX0lOREVYOiBpbnQKICAgIFJJR0hUX0ZPT1RfSU5ERVg6IGludAoKUE9TRTogX1Bvc2VMYW5kbWFya3MKCmNsYXNzIF9IYW5kTGFuZG1hcmtzOgogICAgV1JJU1Q6IGludAogICAgVEhVTUJfQ01DOiBpbnQKICAgIFRIVU1CX01DUDogaW50CiAgICBUSFVNQl9JUDogaW50CiAgICBUSFVNQl9USVA6IGludAogICAgSU5ERVhfRklOR0VSX01DUDogaW50CiAgICBJTkRFWF9GSU5HRVJfUElQOiBpbnQKICAgIElOREVYX0ZJTkdFUl9ESVA6IGludAogICAgSU5ERVhfRklOR0VSX1RJUDogaW50CiAgICBNSURETEVfRklOR0VSX01DUDogaW50CiAgICBNSURETEVfRklOR0VSX1BJUDogaW50CiAgICBNSURETEVfRklOR0VSX0RJUDogaW50CiAgICBNSURETEVfRklOR0VSX1RJUDogaW50CiAgICBSSU5HX0ZJTkdFUl9NQ1A6IGludAogICAgUklOR19GSU5HRVJfUElQOiBpbnQKICAgIFJJTkdfRklOR0VSX0RJUDogaW50CiAgICBSSU5HX0ZJTkdFUl9USVA6IGludAogICAgUElOS1lfTUNQOiBpbnQKICAgIFBJTktZX1BJUDogaW50CiAgICBQSU5LWV9ESVA6IGludAogICAgUElOS1lfVElQOiBpbnQKCkhBTkQ6IF9IYW5kTGFuZG1hcmtzCgpjbGFzcyBfU2VnbWVudENsYXNzZXM6CiAgICBCQUNLR1JPVU5EOiBzdHIKICAgIEhBSVI6IHN0cgogICAgQk9EWV9TS0lOOiBzdHIKICAgIEZBQ0VfU0tJTjogc3RyCiAgICBDTE9USEVTOiBzdHIKICAgIE9USEVSUzogc3RyCgpTRUdNRU5UOiBfU2VnbWVudENsYXNzZXMKCmNsYXNzIFNlZ21lbnRlcjoKICAgIGRlZiBnZXRfc2VnbWVudHMoc2VsZikgLT4gbGlzdFtzdHJdOiAuLi4KICAgIGRlZiBzdG9wKHNlbGYpIC0+IE5vbmU6IC4uLgoKZGVmIHN0YXJ0X2NhbWVyYShjYW52YXM6IENhbnZhcyB8IE5vbmUgPSBOb25lKSAtPiBDYW1lcmE6IC4uLgpkZWYgc3RhcnRfZmFjZV9kZXRlY3RvcihjYW1lcmE6IENhbWVyYSwgZGVsZWdhdGU6IHN0ciA9ICJHUFUiKSAtPiBEZXRlY3RvcjogLi4uCmRlZiBzdGFydF9vYmplY3RfZGV0ZWN0b3IoY2FtZXJhOiBDYW1lcmEsIGRlbGVnYXRlOiBzdHIgPSAiR1BVIikgLT4gRGV0ZWN0b3I6IC4uLgpkZWYgc3RhcnRfcG9zZV9kZXRlY3RvcihjYW1lcmE6IENhbWVyYSwgZGVsZWdhdGU6IHN0ciA9ICJHUFUiLCBudW1fcG9zZXM6IGludCA9IDEpIC0+IERldGVjdG9yOiAuLi4KZGVmIHN0YXJ0X2dlc3R1cmVfZGV0ZWN0b3IoY2FtZXJhOiBDYW1lcmEsIGRlbGVnYXRlOiBzdHIgPSAiR1BVIiwgbnVtX2hhbmRzOiBpbnQgPSAyKSAtPiBEZXRlY3RvcjogLi4uCmRlZiBzdGFydF9zZWdtZW50ZXIoY2FtZXJhOiBDYW1lcmEsIGRlbGVnYXRlOiBzdHIgPSAiR1BVIikgLT4gU2VnbWVudGVyOiAuLi4KZGVmIGNvbG9yX3NlZ21lbnQoY2FudmFzOiBDYW52YXMsIHNlZ21lbnRlcjogU2VnbWVudGVyLCBjbGFzc19uYW1lOiBzdHIsIGNvbG9yOiBzdHIsIG9wYWNpdHk6IGZsb2F0ID0gMC41KSAtPiBOb25lOiAuLi4KZGVmIGFwcGx5X2ltYWdlX3RvX3NlZ21lbnQoY2FudmFzOiBDYW52YXMsIHNlZ21lbnRlcjogU2VnbWVudGVyLCBjbGFzc19uYW1lOiBzdHIsIGltYWdlX3BhdGg6IHN0ciwgb3BhY2l0eTogZmxvYXQgPSAwLjgpIC0+IE5vbmU6IC4uLgo=",import.meta.url))).text();I.FS.mkdirTree("/stubs"),I.FS.writeFile("/stubs/cv.pyi",t),await I.runPythonAsync(`import sys
if '/stubs' not in sys.path: sys.path.insert(0, '/stubs')`),await I.runPythonAsync(V)}let e=Promise.resolve();function o(l){e=e.then(l).catch(()=>{})}self.onmessage=l=>{const{type:t,...i}=l.data;switch(t){case"initialize":o(async()=>{try{await c(),self.postMessage({type:"initialized"})}catch(g){console.error("JediWorker: Initialization failed:",g),self.postMessage({type:"error",error:String(g)})}});break;case"sync_packages":o(async()=>{try{I&&i.code&&await I.loadPackagesFromImports(i.code)}catch(g){console.warn("JediWorker: Failed to sync packages:",g)}});break;case"complete":o(async()=>{if(!I){self.postMessage({type:"completions",requestId:i.requestId,completions:[]});return}let g="[]";try{g=await I.runPythonAsync(`_get_completions(${JSON.stringify(i.script)}, ${i.line}, ${i.column})`)}catch{}self.postMessage({type:"completions",requestId:i.requestId,completions:JSON.parse(g)})}),o(async()=>{try{I&&await I.loadPackagesFromImports(i.script)}catch{}});break}};
