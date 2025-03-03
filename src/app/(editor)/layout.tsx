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
    <div className="relative isolate flex min-h-svh w-full flex-col bg-secondary sm:bg-background">
      <div className="flex flex-1 flex-col py-2 sm:px-2">
        <main className="grow px-4 sm:rounded-lg sm:bg-secondary sm:px-0 sm:shadow-sm sm:ring-1 sm:ring-foreground/10">
          {children}
        </main>
      </div>
    </div>
  );
}
