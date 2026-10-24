import { watchAudioContext } from "./AudioLifecycle.ts";

// Keep the 16-step spooky scale and pitch range from the original orientation singer.
const chromaticNotes = [
  16.35, 17.32, 18.35, 19.45, 20.6, 21.83, 23.12, 24.5, 25.96, 27.5, 29.14, 30.87,
  16.35 * 2, 17.32 * 2, 18.35 * 2, 19.45 * 2, 20.6 * 2, 21.83 * 2, 23.12 * 2,
  24.5 * 2, 25.96 * 2, 27.5 * 2, 29.14 * 2, 30.87 * 2,
  16.35 * 4, 17.32 * 4, 18.35 * 4, 19.45 * 4, 20.6 * 4, 21.83 * 4, 23.12 * 4,
  24.5 * 4, 25.96 * 4, 27.5 * 4, 29.14 * 4, 30.87 * 4,
];
const scaleSteps = [9, 11, 12, 15, 16, 17, 20, 21, 21, 23, 24, 27, 28, 29, 32, 33];
const alienScale = scaleSteps.map((step) => chromaticNotes[step] * 16);

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
  const whistle = audio.createOscillator();
  const vibrato = audio.createOscillator();
  const formantDrift = audio.createOscillator();
  const tremolo = audio.createOscillator();
  const vibratoDepth = audio.createGain();
  const formantDepth = audio.createGain();
  const tremoloDepth = audio.createGain();
  const filter = audio.createBiquadFilter();
  const whistleFilter = audio.createBiquadFilter();
  const voiceGain = audio.createGain();
  const undertoneGain = audio.createGain();
  const whistleGain = audio.createGain();
  const mix = audio.createGain();
  const panner = audio.createStereoPanner();
  const oscillators = [voice, undertone, whistle, vibrato, formantDrift, tremolo];

  voice.type = "sawtooth";
  voice.frequency.value = alienScale[0];
  undertone.type = "sine";
  undertone.frequency.value = alienScale[3] * 1.51;
  whistle.type = "triangle";
  whistle.frequency.value = alienScale[0] * 2.73;

  vibrato.type = "sine";
  vibrato.frequency.value = 5.7;
  vibratoDepth.gain.value = 12;
  vibrato.connect(vibratoDepth);
  vibratoDepth.connect(voice.frequency);

  formantDrift.type = "sine";
  formantDrift.frequency.value = 0.31;
  formantDepth.gain.value = 260;
  formantDrift.connect(formantDepth);

  tremolo.type = "sine";
  tremolo.frequency.value = 2.35;
  tremoloDepth.gain.value = 0.045;
  tremolo.connect(tremoloDepth);
  tremoloDepth.connect(voiceGain.gain);

  filter.type = "bandpass";
  filter.frequency.value = 1150;
  filter.Q.value = 3.4;
  formantDepth.connect(filter.frequency);
  whistleFilter.type = "bandpass";
  whistleFilter.frequency.value = 2300;
  whistleFilter.Q.value = 4;

  voiceGain.gain.value = 0.17;
  undertoneGain.gain.value = 0.1;
  whistleGain.gain.value = 0.055;
  mix.gain.setValueAtTime(0.0001, now);
  mix.gain.exponentialRampToValueAtTime(0.3, now + 0.8);

  voice.connect(filter);
  filter.connect(voiceGain);
  voiceGain.connect(mix);
  undertone.connect(undertoneGain);
  undertoneGain.connect(mix);
  whistle.connect(whistleFilter);
  whistleFilter.connect(whistleGain);
  whistleGain.connect(mix);
  mix.connect(panner);
  panner.connect(audio.destination);

  oscillators.forEach((oscillator) => oscillator.start(now));

  const updateFromPosition = (x: number, y: number) => {
    const noteIndex = Math.min(
      alienScale.length - 1,
      Math.floor(Math.max(0, Math.min(1, y)) * (alienScale.length - 1)),
    );
    const harmonyIndex = (noteIndex + 3 + Math.round(x * 3)) % alienScale.length;
    const time = audio.currentTime;
    voice.frequency.setTargetAtTime(alienScale[noteIndex], time, 0.12);
    undertone.frequency.setTargetAtTime(alienScale[harmonyIndex] * 1.48, time, 0.18);
    whistle.frequency.setTargetAtTime(alienScale[noteIndex] * 2.73, time, 0.14);
    filter.frequency.setTargetAtTime(700 + x * 1500, time, 0.25);
    whistleFilter.frequency.setTargetAtTime(1700 + x * 1900, time, 0.22);
    panner.pan.setTargetAtTime((x - 0.5) * 1.2, time, 0.2);
  };

  const onOrientation = (event: DeviceOrientationEvent) => {
    if (event.beta === null || event.gamma === null) return;
    // Preserve the old beta mapping: normalize the full angle and pick one of 16 scale steps.
    const y = ((event.beta + 360) % 360) / 360;
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
    oscillators.forEach((oscillator) => oscillator.stop(stopAt + 2));
    window.setTimeout(() => void audio.close(), 2200);
  };
}
