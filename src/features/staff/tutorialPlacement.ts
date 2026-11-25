/** Where the staff tutorial highlights things and puts its card (V2-065). */

/** Space between the highlighted part of the screen and its outline. */
export const PAD = 6;
/** Space between the highlighted part and the card, and between the card and the window's edge. */
const GAP = 16;

export interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Where the part of the screen a step points at is, or null when it is not on screen (phones). */
export function findTarget(target: string | null): Box | null {
  if (!target) return null;
  const element = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  const visible =
    rect.width > 0 &&
    rect.height > 0 &&
    rect.right > 0 &&
    rect.left < window.innerWidth &&
    rect.bottom > 0 &&
    rect.top < window.innerHeight;
  return visible
    ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
    : null;
}

/**
 * Where the card goes so all of it is on screen: to the right of the highlighted part, else below
 * it, else above it. Null when none fits, and the card then sits in the middle of the window.
 */
export function placeCard(box: Box, card: { width: number; height: number }) {
  const { innerWidth: w, innerHeight: h } = window;
  const fitsTop = (top: number) => Math.min(Math.max(GAP, top), h - card.height - GAP);
  const fitsLeft = (left: number) => Math.min(Math.max(GAP, left), w - card.width - GAP);

  if (box.left + box.width + GAP + card.width + GAP <= w && card.height + GAP * 2 <= h) {
    return { top: fitsTop(box.top), left: box.left + box.width + GAP };
  }
  if (box.top + box.height + GAP + card.height + GAP <= h) {
    return { top: box.top + box.height + GAP, left: fitsLeft(box.left) };
  }
  if (box.top - GAP - card.height >= GAP) {
    return { top: box.top - GAP - card.height, left: fitsLeft(box.left) };
  }
  return null;
}
