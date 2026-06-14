"use client";
import { useState } from "react";
import { Mic, MicOff, Loader2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { voiceApi } from "@/lib/api";
import { formatCost } from "@/lib/utils";
import type { FeedbackResult } from "@/types";

interface Props {
  conversationId?: string;
  topic?: string;
  onFeedback?: (feedback: FeedbackResult) => void;
}

export function VoiceRecorder({ conversationId, topic, onFeedback }: Props) {
  const recorder = useVoiceRecorder();
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStop = async () => {
    recorder.stop();
  };

  const handleProcess = async () => {
    if (!recorder.audioBlob) return;
    setIsProcessing(true);
    setError(null);

    try {
      // STT
      const sttForm = new FormData();
      sttForm.append("audio", recorder.audioBlob, "recording.webm");
      if (conversationId) sttForm.append("conversation_id", conversationId);

      const sttRes = await voiceApi.transcribe(sttForm);
      const text: string = sttRes.data.transcript;
      setTranscript(text);

      // Gemini feedback
      const fbForm = new FormData();
      fbForm.append("transcription", text);
      if (conversationId) fbForm.append("conversation_id", conversationId);
      if (topic) fbForm.append("topic", topic);

      const fbRes = await voiceApi.generateFeedback(fbForm);
      setFeedback(fbRes.data);
      onFeedback?.(fbRes.data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err.response?.data?.detail || "Processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlayFeedback = async () => {
    if (!feedback?.feedback_tamil) return;
    setPlayingAudio(true);
    try {
      const form = new FormData();
      form.append("text", feedback.feedback_tamil);
      if (conversationId) form.append("conversation_id", conversationId);

      const res = await voiceApi.speak(form);
      const blob = new Blob([res.data as ArrayBuffer], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => {
        setPlayingAudio(false);
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch {
      setPlayingAudio(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {topic && <span className="text-base font-normal text-muted-foreground">Topic: {topic}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            {!recorder.isRecording ? (
              <Button
                onClick={recorder.start}
                disabled={isProcessing}
                className="gap-2 bg-red-500 hover:bg-red-600"
              >
                <Mic className="h-4 w-4" />
                Start Recording
              </Button>
            ) : (
              <Button onClick={handleStop} variant="outline" className="gap-2 animate-pulse">
                <MicOff className="h-4 w-4" />
                Stop Recording
              </Button>
            )}

            {recorder.audioBlob && !recorder.isRecording && (
              <Button onClick={handleProcess} disabled={isProcessing} className="gap-2">
                {isProcessing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  "Get Feedback"
                )}
              </Button>
            )}
          </div>

          {recorder.audioUrl && (
            <audio controls src={recorder.audioUrl} className="w-full" />
          )}

          {recorder.error && (
            <p className="text-sm text-destructive">{recorder.error}</p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {transcript && (
        <Card>
          <CardHeader><CardTitle className="text-base">Your Response (Transcribed)</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm">{transcript}</p>
          </CardContent>
        </Card>
      )}

      {feedback && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Feedback</span>
              <div className="flex items-center gap-2">
                <Badge variant={feedback.score >= 7 ? "success" : feedback.score >= 5 ? "warning" : "destructive"}>
                  Score: {feedback.score}/10
                </Badge>
                <Button variant="ghost" size="icon" onClick={handlePlayFeedback} disabled={playingAudio}>
                  <Volume2 className={`h-4 w-4 ${playingAudio ? "text-primary animate-pulse" : ""}`} />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Feedback (Tamil)</p>
              <p className="text-sm">{feedback.feedback_tamil}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Feedback (English)</p>
              <p className="text-sm">{feedback.feedback_english}</p>
            </div>
            {feedback.corrected_response && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Corrected Version</p>
                <p className="text-sm bg-muted p-2 rounded">{feedback.corrected_response}</p>
              </div>
            )}
            {feedback.alternatives?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Alternative Phrasings</p>
                <ul className="text-sm space-y-1">
                  {feedback.alternatives.map((alt, i) => (
                    <li key={i} className="pl-3 border-l-2 border-primary">{alt}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Cost: {formatCost(feedback.cost)} · Model: {feedback.model_used}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
