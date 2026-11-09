export interface ServiceRequest {
  id: number;
  specialisation_required: 'GENERAL' | 'MEDICAL' | 'LEGAL';
  status: 'CREATED' | 'PENDING' | 'OFFERED' | 'ASSIGNED' | 'CANCELLED' | 'FAILED';
  priority: 'NORMAL' | 'EMERGENCY';
  created_at: string;
  assigned_at: string | null;
  cancelled_at: string | null;
  interpreter: { name: string; languages: string } | null;
}

export async function fetchUserRequests(): Promise<ServiceRequest[]> {
  const response = await fetch('/api/v1/requests/', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch requests');
  }

  return response.json();
}
