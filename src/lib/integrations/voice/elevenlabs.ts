import type {
  VoiceProvider,
  VoiceOptions,
  VoiceSynthResult,
  TranscribeOptions,
  TranscribeResult,
} from "../types";

const BASE_URL = "https://api.elevenlabs.io/v1";

function getHeaders() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY not configured");
  return {
    "xi-api-key": apiKey,
    "Content-Type": "application/json",
  };
}

export const elevenlabsProvider: VoiceProvider = {
  name: "elevenlabs",

  async synthesize(text: string, options?: VoiceOptions): Promise<VoiceSynthResult> {
    const voiceId = options?.voiceId || process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Rachel
    const format = options?.format || "mp3";

    const res = await fetch(`${BASE_URL}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
        output_format: format === "mp3" ? "mp3_44100_128" : "pcm_16000",
      }),
    });

    if (!res.ok) throw new Error(`ElevenLabs synthesis failed: ${res.status}`);
    const audio = await res.arrayBuffer();

    return {
      audio,
      format,
      durationMs: 0, // ElevenLabs doesn't return duration in the response
    };
  },

  async transcribe(audio: ArrayBuffer, options?: TranscribeOptions): Promise<TranscribeResult> {
    // ElevenLabs speech-to-text
    const formData = new FormData();
    formData.append("audio", new Blob([audio]), "audio.wav");
    if (options?.language) formData.append("language_code", options.language);

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error("ELEVENLABS_API_KEY not configured");

    const res = await fetch(`${BASE_URL}/speech-to-text`, {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: formData,
    });

    if (!res.ok) throw new Error(`ElevenLabs transcription failed: ${res.status}`);
    const data = await res.json();

    return {
      text: data.text || "",
      confidence: data.confidence ?? 0.9,
      language: data.language_code || options?.language || "en",
    };
  },
};
