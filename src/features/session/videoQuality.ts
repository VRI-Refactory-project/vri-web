/** How good a person's connection to the call is, shown as bars on their tile. */
export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'lost' | 'unknown';

/** The video quality a person can choose for the call. */
export type VideoQualityChoice = 'auto' | 'high' | 'standard' | 'data_saver';

export interface QualityPreset {
  label: string;
  hint: string;
  /** How sharp the video you receive may be. */
  incoming: 'low' | 'medium' | 'high';
  /** The size and speed of the video you send. Signing needs smooth movement, so speed stays high. */
  outgoing: { width: number; height: number; frameRate: number };
}

export const QUALITY_ORDER: VideoQualityChoice[] = ['auto', 'high', 'standard', 'data_saver'];

export const QUALITY_PRESETS: Record<VideoQualityChoice, QualityPreset> = {
  auto: {
    label: 'Auto',
    hint: 'Adjusts to your connection',
    incoming: 'high',
    outgoing: { width: 1280, height: 720, frameRate: 30 },
  },
  high: {
    label: 'High',
    hint: 'Sharpest picture, uses the most data',
    incoming: 'high',
    outgoing: { width: 1920, height: 1080, frameRate: 30 },
  },
  standard: {
    label: 'Standard',
    hint: 'Clear and lighter on data',
    incoming: 'medium',
    outgoing: { width: 640, height: 360, frameRate: 30 },
  },
  data_saver: {
    label: 'Data saver',
    hint: 'Uses the least data',
    incoming: 'low',
    outgoing: { width: 480, height: 270, frameRate: 24 },
  },
};

/** How many of the three bars to fill for a connection quality. */
export function barsFor(quality: ConnectionQuality): number {
  if (quality === 'excellent') return 3;
  if (quality === 'good') return 2;
  if (quality === 'poor') return 1;
  return 0;
}
