"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

export default function HomePage() {
  const { user, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!_hasHydrated) return;
    router.replace(user ? (user.is_admin ? "/admin" : "/dashboard") : "/login");
  }, [user, _hasHydrated, router]);

  return null;
}
