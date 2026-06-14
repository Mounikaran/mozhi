"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Mic, TrendingUp, Clock, Flame, ChevronRight, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { voiceApi } from "@/lib/api";
import { formatDuration } from "@/lib/utils";
import type { Conversation } from "@/types";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user, deviceApproved, ready } = useRequireAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    voiceApi.listConversations(10, 0)
      .then((r) => setConversations(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [ready]);

  if (!ready || !user) return null;

  const totalDuration = conversations.reduce((s, c) => s + (c.duration_seconds || 0), 0);
  const streak = conversations.length > 0 ? Math.min(conversations.length, 7) : 0;

  const quickTopics = [
    "Introduce yourself",
    "Describe your day",
    "Talk about your job",
    "Discuss a hobby",
    "Make a polite request",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="px-4 pt-20 pb-24">
        {/* Greeting */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground font-medium">{getGreeting()}</p>
          <h1 className="text-2xl font-bold text-foreground">{user.username} 👋</h1>
        </div>

        {/* Device approval warning */}
        {!deviceApproved && (
          <div className="mb-5 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Your device is pending approval. Some features may be limited.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 text-white">
            <TrendingUp className="h-4 w-4 mb-2 opacity-80" />
            <p className="text-2xl font-bold leading-none">{conversations.length}</p>
            <p className="text-xs opacity-80 mt-1">Sessions</p>
          </div>
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-4 text-white">
            <Clock className="h-4 w-4 mb-2 opacity-80" />
            <p className="text-2xl font-bold leading-none">{formatDuration(totalDuration)}</p>
            <p className="text-xs opacity-80 mt-1">Practiced</p>
          </div>
          <div className="bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl p-4 text-white">
            <Flame className="h-4 w-4 mb-2 opacity-80" />
            <p className="text-2xl font-bold leading-none">{streak}</p>
            <p className="text-xs opacity-80 mt-1">Streak</p>
          </div>
        </div>

        {/* Start Practice CTA */}
        <Link href="/voice">
          <div className="mb-6 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-5 flex items-center justify-between shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
            <div>
              <p className="text-white font-bold text-lg">Start Practicing</p>
              <p className="text-white/70 text-sm">Tap to begin a new session</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Mic className="h-6 w-6 text-white" />
            </div>
          </div>
        </Link>

        {/* Quick topics */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-foreground mb-3">Quick Topics</p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {quickTopics.map((topic) => (
              <Link key={topic} href={`/voice?topic=${encodeURIComponent(topic)}`} className="shrink-0">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border rounded-xl text-sm font-medium text-foreground whitespace-nowrap shadow-sm hover:border-violet-300 hover:text-violet-700 dark:hover:text-violet-400 transition-colors">
                  <Mic className="h-3.5 w-3.5 text-violet-500" />
                  {topic}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent sessions */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">Recent Sessions</p>
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-muted-foreground text-sm mb-4">No sessions yet — start speaking!</p>
                <Link href="/voice">
                  <button className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold">
                    Start Now
                  </button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {conversations.map((c) => (
                  <li key={c.id} className="flex items-center justify-between px-4 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {c.topic || "General Practice"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(c.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                        {c.duration_seconds ? ` · ${formatDuration(c.duration_seconds)}` : ""}
                      </p>
                      {c.skill_tags && c.skill_tags.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {c.skill_tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
