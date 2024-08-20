import { Suspense } from "react";

import { authOptions } from "~/auth";
import { type UserWithKeys } from "~/types";
import { getServerSession } from "next-auth";
import { ProfileSettings } from "~/features/settings";


async function SettingsPageWrapper() {
  const session = await getServerSession(authOptions);
  const user = session?.user as UserWithKeys | undefined;
  // TODO: redirect to login if user is not logged in
  return <ProfileSettings />;
}

export default async function SettingsPage() {
  return (
    <main className="grow bg-secondary p-2 sm:rounded-lg sm:p-10 sm:shadow-sm sm:ring-1 sm:ring-zinc-950/5 dark:sm:ring-white/10">
      <div className="flex w-full flex-col items-center pt-12">
        <Suspense fallback={<div className="h-screen">loading...</div>}>
          <SettingsPageWrapper />
        </Suspense>
      </div>
    </main>
  );
}
