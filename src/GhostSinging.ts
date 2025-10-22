// C1 - B8
const notes = [
  16.35,
  17.32,
  18.35,
  19.45,
  20.6,
  21.83,
  23.12,
  24.5,
  25.96,
  27.5,
  29.14,
  30.87,
  16.35 * 2,
  17.32 * 2,
  18.35 * 2,
  19.45 * 2,
  20.6 * 2,
  21.83 * 2,
  23.12 * 2,
  24.5 * 2,
  25.96 * 2,
  27.5 * 2,
  29.14 * 2,
  30.87 * 2,
  16.35 * 4,
  17.32 * 4,
  18.35 * 4,
  19.45 * 4,
  20.6 * 4,
  21.83 * 4,
  23.12 * 4,
  24.5 * 4,
  25.96 * 4,
  27.5 * 4,
  29.14 * 4,
  30.87 * 4,
];

const spookyScale = [
  9,
  11,
  12,
  15,
  16,
  17,
  20,
  21,
  12 + 9,
  12 + 11,
  12 + 12,
  12 + 15,
  12 + 16,
  12 + 17,
  12 + 20,
  12 + 21,
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
  oscillator.frequency.setValueAtTime(
    notes[spookyScale[0]] * Math.pow(2, 4),
    audioCtx.currentTime,
  ); // Default frequency
  gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
  lfo.frequency.setValueAtTime(5, audioCtx.currentTime); // 5 Hz vibrato
  lfoGain.gain.setValueAtTime(5, audioCtx.currentTime); //
  lfo.connect(lfoGain);
  lfoGain.connect(oscillator.frequency);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();
  lfo.start();

  // oscillator.connect(audioCtx.destination);

  if (
    "requestPermission" in DeviceOrientationEvent &&
    typeof DeviceOrientationEvent.requestPermission === "function"
  ) {
    // iOS 13+
    DeviceOrientationEvent.requestPermission()
      .then((response: string) => {
        if (response === "granted") {
          let i = 0;
          window.addEventListener("deviceorientation", (e) => {
            i++;
            if (i % 20 === 0)
              console.log(
                `Orientation: alpha=${e.alpha} beta=${e.beta} gamma=${e.gamma}`,
              );
            if (e.beta) {
              currentValue = ((e.beta + 360) % 360) / 360; // Normalize to 0 - 1
              const frequency = valueToSpookyScale(currentValue);
              oscillator.frequency.setTargetAtTime(
                frequency,
                audioCtx.currentTime,
                0.01,
              );
            }
          });
        } else {
          console.log("Device orientation permission denied.");
        }
      })
      .catch(console.error);
  }

  // setInterval(() => {
  //   const value = Math.random();
  //   const frequency = valueToSpookyScale(value);
  //   oscillator.frequency.setTargetAtTime(frequency, audioCtx.currentTime, 0.01);
  // }, 1000);
  return () => {
    oscillator.stop();
    lfo.stop();
    audioCtx.close();
    console.log("Stopped ghost singing");
  };
}

function valueToSpookyScale(value: number) {
  // value is 0 - 1
  // map to 0 - length of scale
  const index = Math.floor(value * (spookyScale.length - 1));
  return notes[spookyScale[index]] * Math.pow(2, 4);
}
