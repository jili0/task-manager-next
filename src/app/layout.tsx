// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tasks",
  description: "A Next.js Task Manager with MongoDB",
  formatDetection: {
    address: false,
    telephone: false,
  },
};

// Explicit viewport so iOS Safari has a clear starting point and doesn't
// re-scale weirdly after the on-focus auto-zoom would otherwise kick in.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
};

export default RootLayout;
