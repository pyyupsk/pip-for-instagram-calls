async function injectIntoOpenCalls() {
  const tabs = await browser.tabs.query({ url: 'https://www.instagram.com/call/*' });
  await Promise.all(
    tabs.map(async (tab) => {
      if (tab.id === undefined) return;
      await browser.scripting
        .executeScript({ target: { tabId: tab.id }, files: ['/content-scripts/content.js'] })
        .catch(() => {});
    }),
  );
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(injectIntoOpenCalls);
  browser.runtime.onStartup.addListener(injectIntoOpenCalls);
});
