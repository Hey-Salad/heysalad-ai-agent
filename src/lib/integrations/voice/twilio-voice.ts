import type {
  VoiceProvider,
  VoiceOptions,
  VoiceSynthResult,
  TranscribeOptions,
  TranscribeResult,
} from "../types";

/**
 * Twilio voice provider — uses Twilio's built-in TTS (Polly)
 * and speech recognition via <Gather>. This is a passthrough
 * since Twilio handles voice natively in TwiML.
 */
export const twilioVoiceProvider: VoiceProvider = {
  name: "twilio",

  async synthesize(_text: string, _options?: VoiceOptions): Promise<VoiceSynthResult> {
    // Twilio synthesises voice inline via TwiML <Say> — no separate API call needed.
    // This stub exists so the provider interface is satisfied.
    throw new Error("Twilio TTS is handled inline via TwiML. Use generateTwimlResponse() instead.");
  },

  async transcribe(_audio: ArrayBuffer, _options?: TranscribeOptions): Promise<TranscribeResult> {
    // Twilio transcribes via <Gather input='speech'> — no separate API call needed.
    throw new Error("Twilio STT is handled inline via TwiML <Gather>. Speech comes as SpeechResult in webhook.");
  },
};
