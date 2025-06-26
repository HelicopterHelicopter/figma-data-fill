import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FMT Data Fill Plugin Dashboard",
  description: "Manage mock data for your Figma Data Fill plugin",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
