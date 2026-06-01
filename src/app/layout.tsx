import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meow-nuscript Foundry - 8-Bit Academic Multi-Agent",
  description: "A retro 8-bit RPG themed AI agent workspace that helps draft and review Q3/Q4 academic chapters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-retro-bg text-slate-100 font-vt323 antialiased selection:bg-retro-primary selection:text-black">
        {children}
      </body>
    </html>
  );
}
