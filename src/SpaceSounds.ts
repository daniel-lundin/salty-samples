import { watchAudioContext } from "./AudioLifecycle.ts";

let context: AudioContext | undefined;

async function getAudioContext(): Promise<AudioContext> {
  context ??= new window.AudioContext();
  watchAudioContext(context);
  if (context.state === "suspended") await context.resume();
  return context;
}

/** A brief, irregular burst of sharp radiation counter ticks. */
export async function playRadiationCounter(): Promise<void> {
  const audio = await getAudioContext();
  const start = audio.currentTime + 0.015;
  const ticks: number[] = [];
  let burstStart = 0;
  const burstCount = 3 + Math.floor(Math.random() * 3);
  for (let burst = 0; burst < burstCount; burst += 1) {
    const clicks = 2 + Math.floor(Math.random() * 5);
    for (let click = 0; click < clicks; click += 1) {
      ticks.push(burstStart + click * (0.055 + Math.random() * 0.09));
    }
    burstStart += 0.28 + Math.random() * 0.46;
  }

  ticks.forEach((offset, index) => {
    const at = start + offset + Math.random() * 0.04;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = index % 3 === 0 ? "square" : "sawtooth";
    oscillator.frequency.setValueAtTime(1500 + Math.random() * 1100, at);
    oscillator.frequency.exponentialRampToValueAtTime(550, at + 0.012);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.13, at + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.018);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(at);
    oscillator.stop(at + 0.02);
  });
}

/** Play occasional counter bursts until the returned stop function is called. */
export async function startRadiationCounterAmbience(): Promise<() => void> {
  await getAudioContext();
  let timer: number | undefined;
  let stopped = false;

  const playNextBurst = () => {
    if (stopped) return;
    void playRadiationCounter();
    timer = window.setTimeout(playNextBurst, 4200 + Math.random() * 3800);
  };

  timer = window.setTimeout(playNextBurst, 900 + Math.random() * 2300);
  return () => {
    stopped = true;
    if (timer !== undefined) window.clearTimeout(timer);
  };
}

/** A short, wavering alien transmission with a descending, vocal-like tone. */
export async function playAlienTransmission(): Promise<void> {
  const audio = await getAudioContext();
  const now = audio.currentTime;
  const duration = 1.9 + Math.random() * 1.25;
  const startingPitch = 245 + Math.random() * 150;
  const endingPitch = 115 + Math.random() * 100;
  const output = audio.createGain();
  const filter = audio.createBiquadFilter();
  const carrier = audio.createOscillator();
  const overtone = audio.createOscillator();
  const wobble = audio.createOscillator();
  const wobbleDepth = audio.createGain();

  output.gain.setValueAtTime(0.0001, now);
  output.gain.exponentialRampToValueAtTime(0.2, now + 0.12);
  output.gain.setValueAtTime(0.11, now + duration * (0.45 + Math.random() * 0.18));
  output.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(850 + Math.random() * 500, now);
  filter.frequency.linearRampToValueAtTime(520 + Math.random() * 430, now + duration);
  filter.Q.value = 1.6 + Math.random() * 1.4;

  carrier.type = Math.random() < 0.5 ? "sawtooth" : "triangle";
  carrier.frequency.setValueAtTime(startingPitch, now);
  carrier.frequency.exponentialRampToValueAtTime(endingPitch, now + duration);
  carrier.frequency.setValueAtTime(endingPitch * (1.2 + Math.random() * 0.45), now + duration * 0.57);
  carrier.frequency.exponentialRampToValueAtTime(endingPitch * 0.82, now + duration);
  overtone.type = "sine";
  overtone.frequency.setValueAtTime(startingPitch * (1.35 + Math.random() * 0.4), now);
  overtone.frequency.exponentialRampToValueAtTime(endingPitch * 1.6, now + duration);
  wobble.type = "sine";
  wobble.frequency.setValueAtTime(4 + Math.random() * 6, now);
  wobbleDepth.gain.value = 22 + Math.random() * 40;

  wobble.connect(wobbleDepth);
  wobbleDepth.connect(carrier.frequency);
  carrier.connect(filter);
  overtone.connect(filter);
  filter.connect(output);
  output.connect(audio.destination);

  carrier.start(now);
  overtone.start(now);
  wobble.start(now);
  carrier.stop(now + duration);
  overtone.stop(now + duration);
  wobble.stop(now + duration);
}

/** Start a low, slowly pulsing UFO hum. The returned function fades it out. */
export async function startUfoDrone(): Promise<() => void> {
  const audio = await getAudioContext();
  const now = audio.currentTime;
  const output = audio.createGain();
  const filter = audio.createBiquadFilter();
  const low = audio.createOscillator();
  const high = audio.createOscillator();
  const lfo = audio.createOscillator();
  const lfoDepth = audio.createGain();

  output.gain.setValueAtTime(0.0001, now);
  output.gain.exponentialRampToValueAtTime(0.12, now + 0.35);
  filter.type = "lowpass";
  filter.frequency.value = 700;
  low.type = "sine";
  low.frequency.value = 54;
  high.type = "triangle";
  high.frequency.value = 81;
  lfo.type = "sine";
  lfo.frequency.value = 0.28;
  lfoDepth.gain.value = 0.045;

  lfo.connect(lfoDepth);
  lfoDepth.connect(output.gain);
  low.connect(filter);
  high.connect(filter);
  filter.connect(output);
  output.connect(audio.destination);
  low.start(now);
  high.start(now);
  lfo.start(now);

  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    const stopAt = audio.currentTime;
    output.gain.cancelScheduledValues(stopAt);
    output.gain.setTargetAtTime(0.0001, stopAt, 0.12);
    low.stop(stopAt + 0.55);
    high.stop(stopAt + 0.55);
    lfo.stop(stopAt + 0.55);
  };
}

/** A slow, layered alien choir that drifts in and out of tune. */
export async function startAlienChorus(): Promise<() => void> {
  const audio = await getAudioContext();
  const now = audio.currentTime;
  const output = audio.createGain();
  const filter = audio.createBiquadFilter();
  const oscillators: OscillatorNode[] = [];
  const lfos: OscillatorNode[] = [];
  const depths: GainNode[] = [];

  output.gain.setValueAtTime(0.0001, now);
  output.gain.exponentialRampToValueAtTime(0.12, now + 1.8);
  filter.type = "lowpass";
  filter.frequency.value = 1100;
  filter.connect(output);
  output.connect(audio.destination);

  [110, 164.81, 220].forEach((frequency, index) => {
    const voice = audio.createOscillator();
    const voiceGain = audio.createGain();
    const lfo = audio.createOscillator();
    const depth = audio.createGain();
    voice.type = index === 1 ? "triangle" : "sine";
    voice.frequency.value = frequency;
    voiceGain.gain.value = index === 1 ? 0.45 : 0.3;
    lfo.type = "sine";
    lfo.frequency.value = 0.07 + index * 0.035;
    depth.gain.value = 5 + index * 2;
    lfo.connect(depth);
    depth.connect(voice.frequency);
    voice.connect(voiceGain);
    voiceGain.connect(filter);
    voice.start(now);
    lfo.start(now);
    oscillators.push(voice);
    lfos.push(lfo);
    depths.push(depth);
  });

  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    const stopAt = audio.currentTime;
    output.gain.cancelScheduledValues(stopAt);
    output.gain.setTargetAtTime(0.0001, stopAt, 0.8);
    oscillators.forEach((oscillator) => oscillator.stop(stopAt + 4));
    lfos.forEach((oscillator) => oscillator.stop(stopAt + 4));
    window.setTimeout(() => {
      filter.disconnect();
      output.disconnect();
      depths.forEach((depth) => depth.disconnect());
    }, 5000);
  };
}

/** An eerie, slowly drifting FM synth signal for the space radio bed. */
export async function startRadioSynth(): Promise<() => void> {
  const audio = await getAudioContext();
  const now = audio.currentTime;
  const carrierA = audio.createOscillator();
  const carrierB = audio.createOscillator();
  const modulatorA = audio.createOscillator();
  const modulatorB = audio.createOscillator();
  const slowDrift = audio.createOscillator();
  const panDrift = audio.createOscillator();
  const depthA = audio.createGain();
  const depthB = audio.createGain();
  const driftA = audio.createGain();
  const driftB = audio.createGain();
  const filter = audio.createBiquadFilter();
  const output = audio.createGain();
  const delay = audio.createDelay(0.8);
  const echoGain = audio.createGain();
  const feedback = audio.createGain();
  const panner = audio.createStereoPanner();
  const panDepth = audio.createGain();

  carrierA.type = "sine";
  carrierA.frequency.value = 172;
  carrierB.type = "triangle";
  carrierB.frequency.value = 247;
  modulatorA.type = "sine";
  modulatorA.frequency.value = 47;
  modulatorB.type = "sine";
  modulatorB.frequency.value = 68.5;
  depthA.gain.value = 118;
  depthB.gain.value = 156;
  slowDrift.type = "sine";
  slowDrift.frequency.value = 0.11;
  driftA.gain.value = 32;
  driftB.gain.value = 44;
  panDrift.type = "sine";
  panDrift.frequency.value = 0.075;
  panDepth.gain.value = 0.72;

  filter.type = "lowpass";
  filter.frequency.value = 1900;
  filter.Q.value = 1.4;
  output.gain.setValueAtTime(0.0001, now);
  output.gain.exponentialRampToValueAtTime(0.12, now + 1.6);
  echoGain.gain.value = 0.2;
  feedback.gain.value = 0.24;
  delay.delayTime.value = 0.34;

  modulatorA.connect(depthA);
  depthA.connect(carrierA.frequency);
  modulatorB.connect(depthB);
  depthB.connect(carrierB.frequency);
  slowDrift.connect(driftA);
  slowDrift.connect(driftB);
  driftA.connect(depthA.gain);
  driftB.connect(depthB.gain);
  carrierA.connect(filter);
  carrierB.connect(filter);
  filter.connect(output);
  output.connect(panner);
  panner.connect(audio.destination);
  panner.connect(delay);
  delay.connect(echoGain);
  echoGain.connect(panner);
  echoGain.connect(feedback);
  feedback.connect(delay);
  panDrift.connect(panDepth);
  panDepth.connect(panner.pan);

  [carrierA, carrierB, modulatorA, modulatorB, slowDrift, panDrift].forEach((oscillator) => oscillator.start(now));

  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    const stopAt = audio.currentTime;
    output.gain.cancelScheduledValues(stopAt);
    output.gain.setTargetAtTime(0.0001, stopAt, 0.55);
    [carrierA, carrierB, modulatorA, modulatorB, slowDrift, panDrift].forEach((oscillator) => oscillator.stop(stopAt + 3));
    window.setTimeout(() => {
      filter.disconnect();
      output.disconnect();
      delay.disconnect();
      echoGain.disconnect();
      feedback.disconnect();
      panner.disconnect();
      depthA.disconnect();
      depthB.disconnect();
      driftA.disconnect();
      driftB.disconnect();
      panDepth.disconnect();
    }, 3500);
  };
}
