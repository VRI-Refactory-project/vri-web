export type ParticipantRole = 'deaf' | 'interpreter' | 'hearing';

export interface Participant {
  id: string;
  name: string;
  role: ParticipantRole;
  /** The person looking at the screen. */
  self: boolean;
}

interface Args {
  viewerRole: 'deaf' | 'interpreter';
  viewerName?: string;
  /** The interpreter's name when the viewer is the Deaf user. */
  interpreterName?: string;
}

/**
 * Who is in the call, with the viewer first. The video itself is not connected yet: this is the
 * list the screens draw tiles from, and it is replaced by the signalling server's list (V2-011
 * backend) without changing the screens.
 */
export function buildParticipants({
  viewerRole,
  viewerName = 'You',
  interpreterName = 'Interpreter',
}: Args): Participant[] {
  const self: Participant = { id: 'self', name: viewerName, role: viewerRole, self: true };
  if (viewerRole === 'deaf') {
    return [
      self,
      { id: 'interpreter', name: interpreterName, role: 'interpreter', self: false },
      { id: 'hearing', name: 'Hearing participant', role: 'hearing', self: false },
    ];
  }
  return [
    self,
    { id: 'deaf', name: 'Deaf participant', role: 'deaf', self: false },
    { id: 'hearing', name: 'Hearing participant', role: 'hearing', self: false },
  ];
}

/** m:ss or h:mm:ss for a call length. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}
