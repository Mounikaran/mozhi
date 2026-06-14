"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Mic, Shield, LogOut, Sun, Moon } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { authApi } from "@/lib/api";
import { useTheme } from "@/components/ThemeProvider";

export function Navbar() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      router.push("/login");
    }
  };

  if (!user) return null;

  const navItems = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/voice", icon: Mic, label: "Practice" },
    ...(user.is_admin ? [{ href: "/admin", icon: Shield, label: "Admin" }] : []),
  ];

  return (
    <>
      {/* Top header */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-background/90 backdrop-blur-md border-b border-border flex items-center justify-between px-4">
        <Link
          href={user.is_admin ? "/admin" : "/dashboard"}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-bold">ம</span>
          </div>
          <span className="font-bold text-violet-700 dark:text-violet-400 text-xl tracking-tight">Mozhi</span>
        </Link>

        <div className="flex items-center gap-1.5">
          <span className="text-sm text-muted-foreground font-medium mr-1">{user.username}</span>
          <button
            onClick={toggle}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors text-muted-foreground"
            title={theme === "dark" ? "Switch to light" : "Switch to dark"}
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={handleLogout}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-500 transition-colors text-muted-foreground"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-background border-t border-border flex items-center justify-around px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-5 py-1 rounded-xl transition-all"
            >
              <div
                className={`p-2 rounded-xl transition-all ${
                  active
                    ? "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
              </div>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  active ? "text-violet-600" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
