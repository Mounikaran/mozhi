"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { voiceApi } from "@/lib/api";
import type { Conversation, FeedbackResult } from "@/types";

function VoicePageInner() {
  const { user, ready } = useRequireAuth();
  const searchParams = useSearchParams();
  const [topic, setTopic] = useState(searchParams.get("topic") || "");
  const [topicInput, setTopicInput] = useState(searchParams.get("topic") || "");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [history, setHistory] = useState<FeedbackResult[]>([]);
  const [starting, setStarting] = useState(false);

  const startConversation = async () => {
    setStarting(true);
    try {
      const res = await voiceApi.createConversation({
        session_id: sessionId,
        topic: topicInput || undefined,
        skill_tags: [],
      });
      setTopic(topicInput);
      setConversation(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setStarting(false);
    }
  };

  const handleFeedback = (feedback: FeedbackResult) => {
    setHistory((prev) => [feedback, ...prev]);
  };

  if (!ready || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="px-4 pt-20 pb-24">
        {!conversation ? (
          /* Session start screen */
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-5 shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1">New Session</h1>
            <p className="text-muted-foreground text-sm mb-8 max-w-xs">
              Choose a topic or jump straight in — Mozhi will guide you
            </p>

            <div className="w-full max-w-xs space-y-3">
              <input
                type="text"
                placeholder="Topic (optional)"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && startConversation()}
                className="w-full h-12 px-4 rounded-2xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition"
              />
              <button
                onClick={startConversation}
                disabled={starting}
                className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-violet-200 dark:shadow-violet-900/30 transition-all disabled:opacity-60"
              >
                {starting ? "Starting…" : "Begin Session"}
              </button>
            </div>
          </div>
        ) : (
          /* Active session */
          <div className="space-y-4">
            {topic && (
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded-full text-sm font-medium">
                  <Sparkles className="h-3.5 w-3.5" />
                  {topic}
                </span>
                {history.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {history.length} {history.length === 1 ? "response" : "responses"}
                  </span>
                )}
              </div>
            )}
            <VoiceRecorder
              conversationId={conversation.id}
              topic={topic || undefined}
              onFeedback={handleFeedback}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default function VoicePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <VoicePageInner />
    </Suspense>
  );
}
