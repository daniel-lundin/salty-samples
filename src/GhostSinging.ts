// C1 - B8
const notes = [
  16.35, 17.32, 18.35, 19.45, 20.6, 21.83, 23.12, 24.5, 25.96, 27.5, 29.14,
  30.87,
];

const spookyScale = [
  0,
  2,
  3,
  6,
  7,
  8,
  11,
  12, // C harmonic minor (sharp 4)
];

export function startGhostSinging() {
  console.log("Starting ghost song...");

  let currentValue = 0;

  // Create a sinewave osciallator with a connected LFO for vibrato
  const audioCtx = new window.AudioContext();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // Default frequency
  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
  lfo.frequency.setValueAtTime(5, audioCtx.currentTime); // 5 Hz vibrato
  lfoGain.gain.setValueAtTime(5, audioCtx.currentTime); //
  lfo.connect(lfoGain);
  lfoGain.connect(oscillator.frequency);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();
  lfo.start();

  oscillator.connect(audioCtx.destination);

  window.addEventListener("deviceorientation", (e) => {
    if (e.alpha) {
      currentValue = (e.alpha % 360) / 360; // Normalize to 0 - 1
      const frequency = valueToSpookyScale(currentValue);
      oscillator.frequency.setTargetAtTime(
        frequency,
        audioCtx.currentTime,
        0.01,
      );
    }
  });

  // setInterval(() => {
  //   const value = Math.random();
  //   const frequency = valueToSpookyScale(value);
  //   oscillator.frequency.setTargetAtTime(frequency, audioCtx.currentTime, 0.01);
  // }, 1000);
}

function valueToSpookyScale(value: number) {
  // value is 0 - 1
  // map to 0 - length of scale
  const index = Math.floor(value * (spookyScale.length - 1));
  return notes[spookyScale[index]] * Math.pow(2, 4);
}
