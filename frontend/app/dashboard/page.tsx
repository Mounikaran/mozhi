"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mic, TrendingUp, Clock, DollarSign, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { useAuthStore } from "@/lib/store";
import { voiceApi } from "@/lib/api";
import { formatCost, formatDuration } from "@/lib/utils";
import type { Conversation } from "@/types";

export default function DashboardPage() {
  const { user, deviceApproved } = useAuthStore();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    voiceApi.listConversations(10, 0)
      .then((r) => setConversations(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, router]);

  if (!user) return null;

  const totalCost = conversations.reduce((s, c) => s + c.total_cost, 0);
  const totalDuration = conversations.reduce((s, c) => s + (c.duration_seconds || 0), 0);

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome back, {user.username}!</h1>
          <p className="text-muted-foreground mt-1">Continue your English learning journey</p>
        </div>

        {!deviceApproved && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Your device is pending approval. Some features may be limited until approved.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" /> Sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{conversations.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> Practice Time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatDuration(totalDuration)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4" /> API Cost
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCost(totalCost)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No practice sessions yet</p>
                  <Link href="/voice">
                    <Button>Start Practicing</Button>
                  </Link>
                </div>
              ) : (
                <ul className="divide-y">
                  {conversations.map((c) => (
                    <li key={c.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{c.topic || "General Practice"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString()} · {formatCost(c.total_cost)}
                        </p>
                        {c.skill_tags && c.skill_tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {c.skill_tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Start</CardTitle>
              <CardDescription>Begin a new practice session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Introduce yourself",
                "Describe your day",
                "Talk about your job",
                "Discuss a hobby",
                "Make a request politely",
              ].map((topic) => (
                <Link key={topic} href={`/voice?topic=${encodeURIComponent(topic)}`}>
                  <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                    <Mic className="h-3.5 w-3.5" />
                    {topic}
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
