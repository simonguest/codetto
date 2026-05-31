export async function initializeAudio(
  pyodide: any,
  viaSync: ((command: object) => string) | null,
  runPythonFile: (url: URL) => Promise<any>
): Promise<void> {
  if (viaSync) {
    pyodide.globals.set("_audio_play", (dataUrl: string) =>
      viaSync({ op: "audio_play", dataUrl, wait: true })
    );
    pyodide.globals.set("_audio_play_nowait", (dataUrl: string) =>
      viaSync({ op: "audio_play", dataUrl, wait: false })
    );
  }

  await reloadAudioPython(runPythonFile);
}

export async function reloadAudioPython(
  runPythonFile: (url: URL) => Promise<any>
): Promise<void> {
  console.log("PyodideWorker: Loading audio module");
  await runPythonFile(new URL("./audio.py", import.meta.url));
}
