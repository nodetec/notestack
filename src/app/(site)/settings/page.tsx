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
    <div className="flex w-full flex-col items-center pt-12">
      <ProfileSettings publicKey={user?.publicKey} />
    </div>
  );
}
