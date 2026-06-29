import { isEnabled, type PaymentProvider } from "../types";

export function getPaymentProvider(preferred?: string): PaymentProvider {
  const provider = preferred || process.env.HEYSALAD_PAYMENT_PROVIDER || "stripe";

  switch (provider) {
    case "airwallex":
      if (!isEnabled("HEYSALAD_AIRWALLEX_ENABLED")) {
        throw new Error("Airwallex integration is not enabled");
      }
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require("./airwallex").airwallexProvider;

    case "paypal":
      if (!isEnabled("HEYSALAD_PAYPAL_ENABLED")) {
        throw new Error("PayPal integration is not enabled");
      }
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require("./paypal").paypalProvider;

    case "stripe":
    default:
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require("./stripe-provider").stripeProvider;
  }
}
