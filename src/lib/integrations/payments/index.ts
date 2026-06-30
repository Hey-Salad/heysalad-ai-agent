import { type PaymentProvider } from "../types";
import { airwallexProvider } from "./airwallex";
import { paypalProvider } from "./paypal";
import { stripeProvider } from "./stripe-provider";

export function getPaymentProvider(preferred?: string): PaymentProvider {
  const provider = (preferred || process.env.HEYSALAD_PAYMENT_PROVIDER || "airwallex").trim();

  switch (provider) {
    case "airwallex":
      return airwallexProvider;

    case "paypal":
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
