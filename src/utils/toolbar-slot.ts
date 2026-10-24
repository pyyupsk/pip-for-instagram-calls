const FULLSCREEN = /^(Enter|Exit) full screen$/;

export type ToolbarSlot = Readonly<{ toolbar: Element; slot: Element | null }>;

// shortcut: anchors on the English call controls; add locales after testing them.
export function findToolbarSlot(controls: Iterable<Element>): ToolbarSlot | null {
  let settings: Element | undefined;
  let fullscreen: Element | undefined;
  for (const control of controls) {
    const label = control.getAttribute('aria-label');
    if (label === 'Settings') settings ??= control;
    else if (label && FULLSCREEN.test(label)) fullscreen ??= control;
  }
  if (!settings || !fullscreen) return null;

  let slot: Element = settings;
  while (slot.parentElement && !slot.parentElement.contains(fullscreen)) slot = slot.parentElement;

  const toolbar = slot.parentElement;
  return toolbar ? { toolbar, slot } : null;
}

// Label-free fallback for non-English call UI.
export function findToolbarByVideo(video: Element | null): ToolbarSlot | null {
  let node = video?.parentElement ?? null;
  for (let depth = 0; node && depth < 8; depth += 1) {
    if (node.querySelectorAll('button,[role="button"]').length >= 3) {
      return { toolbar: node, slot: null };
    }
    node = node.parentElement;
  }
  return null;
}
