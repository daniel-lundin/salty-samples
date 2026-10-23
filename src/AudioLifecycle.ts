const activeContexts = new Set<AudioContext>();
let listenersInstalled = false;

function resumeActiveContexts() {
  if (document.visibilityState !== "visible") return;

  activeContexts.forEach((context) => {
    if (context.state !== "running" && context.state !== "closed") {
      void context.resume().catch(() => {
        // Browsers may require another user gesture before resuming audio.
      });
    }
  });
}

/** Retry interrupted Web Audio contexts when the document becomes active again. */
export function watchAudioContext(context: AudioContext): void {
  activeContexts.add(context);
  if (listenersInstalled) return;
  listenersInstalled = true;
  document.addEventListener("visibilitychange", resumeActiveContexts);
  window.addEventListener("pageshow", resumeActiveContexts);
  window.addEventListener("focus", resumeActiveContexts);
}
