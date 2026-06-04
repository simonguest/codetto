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

def _get_signatures(source, line, column):
    try:
        script = jedi.Script(source)
        sigs = script.get_signatures(line, column)
        if not sigs:
            return '[]'
        return json.dumps([
            {
                'name': s.name,
                'params': [p.description for p in s.params],
                'docstring': s.docstring(raw=True),
                'index': s.index,
            }
            for s in sigs
        ])
    except Exception:
        return '[]'
`;async function c(){{const{loadPyodide:r}=await import(new URL("../pyodide/pyodide.mjs",import.meta.url).toString());t=await r()}await t.loadPackage(["jedi","parso"]),t.FS.mkdirTree("/stubs");for(const[r,n]of[["cv","./cv/cv.pyi"],["audio","./audio/audio.pyi"],["graphics","./graphics/graphics.pyi"]]){const e=await fetch(new URL(n,import.meta.url));t.FS.writeFile(`/stubs/${r}.pyi`,await e.text())}await t.runPythonAsync(`import sys
if '/stubs' not in sys.path: sys.path.insert(0, '/stubs')`),await t.runPythonAsync(a)}let o=Promise.resolve();function i(r){o=o.then(r).catch(()=>{})}self.onmessage=r=>{const{type:n,...e}=r.data;switch(n){case"initialize":i(async()=>{try{await c(),self.postMessage({type:"initialized"})}catch(s){console.error("JediWorker: Initialization failed:",s),self.postMessage({type:"error",error:String(s)})}});break;case"sync_packages":i(async()=>{try{t&&e.code&&await t.loadPackagesFromImports(e.code)}catch(s){console.warn("JediWorker: Failed to sync packages:",s)}});break;case"signatures":i(async()=>{if(!t){self.postMessage({type:"sig_results",requestId:e.requestId,signatures:[]});return}let s="[]";try{s=await t.runPythonAsync(`_get_signatures(${JSON.stringify(e.script)}, ${e.line}, ${e.column})`)}catch{}self.postMessage({type:"sig_results",requestId:e.requestId,signatures:JSON.parse(s)})});break;case"complete":i(async()=>{if(!t){self.postMessage({type:"completions",requestId:e.requestId,completions:[]});return}let s="[]";try{s=await t.runPythonAsync(`_get_completions(${JSON.stringify(e.script)}, ${e.line}, ${e.column})`)}catch{}self.postMessage({type:"completions",requestId:e.requestId,completions:JSON.parse(s)})}),i(async()=>{try{t&&await t.loadPackagesFromImports(e.script)}catch{}});break}};
