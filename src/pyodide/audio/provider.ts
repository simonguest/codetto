// Holds references to playing Audio elements so they are not garbage collected
// before playback ends.
const activeAudio = new Set<HTMLAudioElement>();

export async function handleAudioOp(
  op: string,
  command: any,
  viaRespond: (result: any) => void
): Promise<boolean> {
  if (op !== "audio_play") return false;

  const { dataUrl, wait } = command;
  const audio = new Audio(dataUrl);
  activeAudio.add(audio);

  try {
    if (wait) {
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => { activeAudio.delete(audio); resolve(); };
        audio.onerror = () => { activeAudio.delete(audio); reject(new Error("Audio playback failed")); };
        audio.play().catch(reject);
      });
    } else {
      audio.onended = () => activeAudio.delete(audio);
      await audio.play();
    }
    viaRespond({ type: "value", value: null });
  } catch (err) {
    activeAudio.delete(audio);
    viaRespond({ type: "error", message: String(err) });
  }

  return true;
}
