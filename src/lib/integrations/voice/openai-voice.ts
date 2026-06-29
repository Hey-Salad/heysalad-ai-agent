import type {
  VoiceProvider,
  VoiceOptions,
  VoiceSynthResult,
  TranscribeOptions,
  TranscribeResult,
} from "../types";

function getApiKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not configured");
  return key;
}

export const openaiVoiceProvider: VoiceProvider = {
  name: "openai",

  async synthesize(text: string, options?: VoiceOptions): Promise<VoiceSynthResult> {
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice: options?.voiceId || "alloy",
        response_format: options?.format || "mp3",
        speed: options?.speed || 1.0,
      }),
    });

    if (!res.ok) throw new Error(`OpenAI TTS failed: ${res.status}`);
    const audio = await res.arrayBuffer();

    return {
      audio,
      format: options?.format || "mp3",
      durationMs: 0,
    };
  },

  async transcribe(audio: ArrayBuffer, options?: TranscribeOptions): Promise<TranscribeResult> {
    const formData = new FormData();
    formData.append("file", new Blob([audio]), "audio.wav");
    formData.append("model", options?.model || "whisper-1");
    if (options?.language) formData.append("language", options.language);
    formData.append("response_format", "json");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: formData,
    });

    if (!res.ok) throw new Error(`OpenAI transcription failed: ${res.status}`);
    const data = await res.json();

    return {
      text: data.text || "",
      confidence: 0.95,
      language: options?.language || "en",
    };
  },
};
