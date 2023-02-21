import "../styles/globals.css";
import Providers from "./context/providers.jsx";
import Header from "./Header";
import { Roboto } from "@next/font/google";
import Notification from "@/app/Notification";
import ScrollToTop from "./ScrollToptop";

const main = Roboto({
  variable: "--main-font",
  weight: ["100", "300", "400", "500", "700", "900"],
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      id="blogstack-html"
      className="main-font"
      data-color-mode="light"
    >
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
