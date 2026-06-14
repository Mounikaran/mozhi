"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Smartphone, DollarSign, Cpu, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { useRequireAuth } from "@/hooks/useRequireAuth";
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
  const { user, ready } = useRequireAuth({ requireAdmin: true });
  const [report, setReport] = useState<CostReport | null>(null);

  useEffect(() => {
    if (!ready) return;
    adminApi.costReport(30).then((r) => setReport(r.data)).catch(console.error);
  }, [ready]);

  if (!ready || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="px-4 pt-20 pb-24">
        <h1 className="text-2xl font-bold mb-1">Admin</h1>
        <p className="text-muted-foreground text-sm mb-6">Users, devices, pricing & models</p>

        {report && (
          <div className="grid grid-cols-2 gap-3 mb-6">
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

        <div className="grid grid-cols-2 gap-3">
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
