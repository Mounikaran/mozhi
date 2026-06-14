export interface User {
  id: string;
  email: string;
  username: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Device {
  id: string;
  user_id: string;
  fingerprint: string;
  device_name: string | null;
  device_type: string | null;
  browser_name: string | null;
  os_name: string | null;
  ip_address: string | null;
  is_approved: boolean;
  last_used_at: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  session_id: string;
  created_at: string;
  topic: string | null;
  skill_tags: string[] | null;
  total_cost: number;
  duration_seconds: number | null;
}

export interface ApiPricing {
  id: string;
  api_provider: string;
  model_name: string | null;
  pricing_type: string;
  cost: number;
  currency: string;
  effective_date: string;
  is_active: boolean;
  notes: string | null;
  updated_at: string;
}

export interface ApiModel {
  id: string;
  api_provider: string;
  model_name: string;
  model_version: string | null;
  endpoint_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeedbackResult {
  feedback_tamil: string;
  feedback_english: string;
  corrected_response: string;
  alternatives: string[];
  score: number;
  grammar_notes: string;
  vocabulary_notes: string;
  model_used: string;
  cost: number;
}

export interface CostReport {
  period_days: number;
  total_cost_usd: number;
  by_provider: Record<string, number>;
  total_calls: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
  device_approved: boolean;
}
