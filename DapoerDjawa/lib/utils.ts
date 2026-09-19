import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility dinamis untuk menggabungkan class Tailwind dan mengatasi konflik style (misal: p-4 menimpa p-2)[cite: 23].
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}