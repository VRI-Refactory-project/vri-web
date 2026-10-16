export interface WeeklyScheduleItem {
  day: string;
  enabled: boolean;
  start?: string;
  end?: string;
}

export interface AvailabilityException {
  id: string;
  date: string;
  unavailable: boolean;
  start?: string;
  end?: string;
  note?: string;
}

export interface AvailabilityData {
  weeklySchedule: WeeklyScheduleItem[];
  exceptions: AvailabilityException[];
  available: boolean;
}

export const interpreterApi: {
  getAvailability: () => Promise<AvailabilityData>;
  updateAvailability: (
    data: Pick<AvailabilityData, 'weeklySchedule' | 'exceptions'>,
  ) => Promise<void>;
  updateLiveStatus: (available: boolean) => Promise<unknown>;
};
