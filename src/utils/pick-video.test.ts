import { beforeAll, describe, expect, test } from 'bun:test';

import { pickVideo } from './pick-video';

type Fake = Readonly<{
  area: number;
  readyState?: number;
  paused?: boolean;
  visibility?: string;
  live?: boolean;
}>;

function video(fake: Fake): HTMLVideoElement {
  const track = { readyState: fake.live === false ? 'ended' : 'live', enabled: true };
  return {
    readyState: fake.readyState ?? 4,
    paused: fake.paused ?? false,
    videoWidth: 480,
    visibility: fake.visibility ?? 'visible',
    srcObject: { getVideoTracks: () => [track] },
    getBoundingClientRect: () => ({ width: fake.area, height: 1 }),
  } as unknown as HTMLVideoElement;
}

beforeAll(() => {
  globalThis.getComputedStyle = ((element: { visibility?: string }) =>
    ({
      visibility: element.visibility ?? 'visible',
    }) as CSSStyleDeclaration) as typeof getComputedStyle;
});

describe('pickVideo', () => {
  test('returns nothing when the call has no video', () => {
    expect(pickVideo([])).toBeUndefined();
  });

  test('skips a buffer that has no picture yet', () => {
    const blank = video({ area: 900, readyState: 0 });
    const playing = video({ area: 400 });
    expect(pickVideo([blank, playing])).toBe(playing);
  });

  test('skips paused, hidden and ended videos', () => {
    const paused = video({ area: 800, paused: true });
    const hidden = video({ area: 700, visibility: 'hidden' });
    const ended = video({ area: 600, live: false });
    const playing = video({ area: 100 });
    expect(pickVideo([paused, hidden, ended, playing])).toBe(playing);
  });

  test('returns the largest candidate', () => {
    const small = video({ area: 100 });
    const large = video({ area: 900 });
    const medium = video({ area: 400 });
    expect(pickVideo([small, large, medium])).toBe(large);
  });
});
