"use server";

import { redirect } from "next/navigation";

export async function redirectToPublishedArticle(url: string) {
  redirect(url);
}
