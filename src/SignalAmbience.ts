import { playSpaceLaser } from "./SpaceLaser.ts";
import {
  playAlienTransmission,
  playRadiationCounter,
} from "./SpaceSounds.ts";

const signals = [playSpaceLaser, playRadiationCounter, playAlienTransmission];

/** Play occasional, varied transmissions until the returned stop function is called. */
export function startSignalAmbience(): () => void {
  let timer: number | undefined;
  let stopped = false;

  const playNextSignal = () => {
    if (stopped) return;
    const signal = signals[Math.floor(Math.random() * signals.length)];
    void signal();
    timer = window.setTimeout(playNextSignal, 4500 + Math.random() * 6500);
  };

  timer = window.setTimeout(playNextSignal, 1200 + Math.random() * 3800);

  return () => {
    stopped = true;
    if (timer !== undefined) window.clearTimeout(timer);
  };
}
