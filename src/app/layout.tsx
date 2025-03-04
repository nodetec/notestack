import type { Metadata } from "next";

import "~/styles/globals.css";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import AuthProvider from "~/components/auth-provider";
import QueryClientProviderWrapper from "~/components/query-client-provider";
import { ThemeProvider } from "~/components/theme-provider";
import { Toaster } from "~/components/ui/sonner";
import { Merriweather, Source_Serif_4 } from "next/font/google";

const sourceSerif = Source_Serif_4({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-source-serif-4",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
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
        className={`overflow-x-hidden bg-secondary antialiased sm:bg-background ${sourceSerif.variable} ${merriweather.variable}`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryClientProviderWrapper>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
