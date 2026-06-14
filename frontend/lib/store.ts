import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  deviceApproved: boolean;
  setAuth: (user: User, token: string, deviceApproved: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      deviceApproved: false,
      setAuth: (user, token, deviceApproved) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", token);
        }
        set({ user, token, deviceApproved });
      },
      clearAuth: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
        }
        set({ user: null, token: null, deviceApproved: false });
      },
    }),
    { name: "auth-storage", partialize: (s) => ({ user: s.user, token: s.token, deviceApproved: s.deviceApproved }) }
  )
);

interface VoiceState {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string | null;
  feedback: object | null;
  currentConversationId: string | null;
  setRecording: (v: boolean) => void;
  setProcessing: (v: boolean) => void;
  setTranscript: (t: string | null) => void;
  setFeedback: (f: object | null) => void;
  setConversationId: (id: string | null) => void;
  reset: () => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  isRecording: false,
  isProcessing: false,
  transcript: null,
  feedback: null,
  currentConversationId: null,
  setRecording: (v) => set({ isRecording: v }),
  setProcessing: (v) => set({ isProcessing: v }),
  setTranscript: (t) => set({ transcript: t }),
  setFeedback: (f) => set({ feedback: f }),
  setConversationId: (id) => set({ currentConversationId: id }),
  reset: () => set({ isRecording: false, isProcessing: false, transcript: null, feedback: null }),
}));
