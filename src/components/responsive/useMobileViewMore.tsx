import { useState } from 'react';

const INITIAL_MOBILE_ROWS = 5;

/** Keeps desktop lists complete and reveals additional records on mobile on demand. */
export function useMobileViewMore(itemCount: number, resetKey = String(itemCount)) {
  const [expandedState, setExpandedState] = useState({ resetKey, expanded: false });
  const expanded = expandedState.resetKey === resetKey && expandedState.expanded;

  return {
    itemProps: (index: number) =>
      index >= INITIAL_MOBILE_ROWS && !expanded
        ? { 'data-mobile-view-hidden': 'true' as const }
        : {},
    button:
      itemCount > INITIAL_MOBILE_ROWS ? (
        <button
          type="button"
          className="mobile-view-more-button"
          aria-expanded={expanded}
          onClick={() => setExpandedState({ resetKey, expanded: !expanded })}
        >
          {expanded ? 'Show less' : 'View more'}
        </button>
      ) : null,
  };
}
