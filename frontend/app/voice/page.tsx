"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { useAuthStore } from "@/lib/store";
import { voiceApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Conversation, FeedbackResult } from "@/types";

function VoicePageInner() {
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [topic, setTopic] = useState(searchParams.get("topic") || "");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [history, setHistory] = useState<FeedbackResult[]>([]);

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  const startConversation = async () => {
    try {
      const res = await voiceApi.createConversation({
        session_id: sessionId,
        topic: topic || undefined,
        skill_tags: [],
      });
      setConversation(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFeedback = (feedback: FeedbackResult) => {
    setHistory((prev) => [feedback, ...prev]);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-2">Practice Session</h1>
        <p className="text-muted-foreground mb-6">Speak in English and get AI-powered feedback in Tamil and English</p>

        {!conversation ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Choose a topic (optional)"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
              <Button onClick={startConversation}>Start Session</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <VoiceRecorder
              conversationId={conversation.id}
              topic={conversation.topic || undefined}
              onFeedback={handleFeedback}
            />
            {history.length > 1 && (
              <div className="text-xs text-muted-foreground text-right">
                {history.length} responses this session
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function VoicePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted/20" />}>
      <VoicePageInner />
    </Suspense>
  );
}
