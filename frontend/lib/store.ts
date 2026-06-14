import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
  _hasHydrated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  deviceApproved: boolean;
  setHasHydrated: (v: boolean) => void;
  setAuth: (user: User, token: string, refreshToken: string, deviceApproved: boolean) => void;
  updateToken: (token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      _hasHydrated: false,
      user: null,
      token: null,
      refreshToken: null,
      deviceApproved: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      setAuth: (user, token, refreshToken, deviceApproved) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", token);
          localStorage.setItem("refresh_token", refreshToken);
        }
        set({ user, token, refreshToken, deviceApproved });
      },
      updateToken: (token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", token);
        }
        set({ token });
      },
      clearAuth: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
        set({ user: null, token: null, refreshToken: null, deviceApproved: false });
      },
    }),
    {
      name: "auth-storage",
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        refreshToken: s.refreshToken,
        deviceApproved: s.deviceApproved,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
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
