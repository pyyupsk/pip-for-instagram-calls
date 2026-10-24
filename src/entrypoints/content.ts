import { PIP_BUTTON_ID, createPipButton } from '@/components/pip-button/pip-button';
import { createPip, type PipFailure } from '@/lib/pip';
import { pickVideo } from '@/utils/pick-video';
import { findToolbarByVideo, findToolbarSlot } from '@/utils/toolbar-slot';

const MESSAGES: Record<PipFailure, string> = {
  'no-video': 'ยังไม่มีภาพวิดีโอสำหรับเปิด PiP',
  denied: 'เปิดไม่ได้ กรุณากดปุ่มหน้าต่างลอยอีกครั้ง',
  failed: 'เปิดหรือปิดหน้าต่างลอยไม่ได้ ลองอีกครั้ง',
};

const UNSUPPORTED = 'เบราว์เซอร์นี้ไม่รองรับ video Picture-in-Picture';

function startSession() {
  const ui = createPipButton();
  const pip = createPip({
    document,
    select: () => pickVideo(document.querySelectorAll('video')),
    onChange: (active) => ui.setActive(active),
  });

  const supported =
    document.pictureInPictureEnabled &&
    typeof HTMLVideoElement.prototype.requestPictureInPicture === 'function';

  function place() {
    const target =
      findToolbarSlot(document.querySelectorAll('button,[role="button"]')) ??
      findToolbarByVideo(document.querySelector('video'));
    if (!target || target.toolbar === document.body) {
      ui.hideTooltip();
      ui.host.style.display = 'none';
      if (!ui.host.isConnected) document.body.append(ui.host);
      return;
    }
    const before = target.slot;
    const placed = before ? ui.host.nextSibling === before : ui.host.nextSibling === null;
    if (ui.host.parentElement !== target.toolbar || !placed) {
      ui.hideTooltip();
      if (before) target.toolbar.insertBefore(ui.host, before);
      else target.toolbar.append(ui.host);
    }
    ui.host.style.display = 'inline-block';
  }

  async function onToggle() {
    ui.hideTooltip();
    ui.showNotice('');
    ui.setDisabled(true);
    const result = await pip.toggle();
    ui.setDisabled(false);
    if (!result.ok) ui.showNotice(MESSAGES[result.error]);
  }

  if (supported) {
    ui.button.addEventListener('click', onToggle);
  } else {
    ui.setDisabled(true);
    ui.showNotice(UNSUPPORTED);
  }

  document.body.append(ui.host);
  place();

  return {
    place,
    dispose() {
      ui.button.removeEventListener('click', onToggle);
      pip.dispose();
      ui.dispose();
    },
  };
}

export default defineContentScript({
  matches: ['https://www.instagram.com/*'],
  main() {
    if (document.getElementById(PIP_BUTTON_ID)) return;

    let session: ReturnType<typeof startSession> | null = null;
    let scheduled = false;

    function sync() {
      if (location.pathname.startsWith('/call/')) {
        if (session) session.place();
        else session = startSession();
      } else if (session) {
        session.dispose();
        session = null;
      }
    }

    // Instagram navigates client-side, so a page load is not the only way into a call.
    function schedule() {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        sync();
      });
    }

    const observer = new MutationObserver(schedule);

    function onPageHide() {
      observer.disconnect();
      session?.dispose();
      session = null;
    }

    observer.observe(document.body, { childList: true, subtree: true });
    addEventListener('popstate', schedule);
    addEventListener('pagehide', onPageHide, { once: true });

    sync();
  },
});
