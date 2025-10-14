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

export function startGhostSong() {
  console.log("Starting ghost song...");
  if (!("Gyroscope" in window)) {
    console.error("Gyroscope not supported");
    return;
  }
  let gyroscope = new Gyroscope({ frequency: 60 });

  let currentValue = 0;
  gyroscope.addEventListener("reading", (e) => {
    console.log("Gyroscope data: ", gyroscope.x, gyroscope.y, gyroscope.z);
  });
  gyroscope.start();

  window.addEventListener("deviceorientation", (e) => {
    console.log("deviceorientation", e.alpha, e.beta, e.gamma);
  });

  const sensor = new AbsoluteOrientationSensor({ frequency: 60 });
  sensor.addEventListener("reading", () => {
    const q = sensor.quaternion;
    console.log("Orientation quaternion:", q);
  });
  sensor.start();
}

function valueToSpookyScale(value: number) {
  // value is 0 - 1
  // map to 0 - length of scale
  const index = Math.floor(value * (spookyScale.length - 1));
  return spookyScale[index];
}
