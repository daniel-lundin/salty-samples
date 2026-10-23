import { watchAudioContext } from "./AudioLifecycle.ts";

let audioContext: AudioContext | undefined;

export async function playSpaceLaser(): Promise<void> {
  audioContext ??= new window.AudioContext();
  watchAudioContext(audioContext);

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  const now = audioContext.currentTime;
  const duration = 0.85 + Math.random() * 0.35;
  const startFrequency = 620 + Math.random() * 360;
  const endFrequency = 42 + Math.random() * 28;
  const oscillator = audioContext.createOscillator();
  const subOscillator = audioContext.createOscillator();
  const impactNoise = audioContext.createBufferSource();
  const noiseFilter = audioContext.createBiquadFilter();
  const noiseGain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  const distortion = audioContext.createWaveShaper();
  const gain = audioContext.createGain();
  const subGain = audioContext.createGain();
  const compressor = audioContext.createDynamicsCompressor();

  const distortionCurve = new Float32Array(2048);
  for (let i = 0; i < distortionCurve.length; i += 1) {
    const x = (i * 2) / distortionCurve.length - 1;
    distortionCurve[i] = Math.tanh(x * 3.5);
  }
  distortion.curve = distortionCurve;
  distortion.oversample = "4x";

  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(startFrequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
  subOscillator.type = "sine";
  subOscillator.frequency.setValueAtTime(128 + Math.random() * 35, now);
  subOscillator.frequency.exponentialRampToValueAtTime(38 + Math.random() * 18, now + duration);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(5800, now);
  filter.frequency.exponentialRampToValueAtTime(240, now + duration);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.8, now + 0.018);
  gain.gain.setValueAtTime(0.58, now + duration * 0.42);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  subGain.gain.setValueAtTime(0.0001, now);
  subGain.gain.exponentialRampToValueAtTime(0.7, now + 0.025);
  subGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.88);

  const noiseBuffer = audioContext.createBuffer(1, Math.floor(audioContext.sampleRate * 0.12), audioContext.sampleRate);
  const noiseSamples = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseSamples.length; i += 1) {
    noiseSamples[i] = Math.random() * 2 - 1;
  }
  impactNoise.buffer = noiseBuffer;
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = 1700;
  noiseGain.gain.setValueAtTime(0.42, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

  compressor.threshold.value = -12;
  compressor.knee.value = 8;
  compressor.ratio.value = 8;
  compressor.attack.value = 0.004;
  compressor.release.value = 0.22;

  oscillator.connect(filter);
  filter.connect(distortion);
  distortion.connect(gain);
  gain.connect(compressor);
  subOscillator.connect(subGain);
  subGain.connect(compressor);
  impactNoise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(compressor);
  compressor.connect(audioContext.destination);

  oscillator.start(now);
  subOscillator.start(now);
  impactNoise.start(now);
  oscillator.stop(now + duration);
  subOscillator.stop(now + duration);
  impactNoise.stop(now + 0.12);
}
