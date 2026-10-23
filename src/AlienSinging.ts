import { watchAudioContext } from "./AudioLifecycle.ts";

const alienNotes = [
  110,
  123.47,
  146.83,
  164.81,
  185,
  220,
  246.94,
  293.66,
  329.63,
  369.99,
  440,
  493.88,
];

type OrientationEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<PermissionState>;
};

export async function startAlienSinging(): Promise<() => void> {
  const audio = new window.AudioContext();
  watchAudioContext(audio);
  const resumeAudio = audio.state === "suspended" ? audio.resume() : Promise.resolve();
  const orientationEvent = window.DeviceOrientationEvent as OrientationEventWithPermission;
  if (typeof orientationEvent.requestPermission === "function") {
    try {
      await orientationEvent.requestPermission();
    } catch {
      // Continue with pointer control if motion access is unavailable.
    }
  }

  await resumeAudio;
  const now = audio.currentTime;
  const voice = audio.createOscillator();
  const undertone = audio.createOscillator();
  const vibrato = audio.createOscillator();
  const vibratoDepth = audio.createGain();
  const filter = audio.createBiquadFilter();
  const voiceGain = audio.createGain();
  const undertoneGain = audio.createGain();
  const mix = audio.createGain();
  const panner = audio.createStereoPanner();

  voice.type = "sawtooth";
  voice.frequency.value = alienNotes[6];
  undertone.type = "sine";
  undertone.frequency.value = alienNotes[3] * 1.51;
  vibrato.type = "sine";
  vibrato.frequency.value = 4.8;
  vibratoDepth.gain.value = 8;
  vibrato.connect(vibratoDepth);
  vibratoDepth.connect(voice.frequency);

  filter.type = "bandpass";
  filter.frequency.value = 1250;
  filter.Q.value = 2.8;
  voiceGain.gain.value = 0.15;
  undertoneGain.gain.value = 0.1;
  mix.gain.setValueAtTime(0.0001, now);
  mix.gain.exponentialRampToValueAtTime(0.28, now + 0.8);
  voice.connect(filter);
  filter.connect(voiceGain);
  voiceGain.connect(mix);
  undertone.connect(undertoneGain);
  undertoneGain.connect(mix);
  mix.connect(panner);
  panner.connect(audio.destination);

  voice.start(now);
  undertone.start(now);
  vibrato.start(now);

  const updateFromPosition = (x: number, y: number) => {
    const noteIndex = Math.min(
      alienNotes.length - 1,
      Math.floor(Math.max(0, Math.min(1, y)) * alienNotes.length),
    );
    const harmonyIndex = (noteIndex + 3 + Math.round(x * 3)) % alienNotes.length;
    const time = audio.currentTime;
    voice.frequency.setTargetAtTime(alienNotes[noteIndex], time, 0.12);
    undertone.frequency.setTargetAtTime(alienNotes[harmonyIndex] * 1.48, time, 0.18);
    filter.frequency.setTargetAtTime(700 + x * 1500, time, 0.25);
    panner.pan.setTargetAtTime((x - 0.5) * 1.2, time, 0.2);
  };

  const onOrientation = (event: DeviceOrientationEvent) => {
    if (event.beta === null || event.gamma === null) return;
    const y = (Math.max(-80, Math.min(80, event.beta)) + 80) / 160;
    const x = (Math.max(-70, Math.min(70, event.gamma)) + 70) / 140;
    updateFromPosition(x, y);
  };
  const onPointerMove = (event: PointerEvent) => {
    updateFromPosition(
      event.clientX / window.innerWidth,
      event.clientY / window.innerHeight,
    );
  };

  window.addEventListener("deviceorientation", onOrientation);
  window.addEventListener("pointermove", onPointerMove);

  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    window.removeEventListener("deviceorientation", onOrientation);
    window.removeEventListener("pointermove", onPointerMove);
    const stopAt = audio.currentTime;
    mix.gain.cancelScheduledValues(stopAt);
    mix.gain.setTargetAtTime(0.0001, stopAt, 0.35);
    voice.stop(stopAt + 2);
    undertone.stop(stopAt + 2);
    vibrato.stop(stopAt + 2);
    window.setTimeout(() => void audio.close(), 2200);
  };
}
