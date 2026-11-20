import type { CallRole } from './callConnection';

/** What the spotlight needs to know about a tile. */
export interface SpotlightTile {
  id: string;
  role?: CallRole;
  /** A shared screen rather than a person. */
  screen?: boolean;
  /** The viewer's own camera. */
  self?: boolean;
}

/**
 * Who the viewer most needs to see. The interpreter watches the person signing: the Deaf user, or
 * the staff member whose Deaf client is sitting with them. Everyone else (the Deaf user, staff, a
 * hearing guest) watches the interpreter.
 */
function wantedRoles(viewer: CallRole | undefined): CallRole[] {
  return viewer === 'interpreter' ? ['deaf', 'institution'] : ['interpreter'];
}

/**
 * Which tile is the big one on this viewer's screen. Each person's screen decides for itself and
 * tells nobody, so pinning someone changes only your own view.
 *
 * 1. The tile the viewer pinned, while it is still in the call.
 * 2. A shared screen.
 * 3. The person the viewer most needs to see (see wantedRoles).
 * 4. Anyone else in the call.
 * 5. The viewer, when they are alone.
 *
 * It does not follow whoever is talking, as Google Meet does: signing makes no sound, so that
 * would rarely pick the Deaf user.
 */
export function pickSpotlight(
  tiles: SpotlightTile[],
  pinned: string | null,
  viewer: CallRole | undefined,
): string | undefined {
  if (pinned && tiles.some((tile) => tile.id === pinned)) return pinned;

  const shared = tiles.find((tile) => tile.screen);
  if (shared) return shared.id;

  const people = tiles.filter((tile) => !tile.self && !tile.screen);
  for (const role of wantedRoles(viewer)) {
    const wanted = people.find((tile) => tile.role === role);
    if (wanted) return wanted.id;
  }
  return (people[0] ?? tiles[0])?.id;
}
