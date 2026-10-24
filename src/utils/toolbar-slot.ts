const FULLSCREEN = /^(Enter|Exit) full screen$/;

export type ToolbarSlot = Readonly<{ toolbar: Element; slot: Element }>;

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
