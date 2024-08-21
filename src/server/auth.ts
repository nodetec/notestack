"use server";

import { authOptions } from "~/auth";
import { type UserWithKeys } from "~/types";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export async function getUser() {
  const session = await getServerSession(authOptions);
  const user = session?.user as UserWithKeys | undefined;
  return user;
}

export async function redirectIfNotLoggedIn() {
  const session = await getServerSession(authOptions);
  const user = session?.user as UserWithKeys | undefined;
  if (!user) {
    redirect("/login");
  }
}
