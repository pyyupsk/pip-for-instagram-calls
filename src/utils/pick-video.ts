function hasLiveTrack(video: HTMLVideoElement): boolean {
  const stream = video.srcObject;
  if (!stream || !('getVideoTracks' in stream)) return false;
  return stream.getVideoTracks().some((track) => track.readyState === 'live' && track.enabled);
}

function area(video: HTMLVideoElement): number {
  const rect = video.getBoundingClientRect();
  return rect.width * rect.height;
}

export function pickVideo(videos: Iterable<HTMLVideoElement>): HTMLVideoElement | undefined {
  return [...videos]
    .filter((video) => {
      const rect = video.getBoundingClientRect();
      return (
        video.readyState >= 1 &&
        !video.paused &&
        video.videoWidth > 0 &&
        rect.width > 0 &&
        rect.height > 0 &&
        getComputedStyle(video).visibility !== 'hidden' &&
        hasLiveTrack(video)
      );
    })
    .toSorted((a, b) => area(b) - area(a))[0];
}
