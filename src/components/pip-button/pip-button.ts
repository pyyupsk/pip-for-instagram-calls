export const PIP_BUTTON_ID = 'instagram-pip';

const TOOLTIP_DELAY = 300;

const STYLES = `
:host { color-scheme: dark; font: 13px/16px var(--font-family-segoe, "Segoe UI Historic", "Segoe UI", Helvetica, Arial, sans-serif); }
button { position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; padding: 0; border: 0; border-radius: 24px; background: transparent; color: var(--primary-icon, #e4e6eb); cursor: pointer; }
button::after { content: ''; position: absolute; inset: 0; border-radius: 999px; pointer-events: none; opacity: 0; background: transparent; transition: opacity 100ms linear; }
button:hover::after { background: var(--non-media-pressed-on-dark, rgba(255, 255, 255, .3)); opacity: 1; transition-duration: 0s; }
button:active { transform: scale(.96); }
button:active::after { background: var(--non-media-pressed, rgba(68, 73, 80, .15)); opacity: 1; transition-duration: 0s; }
button:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
button:disabled { opacity: .45; cursor: default; }
svg { width: 32px; height: 32px; transition: color 200ms cubic-bezier(.08, .52, .52, 1), fill 200ms cubic-bezier(.08, .52, .52, 1), stroke 200ms cubic-bezier(.08, .52, .52, 1); }
#tooltip { position: fixed; inset: auto; margin: 0; border: 0; box-sizing: border-box; width: max-content; max-width: min(334px, calc(100vw - 16px)); padding: 8px 12px 9px; border-radius: var(--tooltip-corner-radius, 8px); color: var(--primary-text, #e4e6eb); background: var(--card-background-flat, #323436); box-shadow: var(--tooltip-box-shadow, 0 2px 4px rgba(0, 0, 0, .5)); font: inherit; overflow: visible; pointer-events: none; }
#tooltip[hidden] { display: none; }
#tooltip::before { content: ''; position: absolute; top: -4.9px; left: calc(50% - 7px); width: 14px; height: 14px; border-radius: 3px 0 0; background: inherit; transform: rotate(45deg); }
#tooltip span { position: relative; }
@media (prefers-reduced-motion: reduce) { button::after, svg { transition: none; } }
#notice { position: absolute; top: 48px; right: 0; width: max-content; max-width: min(280px, calc(100vw - 24px)); padding: 8px 12px; border-radius: 12px; color: #fff; background: #262626; }
#notice:empty { display: none; }
`;

// Picture-in-picture icon: Lucide, ISC License.
const ICON = `<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g transform="translate(6 6)"><path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h4"/><rect width="10" height="7" x="12" y="13" rx="2"/></g></svg>`;

const MARKUP = `
<style>${STYLES}</style>
<button type="button" aria-label="Enter picture-in-picture" aria-pressed="false">${ICON}</button>
<div id="tooltip" role="tooltip" popover="manual" hidden><span></span></div>
<div id="notice" role="status" aria-live="polite"></div>
`;

export type PipButton = Readonly<{
  host: HTMLElement;
  button: HTMLButtonElement;
  setActive: (active: boolean) => void;
  setDisabled: (disabled: boolean) => void;
  showNotice: (text: string) => void;
  hideTooltip: () => void;
  dispose: () => void;
}>;

function need<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`missing ${selector}`);
  return element;
}

export function createPipButton(): PipButton {
  const host = document.createElement('div');
  host.id = PIP_BUTTON_ID;
  host.style.cssText =
    'display:none;position:relative;vertical-align:top;margin-top:8px;padding:4px;width:40px;height:40px;box-sizing:content-box;pointer-events:auto;';

  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = MARKUP;

  const button = need<HTMLButtonElement>(root, 'button');
  const tooltip = need<HTMLElement>(root, '#tooltip');
  const tooltipText = need<HTMLElement>(root, '#tooltip span');
  const notice = need<HTMLElement>(root, '#notice');

  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;

  function hideTooltip() {
    clearTimeout(timer);
    if (tooltip.isConnected) tooltip.hidePopover?.();
    tooltip.hidden = true;
    button.removeAttribute('aria-describedby');
  }

  function queueTooltip() {
    hideTooltip();
    if (disposed || button.disabled) return;
    timer = setTimeout(() => {
      if (disposed || !host.isConnected || button.disabled) return;
      const rect = button.getBoundingClientRect();
      tooltipText.textContent = button.getAttribute('aria-label');
      tooltip.hidden = false;
      tooltip.showPopover?.();
      tooltip.style.top = `${rect.bottom + 7.5}px`;
      tooltip.style.left = `${Math.max(8, Math.min(rect.left + rect.width / 2 - tooltip.offsetWidth / 2, innerWidth - tooltip.offsetWidth - 8))}px`;
      button.setAttribute('aria-describedby', 'tooltip');
    }, TOOLTIP_DELAY);
  }

  function onPointerEnter() {
    queueTooltip();
  }

  function onFocus() {
    queueTooltip();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') hideTooltip();
  }

  button.addEventListener('pointerenter', onPointerEnter);
  button.addEventListener('focus', onFocus);
  button.addEventListener('pointerleave', hideTooltip);
  button.addEventListener('pointerdown', hideTooltip);
  button.addEventListener('blur', hideTooltip);
  button.addEventListener('keydown', onKeyDown);
  addEventListener('resize', hideTooltip);
  document.addEventListener('scroll', hideTooltip, true);

  function setActive(active: boolean) {
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute(
      'aria-label',
      active ? 'Exit picture-in-picture' : 'Enter picture-in-picture',
    );
    tooltipText.textContent = button.getAttribute('aria-label');
  }

  function setDisabled(disabled: boolean) {
    button.disabled = disabled;
  }

  function showNotice(text: string) {
    notice.textContent = text;
  }

  function dispose() {
    disposed = true;
    hideTooltip();
    button.removeEventListener('pointerenter', onPointerEnter);
    button.removeEventListener('focus', onFocus);
    button.removeEventListener('pointerleave', hideTooltip);
    button.removeEventListener('pointerdown', hideTooltip);
    button.removeEventListener('blur', hideTooltip);
    button.removeEventListener('keydown', onKeyDown);
    removeEventListener('resize', hideTooltip);
    document.removeEventListener('scroll', hideTooltip, true);
    host.remove();
  }

  return { host, button, setActive, setDisabled, showNotice, hideTooltip, dispose };
}
