export type PipFailure = 'no-video' | 'denied' | 'failed';
export type PipResult = Readonly<{ ok: true }> | Readonly<{ ok: false; error: PipFailure }>;

export type Pip = Readonly<{
  toggle: () => Promise<PipResult>;
  dispose: () => void;
}>;

async function closeQuietly(doc: Document) {
  try {
    await doc.exitPictureInPicture();
  } catch {
    // the window is already gone
  }
}

export function createPip(options: {
  document: Document;
  select: () => HTMLVideoElement | undefined;
  onChange: (active: boolean) => void;
}): Pip {
  const { document: doc, select, onChange } = options;

  let target: HTMLVideoElement | null = null;
  let wasDisabled = false;
  let busy = false;
  let disposed = false;

  function releaseTarget() {
    if (target !== null) target.disablePictureInPicture = wasDisabled;
    target = null;
  }

  function sync() {
    const active = Boolean(doc.pictureInPictureElement);
    onChange(active);
    if (!active) releaseTarget();
  }

  function onEnter() {
    sync();
  }

  function onLeave() {
    sync();
  }

  async function toggle(): Promise<PipResult> {
    if (busy || disposed) return { ok: true };
    busy = true;
    try {
      if (doc.pictureInPictureElement) {
        await doc.exitPictureInPicture();
        return { ok: true };
      }

      const video = select();
      if (!video) return { ok: false, error: 'no-video' };

      releaseTarget();
      target = video;
      wasDisabled = video.disablePictureInPicture;
      video.disablePictureInPicture = false;
      try {
        await video.requestPictureInPicture();
      } catch (error) {
        if ((error as Error | null)?.name === 'NotAllowedError')
          return { ok: false, error: 'denied' };
        return { ok: false, error: 'failed' };
      }

      if (disposed && doc.pictureInPictureElement === video) await doc.exitPictureInPicture();
      return { ok: true };
    } finally {
      busy = false;
      if (!disposed) sync();
    }
  }

  doc.addEventListener('enterpictureinpicture', onEnter, true);
  doc.addEventListener('leavepictureinpicture', onLeave, true);

  function dispose() {
    disposed = true;
    doc.removeEventListener('enterpictureinpicture', onEnter, true);
    doc.removeEventListener('leavepictureinpicture', onLeave, true);
    if (target && doc.pictureInPictureElement === target) void closeQuietly(doc);
    releaseTarget();
  }

  return { toggle, dispose };
}
