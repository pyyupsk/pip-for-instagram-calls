import { defineConfig } from 'wxt';

// See https://wxt.dev/api/reference/wxt/interfaces/inlineconfig.html
export default defineConfig({
  srcDir: 'src',
  manifest: {
    permissions: ['scripting'],
    host_permissions: ['https://www.instagram.com/*'],
  },
});
