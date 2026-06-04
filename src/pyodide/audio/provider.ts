// Holds references to playing Audio elements so they are not garbage collected
// before playback ends.
const activeAudio = new Set<HTMLAudioElement>();

// Known voice names ordered by preference for each "lang/gender" pair.
// Picks the first name present in speechSynthesis.getVoices(); falls back to
// any voice whose lang code matches if none are found.
const TTS_VOICE_PRIORITY: Record<string, string[]> = {
  "en-US/female": ["Samantha", "Zoe", "Nicky", "Ava", "Allison", "Susan", "Kathy", "Vicki", "Victoria", "Google US English"],
  "en-US/male":   ["Alex", "Fred", "Tom", "Aaron", "Bruce", "Google US English"],
  "en-GB/female": ["Flo", "Grandma", "Martha", "Serena", "Kate", "Google UK English Female"],
  "en-GB/male":   ["Daniel", "Arthur", "Grandfather", "Malcolm", "Google UK English Male"],
  "en-AU/female": ["Karen"],
  "en-AU/male":   ["Lee"],
  "fr-FR/female": ["Aurelie", "Google français"],
  "fr-FR/male":   ["Thomas", "Google français"],
  "de-DE/female": ["Anna", "Petra", "Google Deutsch"],
  "de-DE/male":   ["Yannick", "Google Deutsch"],
  "es-ES/female": ["Mónica", "Montserrat", "Google español"],
  "es-ES/male":   ["Jorge", "Google español"],
  "it-IT/female": ["Alice", "Federica", "Google italiano"],
  "it-IT/male":   ["Luca", "Google italiano"],
  "pt-BR/female": ["Luciana", "Google português do Brasil"],
  "pt-BR/male":   ["Felipe", "Google português do Brasil"],
  "ja-JP/female": ["Kyoko", "Google 日本語"],
  "ja-JP/male":   ["Otoya", "Google 日本語"],
  "zh-CN/female": ["Tingting", "Google 普通话（中国大陆）"],
  "zh-CN/male":   ["Google 普通话（中国大陆）"],
  "ko-KR/female": ["Yuna", "Google 한국의"],
  "ko-KR/male":   ["Google 한국의"],
  "hi-IN/female": ["Lekha", "Google हिन्दी"],
  "hi-IN/male":   ["Google हिन्दी"],
  "ar-SA/female": ["Google العربية"],
  "ar-SA/male":   ["Maged", "Google العربية"],
};

function resolveTtsVoice(
  voices: SpeechSynthesisVoice[],
  lang: string | null,
  gender: string | null
): SpeechSynthesisVoice | null {
  if (!lang) return null;

  if (gender) {
    const key = `${lang}/${gender}`;
    for (const name of TTS_VOICE_PRIORITY[key] ?? []) {
      const match = voices.find(v => v.name === name);
      if (match) return match;
    }
  }

  // Fall back to any voice whose lang code matches
  return voices.find(v => v.lang === lang || v.lang.startsWith(lang.split("-")[0])) ?? null;
}

async function getVoices(): Promise<SpeechSynthesisVoice[]> {
  let voices = speechSynthesis.getVoices();
  if (voices.length === 0) {
    await new Promise<void>(resolve => {
      speechSynthesis.onvoiceschanged = () => {
        speechSynthesis.onvoiceschanged = null;
        resolve();
      };
      setTimeout(resolve, 1000);
    });
    voices = speechSynthesis.getVoices();
  }
  return voices;
}

export async function handleAudioOp(
  op: string,
  command: any,
  viaRespond: (result: any) => void
): Promise<boolean> {
  if (op === "audio_play") {
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

  if (op === "tts_speak") {
    if (typeof speechSynthesis === "undefined") {
      viaRespond({ type: "unavailable" });
      return true;
    }

    const { text, voiceJson, wait } = command;
    const { lang, gender } = JSON.parse(voiceJson);

    try {
      const voices = await getVoices();
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = resolveTtsVoice(voices, lang, gender);
      if (voice) utterance.voice = voice;
      if (lang) utterance.lang = lang;

      if (wait) {
        await new Promise<void>((resolve, reject) => {
          utterance.onend = () => resolve();
          utterance.onerror = (e) => reject(new Error(e.error));
          speechSynthesis.speak(utterance);
        });
      } else {
        speechSynthesis.speak(utterance);
      }
      viaRespond({ type: "value", value: null });
    } catch (err) {
      viaRespond({ type: "error", message: String(err) });
    }
    return true;
  }

  return false;
}
