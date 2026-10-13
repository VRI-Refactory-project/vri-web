export const interpreterApi: {
  getAvailability: () => Promise<any>;
  updateAvailability: (data: any) => Promise<any>;
  updateLiveStatus: (isLive: boolean) => Promise<any>;
}