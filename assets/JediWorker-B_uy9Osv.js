let t;const c=`
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
`;async function n(){{const{loadPyodide:e}=await import(new URL("../pyodide/pyodide.mjs",import.meta.url).toString());t=await e()}await t.loadPackage(["jedi","parso"]);const I=await(await fetch(new URL("data:application/octet-stream;base64,ZnJvbSBncmFwaGljcyBpbXBvcnQgQ2FudmFzCgpjbGFzcyBDYW1lcmE6CiAgICBkZWYgc3RvcChzZWxmKSAtPiBOb25lOiAuLi4KCmNsYXNzIERldGVjdG9yOgogICAgZGVmIGdldF9kZXRlY3Rpb25zKHNlbGYpIC0+IGxpc3Q6IC4uLgogICAgZGVmIHN0b3Aoc2VsZikgLT4gTm9uZTogLi4uCgpjbGFzcyBfUG9zZUxhbmRtYXJrczoKICAgIE5PU0U6IGludAogICAgTEVGVF9FWUVfSU5ORVI6IGludAogICAgTEVGVF9FWUU6IGludAogICAgTEVGVF9FWUVfT1VURVI6IGludAogICAgUklHSFRfRVlFX0lOTkVSOiBpbnQKICAgIFJJR0hUX0VZRTogaW50CiAgICBSSUdIVF9FWUVfT1VURVI6IGludAogICAgTEVGVF9FQVI6IGludAogICAgUklHSFRfRUFSOiBpbnQKICAgIE1PVVRIX0xFRlQ6IGludAogICAgTU9VVEhfUklHSFQ6IGludAogICAgTEVGVF9TSE9VTERFUjogaW50CiAgICBSSUdIVF9TSE9VTERFUjogaW50CiAgICBMRUZUX0VMQk9XOiBpbnQKICAgIFJJR0hUX0VMQk9XOiBpbnQKICAgIExFRlRfV1JJU1Q6IGludAogICAgUklHSFRfV1JJU1Q6IGludAogICAgTEVGVF9QSU5LWTogaW50CiAgICBSSUdIVF9QSU5LWTogaW50CiAgICBMRUZUX0lOREVYOiBpbnQKICAgIFJJR0hUX0lOREVYOiBpbnQKICAgIExFRlRfVEhVTUI6IGludAogICAgUklHSFRfVEhVTUI6IGludAogICAgTEVGVF9ISVA6IGludAogICAgUklHSFRfSElQOiBpbnQKICAgIExFRlRfS05FRTogaW50CiAgICBSSUdIVF9LTkVFOiBpbnQKICAgIExFRlRfQU5LTEU6IGludAogICAgUklHSFRfQU5LTEU6IGludAogICAgTEVGVF9IRUVMOiBpbnQKICAgIFJJR0hUX0hFRUw6IGludAogICAgTEVGVF9GT09UX0lOREVYOiBpbnQKICAgIFJJR0hUX0ZPT1RfSU5ERVg6IGludAoKUE9TRTogX1Bvc2VMYW5kbWFya3MKCmRlZiBzdGFydF9jYW1lcmEoY2FudmFzOiBDYW52YXMgfCBOb25lID0gTm9uZSkgLT4gQ2FtZXJhOiAuLi4KZGVmIHN0YXJ0X2ZhY2VfZGV0ZWN0b3IoY2FtZXJhOiBDYW1lcmEpIC0+IERldGVjdG9yOiAuLi4KZGVmIHN0YXJ0X29iamVjdF9kZXRlY3RvcihjYW1lcmE6IENhbWVyYSwgZGVsZWdhdGU6IHN0ciA9ICJDUFUiKSAtPiBEZXRlY3RvcjogLi4uCmRlZiBzdGFydF9wb3NlX2RldGVjdG9yKGNhbWVyYTogQ2FtZXJhLCBkZWxlZ2F0ZTogc3RyID0gIkNQVSIsIG51bV9wb3NlczogaW50ID0gMSkgLT4gRGV0ZWN0b3I6IC4uLgo=",import.meta.url))).text();t.FS.mkdirTree("/stubs"),t.FS.writeFile("/stubs/cv.pyi",I),await t.runPythonAsync(`import sys
if '/stubs' not in sys.path: sys.path.insert(0, '/stubs')`),await t.runPythonAsync(c)}let g=Promise.resolve();function s(i){g=g.then(i).catch(()=>{})}self.onmessage=i=>{const{type:I,...e}=i.data;switch(I){case"initialize":s(async()=>{try{await n(),self.postMessage({type:"initialized"})}catch(o){console.error("JediWorker: Initialization failed:",o),self.postMessage({type:"error",error:String(o)})}});break;case"sync_packages":s(async()=>{try{t&&e.code&&await t.loadPackagesFromImports(e.code)}catch(o){console.warn("JediWorker: Failed to sync packages:",o)}});break;case"complete":s(async()=>{if(!t){self.postMessage({type:"completions",requestId:e.requestId,completions:[]});return}let o="[]";try{o=await t.runPythonAsync(`_get_completions(${JSON.stringify(e.script)}, ${e.line}, ${e.column})`)}catch{}self.postMessage({type:"completions",requestId:e.requestId,completions:JSON.parse(o)})}),s(async()=>{try{t&&await t.loadPackagesFromImports(e.script)}catch{}});break}};
