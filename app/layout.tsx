import "../styles/globals.css";
import Providers from "./context/providers.jsx";
import Header from "./Header";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
      <body className="bg-primary flex flex-col container p-6 m-auto md:max-w-[90%] 2xl:max-w-[80%] min-h-screen">
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
