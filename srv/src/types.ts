/**
 * Shared type definitions for the Adaptive Voice-to-Form Engine.
 */

export interface FormUpdateEvent {
  type: "form_update";
  field: string;
  value: string | number | boolean;
  sessionId: string;
}

export interface SystemStatusEvent {
  type: "status";
  message: string;
  sessionId?: string;
}

export interface GlossaryEntry {
  term: string;
  simpleExplanation: string;
  example?: string;
}

export type AgriSubsidyForm = Record<string, any>;

export interface UserProfile {
  userId: string;
  form: Partial<AgriSubsidyForm>;
  createdAt: string;
  updatedAt: string;
}
