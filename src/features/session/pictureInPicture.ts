import { useCallback, useEffect, useRef, useState } from 'react';

/** Chrome and Edge's Document Picture-in-Picture: a small always-on-top window the page draws in. */
interface DocumentPictureInPicture {
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
  readonly window: Window | null;
}

declare global {
  interface Window {
    documentPictureInPicture?: DocumentPictureInPicture;
  }
}

/**
 * What this browser can float above other tabs and apps:
 * - 'window': a small window with the call and its buttons (Chrome, Edge);
 * - 'video': only the video itself (Safari);
 * - null: nothing (Firefox has no way for a page to ask), so the button is hidden.
 */
export type PipKind = 'window' | 'video' | null;

export function pipKind(): PipKind {
  if (window.documentPictureInPicture) return 'window';
  if (document.pictureInPictureEnabled) return 'video';
  return null;
}

/** The floating window starts empty: give it the page's styles so the call looks the same. */
function copyStyles(target: Document) {
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const style = target.createElement('style');
      style.textContent = Array.from(sheet.cssRules)
        .map((rule) => rule.cssText)
        .join('\n');
      target.head.appendChild(style);
    } catch {
      // A stylesheet from another site cannot be read: link to it instead.
      if (sheet.href) {
        const link = target.createElement('link');
        link.rel = 'stylesheet';
        link.href = sheet.href;
        target.head.appendChild(link);
      }
    }
  }
  target.body.className = 'pip-body';
}

/**
 * Keeps the call on top while the person works in other tabs, as Google Meet does.
 *
 * `videoToFloat` gives the video to float where only a video can be floated (Safari).
 * Where the browser allows it (Chrome), the window also opens by itself when the person switches
 * to another tab.
 */
export function usePictureInPicture(videoToFloat: () => HTMLVideoElement | null) {
  const [kind] = useState<PipKind>(pipKind);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const videoRef = useRef(videoToFloat);
  useEffect(() => {
    videoRef.current = videoToFloat;
  });

  const open = useCallback(async () => {
    try {
      if (kind === 'window') {
        const api = window.documentPictureInPicture!;
        if (api.window) return; // already open
        const win = await api.requestWindow({ width: 360, height: 320 });
        copyStyles(win.document);
        win.addEventListener('pagehide', () => setPipWindow(null));
        setPipWindow(win);
      } else if (kind === 'video') {
        const video = videoRef.current();
        if (video && !video.hidden) await video.requestPictureInPicture();
      }
    } catch {
      // The browser said no (no click to allow it, or nothing playing): stay as we are.
    }
  }, [kind]);

  const close = useCallback(() => {
    window.documentPictureInPicture?.window?.close();
    if (document.pictureInPictureElement) void document.exitPictureInPicture().catch(() => {});
  }, []);

  // Leaving the call closes the floating window too.
  useEffect(() => close, [close]);

  // Chrome opens it by itself when a video-call tab is left, if the page asks to be told.
  useEffect(() => {
    if (kind !== 'window' || !('mediaSession' in navigator)) return;
    const action = 'enterpictureinpicture' as MediaSessionAction;
    try {
      navigator.mediaSession.setActionHandler(action, () => void open());
    } catch {
      return; // this version of the browser does not know the action
    }
    return () => {
      try {
        navigator.mediaSession.setActionHandler(action, null);
      } catch {
        // nothing to undo
      }
    };
  }, [kind, open]);

  return { kind, pipWindow, open, close };
}
