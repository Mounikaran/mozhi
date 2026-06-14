"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import type { User } from "@/types";

interface UseRequireAuthOptions {
  requireAdmin?: boolean;
}

interface UseRequireAuthResult {
  user: User | null;
  deviceApproved: boolean;
  ready: boolean;
}

export function useRequireAuth({ requireAdmin = false }: UseRequireAuthOptions = {}): UseRequireAuthResult {
  const { user, deviceApproved, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (requireAdmin && !user.is_admin) {
      router.replace("/dashboard");
    }
  }, [user, _hasHydrated, requireAdmin, router]);

  const ready = _hasHydrated && !!user && (!requireAdmin || user.is_admin);
  return { user: ready ? user : null, deviceApproved, ready };
}
