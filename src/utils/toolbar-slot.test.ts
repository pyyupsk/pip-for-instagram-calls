import { describe, expect, test } from 'bun:test';

import { findToolbarByVideo, findToolbarSlot } from './toolbar-slot';

type Fake = {
  label?: string;
  button?: boolean;
  parentElement: Fake | null;
  children: Fake[];
  append: (...children: Fake[]) => void;
  getAttribute: (name: string) => string | null;
  contains: (child: Fake | undefined) => boolean;
  querySelectorAll: (selector: string) => Fake[];
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
    querySelectorAll(selector) {
      if (selector !== 'button,[role="button"]') throw new Error(`unexpected ${selector}`);
      const found: Fake[] = [];
      const walk = (element: Fake) => {
        for (const child of element.children) {
          if (child.button) found.push(child);
          walk(child);
        }
      };
      walk(self);
      return found;
    },
  };
  return self;
}

function button(label?: string): Fake {
  const element = node(label);
  element.button = true;
  return element;
}

describe('findToolbarSlot', () => {
  test('returns the toolbar that holds both labelled controls', () => {
    const toolbar = node();
    const settingsSlot = node();
    const settings = node('Settings');
    const fullscreen = node('Enter full screen');
    settingsSlot.append(settings);
    toolbar.append(settingsSlot, fullscreen);

    const slot = findToolbarSlot([settings, fullscreen] as unknown as Element[]);
    expect(slot?.toolbar).toBe(toolbar as unknown as Element);
    expect(slot?.slot).toBe(settingsSlot as unknown as Element);
  });

  test('accepts the exit full screen label', () => {
    const toolbar = node();
    const settings = node('Settings');
    const fullscreen = node('Exit full screen');
    toolbar.append(settings, fullscreen);

    const slot = findToolbarSlot([settings, fullscreen] as unknown as Element[]);
    expect(slot?.slot).toBe(settings as unknown as Element);
  });

  test('returns null when the full screen control is missing', () => {
    expect(findToolbarSlot([node('Settings')] as unknown as Element[])).toBeNull();
  });

  test('returns null when the settings control is missing', () => {
    expect(findToolbarSlot([node('Enter full screen')] as unknown as Element[])).toBeNull();
  });
});

describe('findToolbarByVideo', () => {
  test('returns null without a video', () => {
    expect(findToolbarByVideo(null)).toBeNull();
  });

  test('skips ancestors that hold fewer than three controls', () => {
    const row = node();
    const stage = node();
    const video = node();
    row.append(button('a'), button('b'), button('c'), stage);
    stage.append(video);

    expect(findToolbarByVideo(video as unknown as Element)?.toolbar).toBe(
      row as unknown as Element,
    );
  });

  test('places at the end of the row instead of before a control', () => {
    const row = node();
    const video = node();
    row.append(button('a'), button('b'), button('c'), video);

    expect(findToolbarByVideo(video as unknown as Element)?.slot).toBeNull();
  });

  test('gives up after eight levels', () => {
    let current = node();
    const video = node();
    for (let depth = 0; depth < 10; depth += 1) {
      const parent = node();
      parent.append(current);
      current = parent;
    }
    let leaf = current;
    for (let depth = 0; depth < 10; depth += 1) leaf = leaf.children[0] ?? leaf;
    leaf.append(video);
    current.append(button('a'), button('b'), button('c'));

    expect(findToolbarByVideo(video as unknown as Element)).toBeNull();
  });
});
