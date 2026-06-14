"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, ShieldOff, Loader2, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { useAuthStore } from "@/lib/store";
import { adminApi } from "@/lib/api";
import type { User } from "@/types";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuthStore();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser?.is_admin) { router.replace("/dashboard"); return; }
    adminApi.users
      .list()
      .then((r) => setUsers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser, router]);

  const handleToggleAdmin = async (u: User) => {
    if (u.id === currentUser?.id) return; // can't demote yourself
    setActionId(u.id);
    try {
      const res = await adminApi.users.toggleAdmin(u.id);
      setUsers((prev) => prev.map((p) => (p.id === u.id ? res.data : p)));
    } catch (e) {
      console.error(e);
    } finally {
      setActionId(null);
    }
  };

  if (!currentUser?.is_admin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="px-4 pt-20 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/admin"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Users</h1>
            <p className="text-xs text-muted-foreground">{users.length} total</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-sm">No users found.</p>
        ) : (
          <ul className="space-y-2">
            {users.map((u) => {
              const isSelf = u.id === currentUser?.id;
              return (
                <li
                  key={u.id}
                  className="bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center gap-3"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-bold uppercase">
                      {u.username.slice(0, 1)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold truncate">{u.username}</p>
                      {isSelf && (
                        <span className="text-[10px] text-violet-600 font-medium bg-violet-50 dark:bg-violet-950 px-1.5 py-0.5 rounded-full">
                          you
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    <div className="flex gap-1.5 mt-1.5">
                      <Badge variant={u.is_admin ? "default" : "secondary"} className="text-[10px] px-1.5">
                        {u.is_admin ? "Admin" : "User"}
                      </Badge>
                      <Badge variant={u.is_active ? "success" : "destructive"} className="text-[10px] px-1.5">
                        {u.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>

                  {/* Toggle admin button */}
                  {!isSelf && (
                    <button
                      onClick={() => handleToggleAdmin(u)}
                      disabled={actionId === u.id}
                      className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
                        u.is_admin
                          ? "bg-red-50 dark:bg-red-950 text-red-500 hover:bg-red-100"
                          : "bg-violet-50 dark:bg-violet-950 text-violet-600 hover:bg-violet-100"
                      } disabled:opacity-50`}
                      title={u.is_admin ? "Remove admin" : "Make admin"}
                    >
                      {actionId === u.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : u.is_admin ? (
                        <ShieldOff className="h-4 w-4" />
                      ) : (
                        <Shield className="h-4 w-4" />
                      )}
                    </button>
                  )}

                  {isSelf && (
                    <div className="shrink-0 w-9 h-9 flex items-center justify-center text-muted-foreground">
                      <UserCircle2 className="h-4 w-4" />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
