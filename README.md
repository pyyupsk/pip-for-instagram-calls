# PiP for Instagram Calls

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/ppcpjpglgfphilkaaeklgibdjijllijk?color=a1b858&label=)](https://chromewebstore.google.com/detail/ppcpjpglgfphilkaaeklgibdjijllijk)

Picture in Picture (PiP) for [Instagram](https://www.instagram.com) video calls. Keep the video in a floating window while you use other tabs.

[👉 Install from the Chrome Web Store](https://chromewebstore.google.com/detail/ppcpjpglgfphilkaaeklgibdjijllijk)

## Features

- One button in the call toolbar, next to Settings and Full screen
- Uses the browser's own picture-in-picture window
- Picks the largest playing video
- Works when Instagram opens a call without reloading the page
- Collects no data and makes no network requests

## Usage

Start a video call on instagram.com. Click the picture-in-picture button at the top right of the call. To return, click it again or close the floating window.

The window shows video only. An audio-only call has no video to show.

## Build locally

```bash
bun install
bun run build
```

In `chrome://extensions`, turn on Developer mode. Then click Load unpacked and select `.output/chrome-mv3`.

## Release

```bash
git tag v1.0.0
git push origin v1.0.0
```

The tag must match `version` in `package.json`. The [release workflow](./.github/workflows/release.yml) then submits that version to the Chrome Web Store.

## Why?

Instagram turns off the right-click menu and disables picture-in-picture on its call video. The browser can still play that video in a floating window, but the page has no control to open it. This extension adds that control.

## License

[MIT](./LICENSE) License © 2026 [Pongsakorn Thipayanate](https://github.com/pyyupsk). Icon from [Lucide](https://lucide.dev), ISC License. [Privacy policy](https://fasu.dev/pip/privacy/). Not affiliated with Instagram or Meta.
