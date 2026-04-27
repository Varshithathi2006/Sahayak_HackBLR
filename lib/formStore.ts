import type { AgriSubsidyForm, FormFieldKey } from "./types";
import { create } from "zustand";

interface FormStore {
  form: Record<string, string | number | boolean | null>;
  skippedFields: Set<string>;
  callActive: boolean;
  sessionId: string;
  transcript: TranscriptLine[];
  returningUser: ReturnUserInfo | null;
  error: string | null;
  rawError: unknown | null;
  selectedLanguage: string;
  activeSchema: unknown | null;

  vapiCallId: string | null;
  sseStatus: "connecting" | "connected" | "disconnected";
  
  // Actions
  updateField: (field: string, value: string | number | boolean) => void;
  skipFields: (fields: string[]) => void;
  setCallActive: (active: boolean) => void;
  setVapiCallId: (id: string | null) => void;
  setSessionId: (id: string) => void;
  setSSEStatus: (status: "connecting" | "connected" | "disconnected") => void;
  appendTranscript: (line: TranscriptLine) => void;
  updateLatestTranscript: (line: TranscriptLine) => void;
  setReturningUser: (info: ReturnUserInfo | null) => void;
  setError: (error: string | null) => void;
  setRawError: (rawError: unknown | null) => void;
  setLanguage: (lang: string) => void;
  setSchema: (schema: unknown) => void;
  resetForm: () => void;
}

export interface TranscriptLine {
  id: string;
  role: "assistant" | "user";
  text: string;
  timestamp: number;
}

export interface ReturnUserInfo {
  userId: string;
  form: Partial<AgriSubsidyForm>;
  updatedAt: string;
}

const BUSINESS_FIELDS: FormFieldKey[] = ["businessName", "businessType", "businessIncome"];

export const useFormStore = create<FormStore>((set) => ({
  form: {},
  skippedFields: new Set(),
  callActive: false,
  sessionId: generateSessionId(),
  vapiCallId: null,
  sseStatus: "connecting",
  transcript: [],
  returningUser: null,
  error: null,
  rawError: null,
  selectedLanguage: "en-IN",
  activeSchema: null,

  updateField: (field, value) =>
    set((state) => {
      console.log(`💎 Store Updating: [${field}] -> [${value}]`);
      const updatedForm = { ...state.form, [field]: value };
      return { form: updatedForm };
    }),

  skipFields: (fields) =>
    set((state) => {
      const updatedSkipped = new Set(state.skippedFields);
      fields.forEach((f) => updatedSkipped.add(f));
      return { skippedFields: updatedSkipped };
    }),

  setCallActive: (active) => set({ callActive: active }),
  setVapiCallId: (id) => set({ vapiCallId: id }),
  setSessionId: (id) => set({ sessionId: id }),
  setSSEStatus: (status) => set({ sseStatus: status }),

  appendTranscript: (line) =>
    set((state) => ({
      transcript: [...state.transcript.slice(-99), line],
    })),

  updateLatestTranscript: (line) =>
    set((state) => {
      const existingIndex = state.transcript.findLastIndex((t) => t.id === line.id);
      
      if (existingIndex !== -1) {
        const updated = [...state.transcript];
        updated[existingIndex] = line;
        return { transcript: updated };
      }
      
      // If it doesn't exist, append it
      return { transcript: [...state.transcript.slice(-99), line] };
    }),

  setReturningUser: (info) => set({ returningUser: info }),
  setError: (error) => set({ error }),
  setRawError: (rawError) => set({ rawError }),
  setLanguage: (lang) => set({ selectedLanguage: lang }),
  setSchema: (schema) => set({ activeSchema: schema }),

  resetForm: () =>
    set({
      form: {},
      skippedFields: new Set(),
      transcript: [],
      returningUser: null,
      error: null,
      rawError: null,
      // NOTE: Do NOT regenerate sessionId here.
      // The SSE connection is bound to the current sessionId.
      // Regenerating it would orphan the SSE stream and break live updates.
    }),
}));

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
