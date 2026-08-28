import { apiUrl } from "./api";

export type EmergencyAlert = {
  id: number;
  call_reference_id: string;
  emergency_number: string;
  call_status: "MISSED" | "ANSWERED" | string;
  priority: "CRITICAL" | "HIGH" | "NORMAL" | string;
  caller_reference: string | null;
  location: string | null;
  call_time: string;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  assigned_officer: string | null;
  incident_id: string | null;
  created_at: string;
};

export type EmergencySummary = {
  critical_alerts: number;
  unacknowledged: number;
  acknowledged: number;
  todays_calls: number;
};

export async function getEmergencySummary(): Promise<EmergencySummary> {
  const res = await fetch(apiUrl("/api/v1/emergency/summary"));
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
}

export async function getEmergencyAlerts(): Promise<EmergencyAlert[]> {
  const res = await fetch(apiUrl("/api/v1/emergency/alerts"));
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

export async function acknowledgeAlert(alertId: number, username: string): Promise<EmergencyAlert> {
  const res = await fetch(apiUrl(`/api/v1/emergency/alerts/${alertId}/acknowledge`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ acknowledged_by: username }),
  });
  if (!res.ok) throw new Error("Failed to acknowledge alert");
  return res.json();
}

export async function generateTestCall(type: string): Promise<any> {
  const res = await fetch(apiUrl(`/api/v1/emergency/test-call?type=${type}`), {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to generate test call");
  return res.json();
}
