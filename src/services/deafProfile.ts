// src/services/deafProfile.ts
import { api } from './api';

export interface MyProfile {
  firstName: string;
  lastName: string;
  preferredName: string;
  email: string;
  phone: string;
  location: string;
  photoUrl: string | null;
  languages: string[];
  emergencyName: string;
  emergencyPhone: string;
  emailNotifications: boolean;
  chatAlerts: boolean;
  flashAlerts: boolean;
  publicProfile: boolean;
}

interface ApiMe {
  full_name?: string;
  name?: string;
  preferred_name?: string;
  email?: string;
  phone_number?: string;
  phone?: string;
  location?: string;
  profile_photo?: string | null;
  photo?: string | null;
  languages?: string[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  email_notifications?: boolean;
  chat_alerts?: boolean;
  flash_alerts?: boolean;
  public_profile?: boolean;
}

export async function fetchMyProfile(): Promise<MyProfile> {
  const raw = await api<ApiMe>('/api/v1/accounts/me/');
  const fullName = raw.full_name ?? raw.name ?? '';
  const [first = '', ...rest] = fullName.split(' ');
  const last = rest.join(' ');
  return {
    firstName: first,
    lastName: last,
    preferredName: raw.preferred_name ?? first,
    email: raw.email ?? '',
    phone: raw.phone_number ?? raw.phone ?? '',
    location: raw.location ?? '',
    photoUrl: raw.profile_photo ?? raw.photo ?? null,
    languages: raw.languages ?? [],
    emergencyName: raw.emergency_contact_name ?? '',
    emergencyPhone: raw.emergency_contact_phone ?? '',
    emailNotifications: raw.email_notifications ?? true,
    chatAlerts: raw.chat_alerts ?? true,
    flashAlerts: raw.flash_alerts ?? true,
    publicProfile: raw.public_profile ?? false,
  };
}

export async function updateMyProfile(data: MyProfile): Promise<MyProfile> {
  const payload = {
    full_name: `${data.firstName} ${data.lastName}`.trim(),
    preferred_name: data.preferredName,
    email: data.email,
    phone_number: data.phone,
    location: data.location,
    languages: data.languages,
    emergency_contact_name: data.emergencyName,
    emergency_contact_phone: data.emergencyPhone,
    email_notifications: data.emailNotifications,
    chat_alerts: data.chatAlerts,
    flash_alerts: data.flashAlerts,
    public_profile: data.publicProfile,
  };

  const raw = await api<ApiMe>('/api/v1/accounts/me/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  const fullName = raw.full_name ?? raw.name ?? payload.full_name;
  const [first = '', ...rest] = fullName.split(' ');
  const last = rest.join(' ');
  return {
    firstName: first,
    lastName: last,
    preferredName: raw.preferred_name ?? data.preferredName,
    email: raw.email ?? data.email,
    phone: raw.phone_number ?? raw.phone ?? data.phone,
    location: raw.location ?? data.location,
    photoUrl: raw.profile_photo ?? raw.photo ?? data.photoUrl,
    languages: raw.languages ?? data.languages,
    emergencyName: raw.emergency_contact_name ?? data.emergencyName,
    emergencyPhone: raw.emergency_contact_phone ?? data.emergencyPhone,
    emailNotifications: raw.email_notifications ?? data.emailNotifications,
    chatAlerts: raw.chat_alerts ?? data.chatAlerts,
    flashAlerts: raw.flash_alerts ?? data.flashAlerts,
    publicProfile: raw.public_profile ?? data.publicProfile,
  };
}

export async function uploadProfilePhoto(file: File): Promise<string | null> {
  const form = new FormData();
  form.append('photo', file);

  const raw = await api<{ profile_photo?: string; photo?: string; url?: string }>(
    '/api/v1/accounts/me/photo/',
    { method: 'POST', body: form },
  );

  return raw.profile_photo ?? raw.photo ?? raw.url ?? null;
}

export async function removeProfilePhoto(): Promise<void> {
  await api('/api/v1/accounts/me/photo/', { method: 'DELETE' });
}
