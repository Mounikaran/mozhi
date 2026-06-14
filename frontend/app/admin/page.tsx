"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Smartphone, DollarSign, Cpu, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { useAuthStore } from "@/lib/store";
import { adminApi } from "@/lib/api";
import { formatCost } from "@/lib/utils";
import type { CostReport } from "@/types";

const adminSections = [
  { title: "Users", description: "Manage user accounts", href: "/admin/users", icon: Users },
  { title: "Devices", description: "Approve or revoke devices", href: "/admin/devices", icon: Smartphone },
  { title: "API Pricing", description: "Update cost configuration", href: "/admin/pricing", icon: DollarSign },
  { title: "API Models", description: "Manage AI model endpoints", href: "/admin/models", icon: Cpu },
];

export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [report, setReport] = useState<CostReport | null>(null);

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    if (!user.is_admin) { router.replace("/dashboard"); return; }
    adminApi.costReport(30).then((r) => setReport(r.data)).catch(console.error);
  }, [user, router]);

  if (!user?.is_admin) return null;

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground mb-8">Manage users, devices, pricing, and AI model configuration</p>

        {report && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Total Cost (30d)</p>
                <p className="text-xl font-bold">{formatCost(report.total_cost_usd)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">API Calls (30d)</p>
                <p className="text-xl font-bold">{report.total_calls}</p>
              </CardContent>
            </Card>
            {Object.entries(report.by_provider).map(([provider, cost]) => (
              <Card key={provider}>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground capitalize">{provider.replace("_", " ")}</p>
                  <p className="text-xl font-bold">{formatCost(cost)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {adminSections.map(({ title, description, href, icon: Icon }) => (
            <Link key={href} href={href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-primary" />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-base mt-2">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
