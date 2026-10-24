export default defineContentScript({
  matches: ['https://www.instagram.com/call/*'],
  main() {
    console.log('ig-pip loaded');
  },
});
