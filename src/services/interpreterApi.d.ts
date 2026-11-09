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

/** Some one-off dates could not be saved or removed. The weekly hours were already saved. */
export class AvailabilitySaveError extends Error {
  savedCount: number;
  failedDates: string[];
  failedRemovals: string[];
  constructor(init: { savedCount: number; failedDates: string[]; failedRemovals: string[] });
}

export const interpreterApi: {
  getAvailability: () => Promise<AvailabilityData>;
  updateAvailability: (
    data: Pick<AvailabilityData, 'weeklySchedule' | 'exceptions'>,
  ) => Promise<void>;
  updateLiveStatus: (available: boolean) => Promise<unknown>;
};
