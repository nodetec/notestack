import Image from "next/image";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto h-screen w-full">
      <div className="h-screen w-full lg:grid lg:grid-cols-2">
        <div className="flex h-screen flex-col items-center pt-32">
          {children}
        </div>
        <div className="hidden bg-muted h-screen lg:block">
          <Image
            src="https://images.unsplash.com/photo-1470790376778-a9fbc86d70e2?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fG5vdGUlMjBuZXR3b3JrfGVufDB8fDB8fHww"
            alt="Image"
            width="2000"
            height="2000"
            className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          />
        </div>
      </div>
    </div>
  );
}
