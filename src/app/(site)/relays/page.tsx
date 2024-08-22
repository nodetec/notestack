import { Suspense } from "react";

import { authOptions } from "~/auth";
import { redirectIfNotLoggedIn } from "~/server/auth";
import { type UserWithKeys } from "~/types";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { RelaySettings } from "~/features/relays";

async function RelayPageWrapper() {
  const session = await getServerSession(authOptions);
  const user = session?.user as UserWithKeys | undefined;

  await redirectIfNotLoggedIn();

  if (!user) {
    redirect("/login");
  }

  // TODO: redirect to login if user is not logged in
  return <RelaySettings publicKey={user?.publicKey} />;
}

export default async function RelayPage() {
  return (
    <main className="grow bg-secondary p-2 sm:rounded-lg sm:p-10 sm:shadow-sm sm:ring-1 sm:ring-foreground/10">
        <h1 className="text-3xl max-w-xl pt-2 sm:pt-0 px-6 sm:px-0 mx-auto font-bold pb-4 mb-4">Relay Settings</h1>
      <div className="flex max-w-xl mx-auto flex-col items-center">
        <Suspense fallback={<div className="h-screen">loading...</div>}>
          <RelayPageWrapper />
        </Suspense>
      </div>
    </main>
  );
}
