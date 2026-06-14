"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, Pencil, Check, X } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { adminApi } from "@/lib/api";
import type { ApiPricing } from "@/types";

export default function AdminPricingPage() {
  const { ready } = useRequireAuth({ requireAdmin: true });
  const [rows, setRows] = useState<ApiPricing[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editCost, setEditCost] = useState("");

  useEffect(() => {
    if (!ready) return;
    adminApi.pricing.list().then((r) => setRows(r.data));
  }, [ready]);

  const startEdit = (row: ApiPricing) => {
    setEditId(row.id);
    setEditCost(String(row.cost));
  };

  const saveEdit = async (id: string) => {
    await adminApi.pricing.update(id, { cost: parseFloat(editCost) });
    setRows((r) => r.map((p) => p.id === id ? { ...p, cost: parseFloat(editCost) } : p));
    setEditId(null);
  };

  const toggleActive = async (row: ApiPricing) => {
    await adminApi.pricing.update(row.id, { is_active: !row.is_active });
    setRows((r) => r.map((p) => p.id === row.id ? { ...p, is_active: !row.is_active } : p));
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="px-4 pt-20 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <h1 className="text-2xl font-bold">API Pricing</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pricing Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-left">
                    <th className="py-2 pr-4">Provider</th>
                    <th className="py-2 pr-4">Model</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Cost (USD)</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 capitalize">{row.api_provider}</td>
                      <td className="py-2 pr-4">{row.model_name || "—"}</td>
                      <td className="py-2 pr-4 text-xs">{row.pricing_type}</td>
                      <td className="py-2 pr-4">
                        {editId === row.id ? (
                          <Input
                            className="h-7 w-32 text-xs"
                            value={editCost}
                            onChange={(e) => setEditCost(e.target.value)}
                            type="number"
                            step="any"
                          />
                        ) : (
                          <span className="font-mono">{row.cost.toExponential(4)}</span>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge
                          variant={row.is_active ? "success" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => toggleActive(row)}
                        >
                          {row.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <div className="flex gap-1">
                          {editId === row.id ? (
                            <>
                              <Button size="sm" variant="outline" onClick={() => saveEdit(row.id)}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => startEdit(row)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
