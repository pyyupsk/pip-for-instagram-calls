import { defineConfig } from 'wxt';

// See https://wxt.dev/api/reference/wxt/interfaces/inlineconfig.html
export default defineConfig({
  srcDir: 'src',
  manifest: {
    name: 'PiP for Instagram Calls',
    description:
      'Picture in Picture (PiP) for Instagram video calls. Keep the video in a floating window while you use other tabs.',
    permissions: ['scripting'],
    host_permissions: ['https://www.instagram.com/*'],
  },
});
