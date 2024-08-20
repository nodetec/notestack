import { authOptions } from "~/auth";
import { type UserWithKeys } from "~/types";
import { getServerSession } from "next-auth";

export async function getUser() {
  const session = await getServerSession(authOptions);
  const user = session?.user as UserWithKeys | undefined;
  return user;
}
