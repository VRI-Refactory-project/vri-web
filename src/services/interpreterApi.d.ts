export const interpreterApi: {
  getAvailability: () => Promise<unknown>;
  updateAvailability: (data: unknown) => Promise<unknown>;
  updateLiveStatus: (isLive: boolean) => Promise<unknown>;
  getProfile?: () => Promise<unknown>;
  updateProfile?: (data: unknown) => Promise<unknown>;
};