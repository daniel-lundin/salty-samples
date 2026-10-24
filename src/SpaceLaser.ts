import { watchAudioContext } from "./AudioLifecycle.ts";

let audioContext: AudioContext | undefined;

export async function playSpaceLaser(): Promise<void> {
  audioContext ??= new window.AudioContext();
  watchAudioContext(audioContext);
  if (audioContext.state !== "running") await audioContext.resume();

  const now = audioContext.currentTime;
  const duration = 0.48 + Math.random() * 0.16;
  const startFrequency = 1500 + Math.random() * 700;
  const endFrequency = 170 + Math.random() * 110;
  const laser = audioContext.createOscillator();
  const overtone = audioContext.createOscillator();
  const wobble = audioContext.createOscillator();
  const wobbleDepth = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  const envelope = audioContext.createGain();
  const delay = audioContext.createDelay(0.3);
  const echo = audioContext.createGain();
  const output = audioContext.createGain();

  laser.type = "sine";
  laser.frequency.setValueAtTime(startFrequency, now);
  laser.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
  overtone.type = "triangle";
  overtone.frequency.setValueAtTime(startFrequency * 0.52, now);
  overtone.frequency.exponentialRampToValueAtTime(endFrequency * 1.35, now + duration);
  wobble.type = "sine";
  wobble.frequency.value = 19 + Math.random() * 10;
  wobbleDepth.gain.value = 18 + Math.random() * 15;
  wobble.connect(wobbleDepth);
  wobbleDepth.connect(laser.frequency);

  filter.type = "bandpass";
  filter.frequency.setValueAtTime(3000, now);
  filter.frequency.exponentialRampToValueAtTime(650, now + duration);
  filter.Q.value = 1.3;
  envelope.gain.setValueAtTime(0.0001, now);
  envelope.gain.exponentialRampToValueAtTime(0.42, now + 0.008);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  delay.delayTime.value = 0.105;
  echo.gain.value = 0.24;

  laser.connect(filter);
  overtone.connect(filter);
  filter.connect(envelope);
  envelope.connect(output);
  envelope.connect(delay);
  delay.connect(echo);
  echo.connect(output);
  output.connect(audioContext.destination);

  laser.start(now);
  overtone.start(now);
  wobble.start(now);
  laser.stop(now + duration);
  overtone.stop(now + duration);
  wobble.stop(now + duration);
  window.setTimeout(() => {
    filter.disconnect();
    envelope.disconnect();
    delay.disconnect();
    echo.disconnect();
    output.disconnect();
    wobbleDepth.disconnect();
  }, (duration + 0.5) * 1000);
}
