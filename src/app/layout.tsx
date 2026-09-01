import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LYNUX Admin Core",
  description: "LYNUX private website administration platform",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
