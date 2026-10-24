import { PIP_BUTTON_ID, createPipButton } from '@/components/pip-button/pip-button';
import { createPip, type PipFailure } from '@/lib/pip';
import { pickVideo } from '@/utils/pick-video';
import { findToolbarSlot } from '@/utils/toolbar-slot';

const MESSAGES: Record<PipFailure, string> = {
  'no-video': 'ยังไม่มีภาพวิดีโอสำหรับเปิด PiP',
  denied: 'เปิดไม่ได้ กรุณากดปุ่มหน้าต่างลอยอีกครั้ง',
  failed: 'เปิดหรือปิดหน้าต่างลอยไม่ได้ ลองอีกครั้ง',
};

const UNSUPPORTED = 'เบราว์เซอร์นี้ไม่รองรับ video Picture-in-Picture';

export default defineContentScript({
  matches: ['https://www.instagram.com/call/*'],
  main() {
    if (document.getElementById(PIP_BUTTON_ID)) return;

    const ui = createPipButton();
    const pip = createPip({
      document,
      select: () => pickVideo(document.querySelectorAll('video')),
      onChange: (active) => ui.setActive(active),
    });

    const supported =
      document.pictureInPictureEnabled &&
      typeof HTMLVideoElement.prototype.requestPictureInPicture === 'function';

    let disposed = false;
    const observer = new MutationObserver(() => mount());

    function mount() {
      if (disposed) return;
      const slot = findToolbarSlot(document.querySelectorAll('button,[role="button"]'));
      if (!slot || slot.toolbar === document.body) {
        ui.hideTooltip();
        ui.host.style.display = 'none';
        if (!ui.host.isConnected) document.body.append(ui.host);
        return;
      }
      if (ui.host.parentElement !== slot.toolbar || ui.host.nextSibling !== slot.slot) {
        ui.hideTooltip();
        slot.toolbar.insertBefore(ui.host, slot.slot);
      }
      ui.host.style.display = 'inline-block';
    }

    async function onToggle() {
      ui.hideTooltip();
      ui.showNotice('');
      ui.setDisabled(true);
      const result = await pip.toggle();
      ui.setDisabled(!supported);
      if (!result.ok) ui.showNotice(MESSAGES[result.error]);
    }

    function cleanup() {
      disposed = true;
      observer.disconnect();
      removeEventListener('pagehide', cleanup);
      ui.button.removeEventListener('click', onToggle);
      pip.dispose();
      ui.dispose();
    }

    if (supported) {
      ui.button.addEventListener('click', onToggle);
      addEventListener('pagehide', cleanup);
    } else {
      ui.setDisabled(true);
      ui.showNotice(UNSUPPORTED);
    }

    document.body.append(ui.host);
    observer.observe(document.body, { childList: true, subtree: true });
    mount();
  },
});
