import type { Metadata } from "next";

import "~/styles/globals.css";

import { ThemeProvider } from "~/components/theme-provider";
import { Newsreader } from "next/font/google";

import Providers from "./providers";

const newsreader = Newsreader({
  weight: ["500", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-newsreader",
});

export const metadata: Metadata = {
  title: "NoteStack",
  description: "Stack notes and sats",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`overflow-x-hidden bg-background antialiased ${newsreader.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
