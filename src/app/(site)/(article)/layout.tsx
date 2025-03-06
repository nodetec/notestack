import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NoteStack",
  description: "Stack notes and sats",
};

export default function ArticleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
        <div></div>
          {children}
    </div>
  );
}
