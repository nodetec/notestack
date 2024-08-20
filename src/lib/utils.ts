import { glass } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAvatar(seed: string | undefined) {
  return createAvatar(glass, {
    seed: seed ?? "",
  }).toDataUri();
}
