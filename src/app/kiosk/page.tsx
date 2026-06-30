import { KioskShell } from "@kiosk/kiosk-shell";
import { KIOSK_CONFIG, KIOSK_SALADS } from "@kiosk/catalog";

export default function KioskPage() {
  return (
    <KioskShell
      businessName={KIOSK_CONFIG.name}
      location={KIOSK_CONFIG.location}
      quickPrompts={KIOSK_CONFIG.quickPrompts}
      salads={KIOSK_SALADS}
      paymentProvider={process.env.HEYSALAD_KIOSK_PAYMENT_PROVIDER ?? "airwallex"}
    />
  );
}
