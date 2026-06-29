import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

export function getTwilioClient() {
  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials not configured");
  }
  return twilio(accountSid, authToken);
}

export function validateTwilioRequest(
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  if (!authToken) return false;
  return twilio.validateRequest(authToken, signature, url, params);
}

export async function sendSms(to: string, body: string, from?: string) {
  const client = getTwilioClient();
  const fromNumber = from || process.env.TWILIO_PHONE_NUMBER;
  if (!fromNumber) throw new Error("TWILIO_PHONE_NUMBER not configured");

  return client.messages.create({ to, from: fromNumber, body });
}

export function generateTwimlResponse(message: string): string {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();
  response.say({ voice: "Polly.Amy", language: "en-GB" }, message);
  return response.toString();
}

export function generateTwimlGather(message: string, actionUrl: string): string {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();
  const gather = response.gather({
    input: ["speech"],
    action: actionUrl,
    method: "POST",
    speechTimeout: "auto",
    language: "en-GB",
  });
  gather.say({ voice: "Polly.Amy", language: "en-GB" }, message);
  return response.toString();
}
