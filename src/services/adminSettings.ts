// src/services/adminSettings.ts
import { api } from './api';

/* ---------- Profile ---------- */
export interface AdminProfile {
  name: string;
  email: string;
  phone: string;
}

interface ApiAdminProfile {
  full_name?: string;
  name?: string;
  email?: string;
  phone_number?: string;
  phone?: string;
}

export async function fetchAdminProfile(): Promise<AdminProfile> {
  const raw = await api<ApiAdminProfile>('/api/v1/administration/settings/');
  return {
    name: raw.full_name ?? raw.name ?? '',
    email: raw.email ?? '',
    phone: raw.phone_number ?? raw.phone ?? '',
  };
}

export async function updateAdminProfile(data: AdminProfile): Promise<AdminProfile> {
  const raw = await api<ApiAdminProfile>('/api/v1/administration/settings/', {
    method: 'PATCH',
    body: JSON.stringify({
      full_name: data.name,
      email: data.email,
      phone_number: data.phone,
    }),
  });
  return {
    name: raw.full_name ?? raw.name ?? data.name,
    email: raw.email ?? data.email,
    phone: raw.phone_number ?? raw.phone ?? data.phone,
  };
}

/* ---------- Password ---------- */
export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
}

export async function changeAdminPassword(data: PasswordChange): Promise<void> {
  await api('/api/v1/administration/change-password/', {
    method: 'POST',
    body: JSON.stringify({
      current_password: data.currentPassword,
      new_password: data.newPassword,
    }),
  });
}

/* ---------- Preferences ---------- */
export interface AdminPreferences {
  sessionAlerts: boolean;
  verificationAlerts: boolean;
  oneStepVerification: boolean;
}

interface ApiAdminPreferences {
  session_alerts?: boolean;
  verification_alerts?: boolean;
  one_step_verification?: boolean;
}

export async function fetchAdminPreferences(): Promise<AdminPreferences> {
  const raw = await api<ApiAdminPreferences>('/api/v1/administration/settings/');
  return {
    sessionAlerts: raw.session_alerts ?? true,
    verificationAlerts: raw.verification_alerts ?? true,
    oneStepVerification: raw.one_step_verification ?? true,
  };
}

export async function updateAdminPreferences(
  prefs: Partial<AdminPreferences>,
): Promise<AdminPreferences> {
  const body: Record<string, boolean> = {};
  if (prefs.sessionAlerts !== undefined) body.session_alerts = prefs.sessionAlerts;
  if (prefs.verificationAlerts !== undefined) body.verification_alerts = prefs.verificationAlerts;
  if (prefs.oneStepVerification !== undefined)
    body.one_step_verification = prefs.oneStepVerification;

  const raw = await api<ApiAdminPreferences>('/api/v1/administration/settings/', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

  return {
    sessionAlerts: raw.session_alerts ?? prefs.sessionAlerts ?? true,
    verificationAlerts: raw.verification_alerts ?? prefs.verificationAlerts ?? true,
    oneStepVerification: raw.one_step_verification ?? prefs.oneStepVerification ?? true,
  };
}
