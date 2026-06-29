export const metadata = {
  title: "HeySalad AI Agent",
  description: "Open-source AI agent for food businesses",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
