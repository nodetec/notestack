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
    <main className="grow px-6 py-4 sm:rounded-lg sm:bg-secondary sm:px-10 sm:shadow-sm sm:ring-1 sm:ring-foreground/10">
      {children}
    </main>
  );
}
