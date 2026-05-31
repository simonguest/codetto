let i;const n=`
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
`;async function c(){{const{loadPyodide:I}=await import(new URL("../pyodide/pyodide.mjs",import.meta.url).toString());i=await I()}await i.loadPackage(["jedi","parso"]);const e=await(await fetch(new URL("data:application/octet-stream;base64,ZnJvbSBncmFwaGljcyBpbXBvcnQgQ2FudmFzCgpjbGFzcyBDYW1lcmE6CiAgICBkZWYgc3RvcChzZWxmKSAtPiBOb25lOiAuLi4KCmNsYXNzIERldGVjdG9yOgogICAgZGVmIGdldF9kZXRlY3Rpb25zKHNlbGYpIC0+IGxpc3Q6IC4uLgogICAgZGVmIHN0b3Aoc2VsZikgLT4gTm9uZTogLi4uCgpjbGFzcyBfUG9zZUxhbmRtYXJrczoKICAgIE5PU0U6IGludAogICAgTEVGVF9FWUVfSU5ORVI6IGludAogICAgTEVGVF9FWUU6IGludAogICAgTEVGVF9FWUVfT1VURVI6IGludAogICAgUklHSFRfRVlFX0lOTkVSOiBpbnQKICAgIFJJR0hUX0VZRTogaW50CiAgICBSSUdIVF9FWUVfT1VURVI6IGludAogICAgTEVGVF9FQVI6IGludAogICAgUklHSFRfRUFSOiBpbnQKICAgIE1PVVRIX0xFRlQ6IGludAogICAgTU9VVEhfUklHSFQ6IGludAogICAgTEVGVF9TSE9VTERFUjogaW50CiAgICBSSUdIVF9TSE9VTERFUjogaW50CiAgICBMRUZUX0VMQk9XOiBpbnQKICAgIFJJR0hUX0VMQk9XOiBpbnQKICAgIExFRlRfV1JJU1Q6IGludAogICAgUklHSFRfV1JJU1Q6IGludAogICAgTEVGVF9QSU5LWTogaW50CiAgICBSSUdIVF9QSU5LWTogaW50CiAgICBMRUZUX0lOREVYOiBpbnQKICAgIFJJR0hUX0lOREVYOiBpbnQKICAgIExFRlRfVEhVTUI6IGludAogICAgUklHSFRfVEhVTUI6IGludAogICAgTEVGVF9ISVA6IGludAogICAgUklHSFRfSElQOiBpbnQKICAgIExFRlRfS05FRTogaW50CiAgICBSSUdIVF9LTkVFOiBpbnQKICAgIExFRlRfQU5LTEU6IGludAogICAgUklHSFRfQU5LTEU6IGludAogICAgTEVGVF9IRUVMOiBpbnQKICAgIFJJR0hUX0hFRUw6IGludAogICAgTEVGVF9GT09UX0lOREVYOiBpbnQKICAgIFJJR0hUX0ZPT1RfSU5ERVg6IGludAoKUE9TRTogX1Bvc2VMYW5kbWFya3MKCmNsYXNzIF9IYW5kTGFuZG1hcmtzOgogICAgV1JJU1Q6IGludAogICAgVEhVTUJfQ01DOiBpbnQKICAgIFRIVU1CX01DUDogaW50CiAgICBUSFVNQl9JUDogaW50CiAgICBUSFVNQl9USVA6IGludAogICAgSU5ERVhfRklOR0VSX01DUDogaW50CiAgICBJTkRFWF9GSU5HRVJfUElQOiBpbnQKICAgIElOREVYX0ZJTkdFUl9ESVA6IGludAogICAgSU5ERVhfRklOR0VSX1RJUDogaW50CiAgICBNSURETEVfRklOR0VSX01DUDogaW50CiAgICBNSURETEVfRklOR0VSX1BJUDogaW50CiAgICBNSURETEVfRklOR0VSX0RJUDogaW50CiAgICBNSURETEVfRklOR0VSX1RJUDogaW50CiAgICBSSU5HX0ZJTkdFUl9NQ1A6IGludAogICAgUklOR19GSU5HRVJfUElQOiBpbnQKICAgIFJJTkdfRklOR0VSX0RJUDogaW50CiAgICBSSU5HX0ZJTkdFUl9USVA6IGludAogICAgUElOS1lfTUNQOiBpbnQKICAgIFBJTktZX1BJUDogaW50CiAgICBQSU5LWV9ESVA6IGludAogICAgUElOS1lfVElQOiBpbnQKCkhBTkQ6IF9IYW5kTGFuZG1hcmtzCgpkZWYgc3RhcnRfY2FtZXJhKGNhbnZhczogQ2FudmFzIHwgTm9uZSA9IE5vbmUpIC0+IENhbWVyYTogLi4uCmRlZiBzdGFydF9mYWNlX2RldGVjdG9yKGNhbWVyYTogQ2FtZXJhKSAtPiBEZXRlY3RvcjogLi4uCmRlZiBzdGFydF9vYmplY3RfZGV0ZWN0b3IoY2FtZXJhOiBDYW1lcmEsIGRlbGVnYXRlOiBzdHIgPSAiQ1BVIikgLT4gRGV0ZWN0b3I6IC4uLgpkZWYgc3RhcnRfcG9zZV9kZXRlY3RvcihjYW1lcmE6IENhbWVyYSwgZGVsZWdhdGU6IHN0ciA9ICJDUFUiLCBudW1fcG9zZXM6IGludCA9IDEpIC0+IERldGVjdG9yOiAuLi4KZGVmIHN0YXJ0X2dlc3R1cmVfZGV0ZWN0b3IoY2FtZXJhOiBDYW1lcmEsIGRlbGVnYXRlOiBzdHIgPSAiQ1BVIiwgbnVtX2hhbmRzOiBpbnQgPSAyKSAtPiBEZXRlY3RvcjogLi4uCg==",import.meta.url))).text();i.FS.mkdirTree("/stubs"),i.FS.writeFile("/stubs/cv.pyi",e),await i.runPythonAsync(`import sys
if '/stubs' not in sys.path: sys.path.insert(0, '/stubs')`),await i.runPythonAsync(n)}let l=Promise.resolve();function t(g){l=l.then(g).catch(()=>{})}self.onmessage=g=>{const{type:e,...I}=g.data;switch(e){case"initialize":t(async()=>{try{await c(),self.postMessage({type:"initialized"})}catch(o){console.error("JediWorker: Initialization failed:",o),self.postMessage({type:"error",error:String(o)})}});break;case"sync_packages":t(async()=>{try{i&&I.code&&await i.loadPackagesFromImports(I.code)}catch(o){console.warn("JediWorker: Failed to sync packages:",o)}});break;case"complete":t(async()=>{if(!i){self.postMessage({type:"completions",requestId:I.requestId,completions:[]});return}let o="[]";try{o=await i.runPythonAsync(`_get_completions(${JSON.stringify(I.script)}, ${I.line}, ${I.column})`)}catch{}self.postMessage({type:"completions",requestId:I.requestId,completions:JSON.parse(o)})}),t(async()=>{try{i&&await i.loadPackagesFromImports(I.script)}catch{}});break}};
