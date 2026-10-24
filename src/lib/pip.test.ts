import { describe, expect, test } from 'bun:test';

import { createPip } from './pip';

type FakeDocument = ReturnType<typeof fakeDocument>;
type FakeVideo = HTMLVideoElement & { disablePictureInPicture: boolean };

function fakeDocument() {
  const listeners = new Map<string, Set<(event: unknown) => void>>();
  const doc = {
    pictureInPictureElement: null as unknown,
    exits: 0,
    addEventListener(type: string, handler: (event: unknown) => void, capture?: boolean) {
      if (!capture) throw new Error('must listen in the capture phase');
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)?.add(handler);
    },
    removeEventListener(type: string, handler: (event: unknown) => void) {
      listeners.get(type)?.delete(handler);
    },
    dispatch(type: string) {
      for (const handler of listeners.get(type) ?? []) handler({ type });
    },
    listeners,
    async exitPictureInPicture() {
      doc.exits += 1;
      doc.pictureInPictureElement = null;
      doc.dispatch('leavepictureinpicture');
    },
  };
  return doc;
}

function video(doc: FakeDocument): FakeVideo {
  const element = {
    disablePictureInPicture: true,
    async requestPictureInPicture() {
      element.disablePictureInPicture = false;
      doc.pictureInPictureElement = element;
      doc.dispatch('enterpictureinpicture');
      return element;
    },
  };
  return element as unknown as FakeVideo;
}

function fakeRequest(element: FakeVideo, request: () => Promise<unknown>) {
  Object.defineProperty(element, 'requestPictureInPicture', { value: request });
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function setup(options: { doc?: FakeDocument; video?: FakeVideo } = {}) {
  const doc = options.doc ?? fakeDocument();
  const states: boolean[] = [];
  const pip = createPip({
    document: doc as unknown as Document,
    select: () => options.video,
    onChange: (active) => states.push(active),
  });
  return { doc, pip, states };
}

describe('createPip', () => {
  test('opens the selected video and reports active', async () => {
    const doc = fakeDocument();
    const target = video(doc);
    const states: boolean[] = [];
    const pip = createPip({
      document: doc as unknown as Document,
      select: () => target,
      onChange: (active) => states.push(active),
    });

    expect(await pip.toggle()).toEqual({ ok: true });
    expect(doc.pictureInPictureElement).toBe(target);
    expect(target.disablePictureInPicture).toBe(false);
    expect(states.at(-1)).toBe(true);
  });

  test('reports no video for an audio-only call', async () => {
    const { pip } = setup();
    expect(await pip.toggle()).toEqual({ ok: false, error: 'no-video' });
  });

  for (const disabled of [true, false]) {
    test(`closes an open window and restores a flag of ${disabled}`, async () => {
      const doc = fakeDocument();
      const target = video(doc);
      target.disablePictureInPicture = disabled;
      const pip = createPip({
        document: doc as unknown as Document,
        select: () => target,
        onChange: () => {},
      });

      await pip.toggle();
      expect(doc.pictureInPictureElement).toBe(target);
      await pip.toggle();

      expect(doc.pictureInPictureElement).toBeNull();
      expect(target.disablePictureInPicture).toBe(disabled);
    });
  }

  test('restores the flag when the browser closes the window', async () => {
    const doc = fakeDocument();
    const target = video(doc);
    const states: boolean[] = [];
    const pip = createPip({
      document: doc as unknown as Document,
      select: () => target,
      onChange: (active) => states.push(active),
    });

    await pip.toggle();
    await doc.exitPictureInPicture();

    expect(target.disablePictureInPicture).toBe(true);
    expect(states.at(-1)).toBe(false);
  });

  test('restores the flag when the browser rejects the request', async () => {
    const doc = fakeDocument();
    const target = video(doc);
    fakeRequest(target, async () => {
      throw Object.assign(new Error('denied'), { name: 'NotAllowedError' });
    });
    const { pip } = setup({ video: target });

    expect(await pip.toggle()).toEqual({ ok: false, error: 'denied' });
    expect(target.disablePictureInPicture).toBe(true);
  });

  test('blocks overlapping requests', async () => {
    const gate = deferred();
    const doc = fakeDocument();
    const target = video(doc);
    let requests = 0;
    fakeRequest(target, async () => {
      requests += 1;
      await gate.promise;
      return target;
    });
    const { pip } = setup({ doc, video: target });

    const opening = pip.toggle();
    await pip.toggle();
    expect(requests).toBe(1);

    gate.resolve();
    await opening;
  });

  test('closes a request that finishes after disposal', async () => {
    const gate = deferred();
    const doc = fakeDocument();
    const target = video(doc);
    fakeRequest(target, async () => {
      await gate.promise;
      doc.pictureInPictureElement = target;
      doc.dispatch('enterpictureinpicture');
      return target;
    });
    const { pip } = setup({ doc, video: target });

    const opening = pip.toggle();
    pip.dispose();
    gate.resolve();
    await opening;

    expect(doc.pictureInPictureElement).toBeNull();
    expect(target.disablePictureInPicture).toBe(true);
  });

  test('leaves an open window running when it is disposed', async () => {
    const doc = fakeDocument();
    const target = video(doc);
    const { pip } = setup({ doc, video: target });

    await pip.toggle();
    pip.dispose();

    expect(doc.pictureInPictureElement).toBe(target);
    expect(doc.exits).toBe(0);
  });

  test('removes its listeners on dispose', () => {
    const doc = fakeDocument();
    const { pip } = setup({ video: video(doc) });
    pip.dispose();
    expect(doc.listeners.get('enterpictureinpicture')?.size ?? 0).toBe(0);
    expect(doc.listeners.get('leavepictureinpicture')?.size ?? 0).toBe(0);
  });
});
