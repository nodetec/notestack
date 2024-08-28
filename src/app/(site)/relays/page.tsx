import { authOptions } from "~/auth";
import { RelaySettings } from "~/features/relays";
import { redirectIfNotLoggedIn } from "~/server/auth";
import { type UserWithKeys } from "~/types";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function RelayPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as UserWithKeys | undefined;

  await redirectIfNotLoggedIn();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <h1 className="mx-auto mb-4 max-w-xl px-6 pb-4 pt-2 text-3xl font-bold sm:px-0 sm:pt-0">
        Relay Settings
      </h1>
      <div className="mx-auto flex max-w-xl flex-col items-center">
        <RelaySettings userPublicKey={user?.publicKey} />
      </div>
    </>
  );
}
