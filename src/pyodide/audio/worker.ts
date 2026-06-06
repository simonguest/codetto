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
    pyodide.globals.set("_tts_speak", (text: string, voiceJson: string, wait: boolean) =>
      viaSync({ op: "tts_speak", text, voiceJson, wait })
    );
    pyodide.globals.set("_audio_note_play", (notesJson: string, wait: boolean) =>
      viaSync({ op: "note_play", notesJson, wait })
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
