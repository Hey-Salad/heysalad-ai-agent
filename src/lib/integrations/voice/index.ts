import { isEnabled, type VoiceProvider } from "../types";

export function getVoiceProvider(preferred?: string): VoiceProvider {
  const provider = preferred || process.env.HEYSALAD_VOICE_PROVIDER || "twilio";

  switch (provider) {
    case "elevenlabs":
      if (!isEnabled("HEYSALAD_ELEVENLABS_ENABLED")) {
        throw new Error("ElevenLabs integration is not enabled");
      }
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require("./elevenlabs").elevenlabsProvider;

    case "openai":
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require("./openai-voice").openaiVoiceProvider;

    case "twilio":
    default:
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require("./twilio-voice").twilioVoiceProvider;
  }
}
