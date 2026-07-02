import { KioskShell } from "@kiosk/kiosk-shell";
import { KIOSK_CONFIG, KIOSK_SALADS } from "@kiosk/catalog";

export default function Home() {
  return (
    <KioskShell
      businessName={KIOSK_CONFIG.name}
      location={KIOSK_CONFIG.location}
      quickPrompts={KIOSK_CONFIG.quickPrompts}
      salads={KIOSK_SALADS}
      paymentProvider={process.env.HEYSALAD_KIOSK_PAYMENT_PROVIDER ?? "airwallex"}
      airwallexEnv={
        (process.env.NEXT_PUBLIC_AIRWALLEX_ENV ??
          (process.env.AIRWALLEX_API_URL?.includes("demo") ? "demo" : "prod")) as "demo" | "prod"
      }
    />
  );
}
