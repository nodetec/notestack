import { Suspense } from "react";

import { authOptions } from "~/auth";
import { ProfileSettings } from "~/features/settings";
import { redirectIfNotLoggedIn } from "~/server/auth";
import { type UserWithKeys } from "~/types";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as UserWithKeys | undefined;

  await redirectIfNotLoggedIn();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="grow bg-secondary p-2 sm:rounded-lg sm:p-10 sm:shadow-sm sm:ring-1 sm:ring-zinc-950/5 dark:sm:ring-white/10">
      <div className="flex w-full flex-col items-center pt-12">
        <ProfileSettings publicKey={user?.publicKey} />;
      </div>
    </main>
  );
}
