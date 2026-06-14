"use client";
import { useState, useRef, useCallback } from "react";

interface RecorderState {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  durationMs: number;
  error: string | null;
}

export function useVoiceRecorder() {
  const [state, setState] = useState<RecorderState>({
    isRecording: false,
    audioBlob: null,
    audioUrl: null,
    durationMs: 0,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const durationMs = Date.now() - startTimeRef.current;
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setState((prev) => ({ ...prev, isRecording: false, audioBlob: blob, audioUrl: url, durationMs }));
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setState((prev) => ({ ...prev, isRecording: true, audioBlob: null, audioUrl: null, error: null }));
    } catch (err) {
      setState((prev) => ({ ...prev, error: "Microphone access denied" }));
    }
  }, []);

  const stop = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    setState({ isRecording: false, audioBlob: null, audioUrl: null, durationMs: 0, error: null });
  }, []);

  return { ...state, start, stop, reset };
}
