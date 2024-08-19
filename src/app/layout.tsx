import type { Metadata } from "next";

import "~/styles/globals.css";

import AuthProvider from "~/components/auth-provider";
import QueryClientProviderWrapper from "~/components/query-client-provider";
import { ThemeProvider } from "~/components/theme-provider";
import { Merriweather, Newsreader } from "next/font/google";

const newsreader = Newsreader({
  weight: ["500", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-newsreader",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-merriweather",
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
      <body
        className={`overflow-x-hidden bg-background antialiased ${newsreader.variable} ${merriweather.variable}`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryClientProviderWrapper>
            <AuthProvider>{children}</AuthProvider>
          </QueryClientProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
