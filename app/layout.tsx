import "../styles/globals.css";
import Providers from "./context/providers.jsx";
import Header from "./Header";
import Notification from "@/app/Notification";
import ScrollToTop from "./ScrollToptop";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" id="blogstack-html" data-color-mode="light">
      <head />
      <body className="font-main">
        <Providers>
          <Header />
          <div className="container relative flex flex-col px-4 mx-auto min-h-screen">
            {children}
          </div>
          <Notification />
        </Providers>
        <ScrollToTop />
      </body>
    </html>
  );
}
