import { Button } from "~/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative h-screen w-full overflow-hidden">
      <Image
        src={"/images/notes.avif"}
        alt="Background"
        layout="fill"
        objectFit="cover"
        priority
      />
      <div className="absolute inset-0 bg-black/85" aria-hidden="true" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
        <h1 className="mb-4 text-4xl font-bold text-white">
          404 - Page Not Found
        </h1>
        <p className="mb-8 max-w-md text-lg text-white">
          Oops! The page you're looking for doesn't exist. It might have been
          moved or deleted.
        </p>
        <Button asChild>
          <Link
            href="/"
            // prefetch={false}
          >
            Return to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
