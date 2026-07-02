export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.ANYWAY_API_KEY) return;

  const { initialize } = await import("@anyway-sh/node-server-sdk");
  initialize({
    appName: "heysalad-kiosk",
    silenceInitializationMessage: true,
  });
}
