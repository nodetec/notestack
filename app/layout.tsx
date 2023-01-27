import "../styles/globals.css";
import Providers from "./context/providers.jsx";
import Header from "./Header";
import { Roboto } from "@next/font/google";

const main = Roboto({
  variable: "--main-font",
  weight: ['100', '300', '400', '500', '700', '900'],
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={main.variable}>
      <head />
      <body className="flex flex-col container p-6 m-auto md:max-w-[90%] 2xl:max-w-[80%] min-h-screen font-main">
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
