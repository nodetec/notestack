import { Header } from "~/features/header";
import type { Metadata } from "next";

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
    <div className="relative isolate flex min-h-svh w-full flex-col bg-background sm:bg-background">
      <Header />
      <div className="flex flex-1 flex-col pb-2 sm:px-2">{children}</div>
    </div>
  );
}
