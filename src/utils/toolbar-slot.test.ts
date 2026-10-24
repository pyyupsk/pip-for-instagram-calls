import { describe, expect, test } from 'bun:test';

import { findToolbarSlot } from './toolbar-slot';

type Fake = {
  label?: string;
  parentElement: Fake | null;
  children: Fake[];
  append: (...children: Fake[]) => void;
  getAttribute: (name: string) => string | null;
  contains: (child: Fake | undefined) => boolean;
};

function node(label?: string): Fake {
  const self: Fake = {
    label,
    parentElement: null,
    children: [],
    append(...children) {
      for (const child of children) {
        child.parentElement = self;
        self.children.push(child);
      }
    },
    getAttribute: (name) => (name === 'aria-label' ? (self.label ?? null) : null),
    contains(child) {
      for (let current: Fake | null | undefined = child; current; current = current.parentElement) {
        if (current === self) return true;
      }
      return false;
    },
  };
  return self;
}

function controls(settings: Fake, fullscreen: Fake): Element[] {
  return [settings, fullscreen] as unknown as Element[];
}

describe('findToolbarSlot', () => {
  test('returns the toolbar that holds both call controls', () => {
    const toolbar = node();
    const settingsSlot = node();
    const settings = node('Settings');
    const fullscreen = node('Enter full screen');
    settingsSlot.append(settings);
    toolbar.append(settingsSlot, fullscreen);

    const slot = findToolbarSlot(controls(settings, fullscreen));
    expect(slot?.toolbar).toBe(toolbar as unknown as Element);
    expect(slot?.slot).toBe(settingsSlot as unknown as Element);
  });

  test('accepts the exit full screen label', () => {
    const toolbar = node();
    const settings = node('Settings');
    const fullscreen = node('Exit full screen');
    toolbar.append(settings, fullscreen);

    expect(findToolbarSlot(controls(settings, fullscreen))?.slot).toBe(
      settings as unknown as Element,
    );
  });

  test('returns null when the full screen control is missing', () => {
    const settings = node('Settings');
    expect(findToolbarSlot([settings] as unknown as Element[])).toBeNull();
  });

  test('returns null when the settings control is missing', () => {
    const fullscreen = node('Enter full screen');
    expect(findToolbarSlot([fullscreen] as unknown as Element[])).toBeNull();
  });
});
