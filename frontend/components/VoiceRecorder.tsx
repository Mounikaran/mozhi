"use client";
import { useState } from "react";
import { Mic, MicOff, Loader2, Volume2, CheckCircle2, AlertCircle } from "lucide-react";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { voiceApi } from "@/lib/api";
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

  const handleStop = () => {
    recorder.stop();
  };

  const handleProcess = async () => {
    if (!recorder.audioBlob) return;
    setIsProcessing(true);
    setError(null);
    setTranscript(null);
    setFeedback(null);

    try {
      const sttForm = new FormData();
      sttForm.append("audio", recorder.audioBlob, "recording.webm");
      if (conversationId) sttForm.append("conversation_id", conversationId);

      const sttRes = await voiceApi.transcribe(sttForm);
      const text: string = sttRes.data.transcript;
      setTranscript(text);

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

  const scoreColor = (score: number) =>
    score >= 7 ? "from-emerald-500 to-teal-500" :
    score >= 5 ? "from-amber-400 to-orange-500" :
    "from-red-500 to-rose-500";

  return (
    <div className="space-y-4">
      {/* Mic button area */}
      <div className="flex flex-col items-center py-8">
        {/* Main mic button */}
        <button
          onClick={recorder.isRecording ? handleStop : recorder.start}
          disabled={isProcessing}
          className={`relative w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
            recorder.isRecording
              ? "bg-gradient-to-br from-red-500 to-rose-600 shadow-red-200 scale-110"
              : "bg-gradient-to-br from-violet-600 to-indigo-600 shadow-violet-200 hover:scale-105"
          } disabled:opacity-50 disabled:scale-100`}
        >
          {recorder.isRecording && (
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
          )}
          {isProcessing ? (
            <Loader2 className="h-10 w-10 text-white animate-spin" />
          ) : recorder.isRecording ? (
            <MicOff className="h-10 w-10 text-white" />
          ) : (
            <Mic className="h-10 w-10 text-white" />
          )}
        </button>

        <p className="mt-4 text-sm font-medium text-muted-foreground">
          {isProcessing
            ? "Analysing your speech…"
            : recorder.isRecording
            ? "Tap to stop"
            : recorder.audioBlob
            ? "Recording ready"
            : "Tap to speak"}
        </p>

        {/* Get feedback button */}
        {recorder.audioBlob && !recorder.isRecording && !isProcessing && (
          <button
            onClick={handleProcess}
            className="mt-5 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-2xl shadow-md shadow-violet-200 hover:shadow-lg transition-all"
          >
            Get Feedback
          </button>
        )}

        {/* Errors */}
        {(recorder.error || error) && (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/40 px-4 py-2.5 rounded-xl border border-red-100 dark:border-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {recorder.error || error}
          </div>
        )}
      </div>

      {/* Audio playback */}
      {recorder.audioUrl && !feedback && (
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Your recording
          </p>
          <audio controls src={recorder.audioUrl} className="w-full h-10" />
        </div>
      )}

      {/* Transcript */}
      {transcript && (
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            What you said
          </p>
          <p className="text-sm text-foreground leading-relaxed">{transcript}</p>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          {/* Score header */}
          <div
            className={`bg-gradient-to-r ${scoreColor(feedback.score)} px-5 py-4 flex items-center justify-between`}
          >
            <div>
              <p className="text-white/80 text-xs font-medium uppercase tracking-wide">Your Score</p>
              <p className="text-white text-3xl font-bold">
                {feedback.score}<span className="text-lg font-normal opacity-70">/10</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {feedback.score >= 7 && <CheckCircle2 className="h-8 w-8 text-white/80" />}
              <button
                onClick={handlePlayFeedback}
                disabled={playingAudio}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
                title="Listen to feedback"
              >
                <Volume2 className={`h-5 w-5 text-white ${playingAudio ? "animate-pulse" : ""}`} />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Tamil feedback */}
            <div className="bg-violet-50 dark:bg-violet-950/40 rounded-xl p-4">
              <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide mb-1.5">
                Feedback · Tamil
              </p>
              <p className="text-sm text-foreground leading-relaxed">{feedback.feedback_tamil}</p>
            </div>

            {/* English feedback */}
            <div className="bg-indigo-50 dark:bg-indigo-950/40 rounded-xl p-4">
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1.5">
                Feedback · English
              </p>
              <p className="text-sm text-foreground leading-relaxed">{feedback.feedback_english}</p>
            </div>

            {/* Corrected version */}
            {feedback.corrected_response && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Corrected version
                </p>
                <p className="text-sm bg-muted text-foreground p-3 rounded-xl leading-relaxed">
                  {feedback.corrected_response}
                </p>
              </div>
            )}

            {/* Alternatives */}
            {feedback.alternatives?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Alternative phrasings
                </p>
                <ul className="space-y-2">
                  {feedback.alternatives.map((alt, i) => (
                    <li
                      key={i}
                      className="text-sm pl-3 border-l-2 border-violet-400 text-foreground leading-relaxed"
                    >
                      {alt}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
