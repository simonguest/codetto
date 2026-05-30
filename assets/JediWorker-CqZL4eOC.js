let t;const n=`
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
`;async function r(){{const{loadPyodide:e}=await import(new URL("../pyodide/pyodide.mjs",import.meta.url).toString());t=await e()}await t.loadPackage(["jedi","parso"]);const c=await(await fetch(new URL("data:application/octet-stream;base64,Y2xhc3MgQ2FudmFzOgogICAgZGVmIGRyYXdfYm91bmRpbmdfYm94ZXMoc2VsZiwgZGV0ZWN0aW9uczogbGlzdCkgLT4gTm9uZTogLi4uCgpjbGFzcyBDYW1lcmE6CiAgICBkZWYgc3RvcChzZWxmKSAtPiBOb25lOiAuLi4KCmNsYXNzIERldGVjdG9yOgogICAgZGVmIGdldF9kZXRlY3Rpb25zKHNlbGYpIC0+IGxpc3Q6IC4uLgogICAgZGVmIHN0b3Aoc2VsZikgLT4gTm9uZTogLi4uCgpkZWYgZ2V0X2NhbnZhcyh3aWR0aDogaW50ID0gMCwgaGVpZ2h0OiBpbnQgPSAwKSAtPiBDYW52YXM6IC4uLgpkZWYgc3RhcnRfY2FtZXJhKGNhbnZhczogQ2FudmFzKSAtPiBDYW1lcmE6IC4uLgpkZWYgc3RhcnRfZmFjZV9kZXRlY3RvcihjYW1lcmE6IENhbWVyYSkgLT4gRGV0ZWN0b3I6IC4uLgpkZWYgc3RhcnRfb2JqZWN0X2RldGVjdG9yKGNhbWVyYTogQ2FtZXJhLCBkZWxlZ2F0ZTogc3RyID0gIkNQVSIpIC0+IERldGVjdG9yOiAuLi4K",import.meta.url))).text();t.FS.mkdirTree("/stubs"),t.FS.writeFile("/stubs/cv.pyi",c),await t.runPythonAsync(`import sys
if '/stubs' not in sys.path: sys.path.insert(0, '/stubs')`),await t.runPythonAsync(n)}let a=Promise.resolve();function o(i){a=a.then(i).catch(()=>{})}self.onmessage=i=>{const{type:c,...e}=i.data;switch(c){case"initialize":o(async()=>{try{await r(),self.postMessage({type:"initialized"})}catch(s){console.error("JediWorker: Initialization failed:",s),self.postMessage({type:"error",error:String(s)})}});break;case"sync_packages":o(async()=>{try{t&&e.code&&await t.loadPackagesFromImports(e.code)}catch(s){console.warn("JediWorker: Failed to sync packages:",s)}});break;case"complete":o(async()=>{if(!t){self.postMessage({type:"completions",requestId:e.requestId,completions:[]});return}let s="[]";try{s=await t.runPythonAsync(`_get_completions(${JSON.stringify(e.script)}, ${e.line}, ${e.column})`)}catch{}self.postMessage({type:"completions",requestId:e.requestId,completions:JSON.parse(s)})}),o(async()=>{try{t&&await t.loadPackagesFromImports(e.script)}catch{}});break}};
