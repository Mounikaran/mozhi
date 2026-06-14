import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCost(cost: number): string {
  return `$${cost.toFixed(6)}`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export async function getDeviceFingerprint(): Promise<string> {
  const FingerprintJS = await import("@fingerprintjs/fingerprintjs");
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  return result.visitorId;
}
