import { Suspense } from "react";

import { authOptions } from "~/auth";
import { ProfileSettings } from "~/features/settings";
import { type UserWithKeys } from "~/types";
import { getServerSession } from "next-auth";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as UserWithKeys | undefined;

  return (
    <main className="grow bg-secondary p-2 sm:rounded-lg sm:p-10 sm:shadow-sm sm:ring-1 sm:ring-zinc-950/5 dark:sm:ring-white/10">
      <Suspense fallback={<div></div>}>
        <ProfileSettings publicKey={user?.publicKey} />
      </Suspense>
    </main>
  );
}
