let e;const n=`
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
`;async function r(){{const{loadPyodide:t}=await import(new URL("../pyodide/pyodide.mjs",import.meta.url).toString());e=await t()}await e.loadPackage(["jedi","parso"]);const c=await(await fetch(new URL("data:application/octet-stream;base64,Y2xhc3MgQ2FudmFzOgogICAgZGVmIGRyYXdfYm91bmRpbmdfYm94ZXMoc2VsZiwgZmFjZXM6IGxpc3QpIC0+IE5vbmU6IC4uLgoKY2xhc3MgQ2FtZXJhOgogICAgZGVmIHN0b3Aoc2VsZikgLT4gTm9uZTogLi4uCgpjbGFzcyBEZXRlY3RvcjoKICAgIGRlZiBnZXRfZGV0ZWN0aW9ucyhzZWxmKSAtPiBsaXN0OiAuLi4KICAgIGRlZiBzdG9wKHNlbGYpIC0+IE5vbmU6IC4uLgoKZGVmIGdldF9jYW52YXMod2lkdGg6IGludCwgaGVpZ2h0OiBpbnQpIC0+IENhbnZhczogLi4uCmRlZiBzdGFydF9jYW1lcmEoY2FudmFzOiBDYW52YXMpIC0+IENhbWVyYTogLi4uCmRlZiBzdGFydF9kZXRlY3RvcihjYW1lcmE6IENhbWVyYSkgLT4gRGV0ZWN0b3I6IC4uLgo=",import.meta.url))).text();e.FS.mkdirTree("/stubs"),e.FS.writeFile("/stubs/cv.pyi",c),await e.runPythonAsync(`import sys
if '/stubs' not in sys.path: sys.path.insert(0, '/stubs')`),await e.runPythonAsync(n)}let a=Promise.resolve();function o(s){a=a.then(s).catch(()=>{})}self.onmessage=s=>{const{type:c,...t}=s.data;switch(c){case"initialize":o(async()=>{try{await r(),self.postMessage({type:"initialized"})}catch(i){console.error("JediWorker: Initialization failed:",i),self.postMessage({type:"error",error:String(i)})}});break;case"sync_packages":o(async()=>{try{e&&t.code&&await e.loadPackagesFromImports(t.code)}catch(i){console.warn("JediWorker: Failed to sync packages:",i)}});break;case"complete":o(async()=>{if(!e){self.postMessage({type:"completions",requestId:t.requestId,completions:[]});return}let i="[]";try{i=await e.runPythonAsync(`_get_completions(${JSON.stringify(t.script)}, ${t.line}, ${t.column})`)}catch{}self.postMessage({type:"completions",requestId:t.requestId,completions:JSON.parse(i)})}),o(async()=>{try{e&&await e.loadPackagesFromImports(t.script)}catch{}});break}};
