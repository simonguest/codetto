let t;const a=`
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
`;async function r(){{const{loadPyodide:e}=await import(new URL("../pyodide/pyodide.mjs",import.meta.url).toString());t=await e()}await t.loadPackage(["jedi","parso"]);const c=await(await fetch(new URL("data:application/octet-stream;base64,ZnJvbSBncmFwaGljcyBpbXBvcnQgQ2FudmFzCgpjbGFzcyBDYW1lcmE6CiAgICBkZWYgc3RvcChzZWxmKSAtPiBOb25lOiAuLi4KCmNsYXNzIERldGVjdG9yOgogICAgZGVmIGdldF9kZXRlY3Rpb25zKHNlbGYpIC0+IGxpc3Q6IC4uLgogICAgZGVmIHN0b3Aoc2VsZikgLT4gTm9uZTogLi4uCgpkZWYgc3RhcnRfY2FtZXJhKGNhbnZhczogQ2FudmFzIHwgTm9uZSA9IE5vbmUpIC0+IENhbWVyYTogLi4uCmRlZiBzdGFydF9mYWNlX2RldGVjdG9yKGNhbWVyYTogQ2FtZXJhKSAtPiBEZXRlY3RvcjogLi4uCmRlZiBzdGFydF9vYmplY3RfZGV0ZWN0b3IoY2FtZXJhOiBDYW1lcmEsIGRlbGVnYXRlOiBzdHIgPSAiQ1BVIikgLT4gRGV0ZWN0b3I6IC4uLgo=",import.meta.url))).text();t.FS.mkdirTree("/stubs"),t.FS.writeFile("/stubs/cv.pyi",c),await t.runPythonAsync(`import sys
if '/stubs' not in sys.path: sys.path.insert(0, '/stubs')`),await t.runPythonAsync(a)}let n=Promise.resolve();function o(s){n=n.then(s).catch(()=>{})}self.onmessage=s=>{const{type:c,...e}=s.data;switch(c){case"initialize":o(async()=>{try{await r(),self.postMessage({type:"initialized"})}catch(i){console.error("JediWorker: Initialization failed:",i),self.postMessage({type:"error",error:String(i)})}});break;case"sync_packages":o(async()=>{try{t&&e.code&&await t.loadPackagesFromImports(e.code)}catch(i){console.warn("JediWorker: Failed to sync packages:",i)}});break;case"complete":o(async()=>{if(!t){self.postMessage({type:"completions",requestId:e.requestId,completions:[]});return}let i="[]";try{i=await t.runPythonAsync(`_get_completions(${JSON.stringify(e.script)}, ${e.line}, ${e.column})`)}catch{}self.postMessage({type:"completions",requestId:e.requestId,completions:JSON.parse(i)})}),o(async()=>{try{t&&await t.loadPackagesFromImports(e.script)}catch{}});break}};
