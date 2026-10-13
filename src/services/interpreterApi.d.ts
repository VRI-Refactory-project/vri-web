
export type AvailabilityPayload = {
  weeklySchedule?: Array<{
    day: string;
    enabled?: boolean;
    available?: boolean;
    start?: string;
    startTime?: string;
    end?: string;
    endTime?: string;
  }>;
  exceptions?: Array<{
    id: string;
    date: string;
    unavailable: boolean;
    start?: string;
    end?: string;
    note?: string;
  }>;
  available?: boolean;
};

export const interpreterApi: {
  getDashboard: () => Promise<unknown>;
  getRequests: () => Promise<unknown>;
  getRequest: (id: string | number) => Promise<unknown>;
  acceptRequest: (id: string | number) => Promise<unknown>;
  declineRequest: (id: string | number) => Promise<unknown>;
  getAvailability: () => Promise<AvailabilityPayload>;
  updateAvailability: (payload: {
    weeklySchedule: Array<{
      day: string;
      enabled: boolean;
      start: string;
      end: string;
    }>;
    exceptions: AvailabilityPayload["exceptions"];
  }) => Promise<unknown>;
  updateLiveStatus: (available: boolean) => Promise<unknown>;
};
