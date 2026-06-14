"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Check, X } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { useAuthStore } from "@/lib/store";
import { adminApi } from "@/lib/api";
import type { ApiModel } from "@/types";

export default function AdminModelsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [models, setModels] = useState<ApiModel[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<ApiModel>>({});

  useEffect(() => {
    if (!user?.is_admin) { router.replace("/dashboard"); return; }
    adminApi.models.list().then((r) => setModels(r.data));
  }, [user, router]);

  const startEdit = (m: ApiModel) => {
    setEditId(m.id);
    setEditData({ endpoint_url: m.endpoint_url || "", model_version: m.model_version || "" });
  };

  const saveEdit = async (id: string) => {
    await adminApi.models.update(id, editData);
    setModels((ms) => ms.map((m) => m.id === id ? { ...m, ...editData } : m));
    setEditId(null);
  };

  const toggleActive = async (m: ApiModel) => {
    await adminApi.models.update(m.id, { is_active: !m.is_active });
    setModels((ms) => ms.map((mod) => mod.id === m.id ? { ...mod, is_active: !m.is_active } : mod));
  };

  if (!user?.is_admin) return null;

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <h1 className="text-2xl font-bold">API Models</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configured Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-left">
                    <th className="py-2 pr-4">Provider</th>
                    <th className="py-2 pr-4">Model Name</th>
                    <th className="py-2 pr-4">Version</th>
                    <th className="py-2 pr-4">Endpoint</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m) => (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 capitalize">{m.api_provider}</td>
                      <td className="py-2 pr-4 font-mono text-xs">{m.model_name}</td>
                      <td className="py-2 pr-4">
                        {editId === m.id ? (
                          <Input
                            className="h-7 w-20 text-xs"
                            value={editData.model_version || ""}
                            onChange={(e) => setEditData((d) => ({ ...d, model_version: e.target.value }))}
                          />
                        ) : (
                          m.model_version || "—"
                        )}
                      </td>
                      <td className="py-2 pr-4 max-w-xs">
                        {editId === m.id ? (
                          <Input
                            className="h-7 text-xs"
                            value={editData.endpoint_url || ""}
                            onChange={(e) => setEditData((d) => ({ ...d, endpoint_url: e.target.value }))}
                          />
                        ) : (
                          <span className="text-xs truncate block max-w-[200px]" title={m.endpoint_url || ""}>
                            {m.endpoint_url || "—"}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge
                          variant={m.is_active ? "success" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => toggleActive(m)}
                        >
                          {m.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <div className="flex gap-1">
                          {editId === m.id ? (
                            <>
                              <Button size="sm" variant="outline" onClick={() => saveEdit(m.id)}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => startEdit(m)}>
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
