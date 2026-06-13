// src/app/layout.tsx
import type { Metadata } from "next";
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

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <head>
        {/* Set the layout viewport to the device width so CSS media queries
            (e.g. max-width: 768px) actually see the real device size. Without
            this, mobile browsers default to a ~980px layout viewport and the
            mobile rules never fire. Inlined here instead of via the Next.js
            viewport export to make it impossible to accidentally tree-shake
            or cache around. */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
};

export default RootLayout;
