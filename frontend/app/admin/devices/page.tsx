"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { useAuthStore } from "@/lib/store";
import { adminApi } from "@/lib/api";
import type { Device } from "@/types";

export default function AdminDevicesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.is_admin) { router.replace("/dashboard"); return; }
    adminApi.devices.list()
      .then((r) => setDevices(r.data))
      .finally(() => setLoading(false));
  }, [user, router]);

  const approve = async (id: string) => {
    setActionId(id);
    await adminApi.devices.approve(id);
    setDevices((d) => d.map((dev) => dev.id === id ? { ...dev, is_approved: true } : dev));
    setActionId(null);
  };

  const revoke = async (id: string) => {
    setActionId(id);
    await adminApi.devices.revoke(id);
    setDevices((d) => d.filter((dev) => dev.id !== id));
    setActionId(null);
  };

  if (!user?.is_admin) return null;

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <h1 className="text-2xl font-bold">Device Management</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Devices ({devices.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : devices.length === 0 ? (
              <p className="text-muted-foreground text-sm">No devices found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      <th className="py-2 pr-4">Device</th>
                      <th className="py-2 pr-4">Browser / OS</th>
                      <th className="py-2 pr-4">IP</th>
                      <th className="py-2 pr-4">Last Used</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((dev) => (
                      <tr key={dev.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">
                          <p className="font-medium">{dev.device_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{dev.device_type || "—"}</p>
                        </td>
                        <td className="py-2 pr-4 text-xs">
                          {dev.browser_name || "—"} / {dev.os_name || "—"}
                        </td>
                        <td className="py-2 pr-4 text-xs">{dev.ip_address || "—"}</td>
                        <td className="py-2 pr-4 text-xs">
                          {dev.last_used_at ? new Date(dev.last_used_at).toLocaleDateString() : "Never"}
                        </td>
                        <td className="py-2 pr-4">
                          <Badge variant={dev.is_approved ? "success" : "warning"}>
                            {dev.is_approved ? "Approved" : "Pending"}
                          </Badge>
                        </td>
                        <td className="py-2">
                          <div className="flex gap-2">
                            {!dev.is_approved && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => approve(dev.id)}
                                disabled={actionId === dev.id}
                              >
                                {actionId === dev.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => revoke(dev.id)}
                              disabled={actionId === dev.id}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
