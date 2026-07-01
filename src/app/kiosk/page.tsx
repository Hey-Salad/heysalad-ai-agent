import { KioskShell } from "@kiosk/kiosk-shell";
import { KIOSK_CONFIG, KIOSK_SALADS } from "@kiosk/catalog";

export default function KioskPage() {
  const paymentProvider = (process.env.HEYSALAD_KIOSK_PAYMENT_PROVIDER ?? "airwallex").trim() || "airwallex";
  const airwallexApiUrl = process.env.AIRWALLEX_API_URL?.trim();
  const airwallexEnv = (
    (process.env.NEXT_PUBLIC_AIRWALLEX_ENV ??
      (airwallexApiUrl?.includes("demo") ? "demo" : "prod")).trim() === "demo"
      ? "demo"
      : "prod"
  ) as "demo" | "prod";
  const airwallexCheckoutMode = (
    (process.env.HEYSALAD_AIRWALLEX_CHECKOUT_MODE ?? "hosted").trim() === "dropin"
      ? "dropin"
      : "hosted"
  ) as "dropin" | "hosted";
  const airwallexCountryCode = ((process.env.HEYSALAD_KIOSK_COUNTRY_CODE ?? "GB").trim().toUpperCase() || "GB");

  return (
    <KioskShell
      businessName={KIOSK_CONFIG.name}
      location={KIOSK_CONFIG.location}
      quickPrompts={KIOSK_CONFIG.quickPrompts}
      salads={KIOSK_SALADS}
      paymentProvider={paymentProvider}
      airwallexEnv={airwallexEnv}
      airwallexCheckoutMode={airwallexCheckoutMode}
      airwallexCountryCode={airwallexCountryCode}
    />
  );
}
