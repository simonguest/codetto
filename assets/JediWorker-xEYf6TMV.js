let e;const a=`
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
`;async function n(){{const{loadPyodide:r}=await import(new URL("../pyodide/pyodide.mjs",import.meta.url).toString());e=await r()}await e.loadPackage(["jedi","parso"]),await e.runPythonAsync(a)}let s=Promise.resolve();function i(r){s=s.then(r).catch(()=>{})}self.onmessage=r=>{const{type:c,...t}=r.data;switch(c){case"initialize":i(async()=>{try{await n(),self.postMessage({type:"initialized"})}catch(o){console.error("JediWorker: Initialization failed:",o),self.postMessage({type:"error",error:String(o)})}});break;case"sync_packages":i(async()=>{try{e&&t.code&&await e.loadPackagesFromImports(t.code)}catch(o){console.warn("JediWorker: Failed to sync packages:",o)}});break;case"complete":i(async()=>{if(!e){self.postMessage({type:"completions",requestId:t.requestId,completions:[]});return}let o="[]";try{o=await e.runPythonAsync(`_get_completions(${JSON.stringify(t.script)}, ${t.line}, ${t.column})`)}catch{}self.postMessage({type:"completions",requestId:t.requestId,completions:JSON.parse(o)})}),i(async()=>{try{e&&await e.loadPackagesFromImports(t.script)}catch{}});break}};
