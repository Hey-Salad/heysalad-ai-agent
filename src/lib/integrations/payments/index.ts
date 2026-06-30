import { isEnabled, type PaymentProvider } from "../types";
import { airwallexProvider } from "./airwallex";
import { paypalProvider } from "./paypal";
import { stripeProvider } from "./stripe-provider";

export function getPaymentProvider(preferred?: string): PaymentProvider {
  const provider = preferred || process.env.HEYSALAD_PAYMENT_PROVIDER || "stripe";

  switch (provider) {
    case "airwallex":
      if (!isEnabled("HEYSALAD_AIRWALLEX_ENABLED")) {
        throw new Error("Airwallex integration is not enabled");
      }
      return airwallexProvider;

    case "paypal":
      if (!isEnabled("HEYSALAD_PAYPAL_ENABLED")) {
        throw new Error("PayPal integration is not enabled");
      }
      return paypalProvider;

    case "stripe":
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("STRIPE_SECRET_KEY is not configured — add it to your environment variables or switch to a different payment provider");
      }
      return stripeProvider;

    default:
      throw new Error(`Unknown payment provider: "${provider}". Valid options: airwallex, paypal, stripe`);
  }
}
