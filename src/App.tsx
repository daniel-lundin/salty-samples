import "./App.css";
import { SamplePlayer } from "./SamplePlayer.tsx";
import { useEffect, useRef, useState } from "react";

import skeppsKlockaSample from "./assets/skeppsklocka.mp3";
import kanonSample from "./assets/kanon.mp3";
import toapapperSample from "./assets/toapapper.mp3";
import gladPiratSample from "./assets/gladpirat.mp3";

import vindSample from "./assets/vind.mp3";
import knarrSample from "./assets/knarr.mp3";
import temaSample from "./assets/tema-loop.mp3";
import kalleTeodorSample from "./assets/kalle-teodor.mp3";
import crowFleeSample from "./assets/kråkor-flyr.mp3";
import { startGhostSinging } from "./GhostSinging.ts";

const skeppsKlocka = new SamplePlayer(skeppsKlockaSample, 0.7);
const kanon = new SamplePlayer(kanonSample, 2);
const toapapper = new SamplePlayer(toapapperSample);
const gladPirat = new SamplePlayer(gladPiratSample);
const crowFlee = new SamplePlayer(crowFleeSample, 0.5);

const knarr = new SamplePlayer(knarrSample);
const vind = new SamplePlayer(vindSample);
const temaLoop = new SamplePlayer(temaSample);
const kalleTeodor = new SamplePlayer(kalleTeodorSample);

const oneShots = [
  { player: skeppsKlocka, name: "Klocka" },
  {
    player: kanon,
    name: "Kanon",
  },
  {
    player: toapapper,
    name: "Arg pirat",
  },
  {
    player: gladPirat,
    name: "Glad pirat",
  },
  {
    player: crowFlee,
    name: "Kråkor flyr",
  },
];
const loops = [
  {
    player: knarr,
    name: "Knarr",
  },
  {
    player: vind,
    name: "Vind",
  },
  {
    player: temaLoop,
    name: "Tema",
  },
  {
    player: kalleTeodor,
    name: "Kalle Teodor",
  },
];

function App() {
  const [loopsPlaying, setLoopsPlaying] = useState<boolean[]>(
    loops.map(() => false),
  );
  useEffect(() => {
    oneShots.forEach(({ player }) => {
      player.load();
    });
    loops.forEach(({ player }) => {
      player.load();
      player.toggleLooping();
    });
  }, []);

  const ghostSinging = useRef<() => void | null>(null);
  function toggleGhostSinging() {
    if (ghostSinging.current) {
      ghostSinging.current();
      ghostSinging.current = null;
    } else {
      ghostSinging.current = startGhostSinging();
    }
  }

  return (
    <>
      <header>
        <h1>SaltySamples</h1>
      </header>
      <div className="container">
        <div className="section">
          <div className="section-header">
            <div className="rope-line"></div>
            <h2>Ljud</h2>
            <div className="rope-line"></div>
          </div>
          <div className="buttons">
            {oneShots.map(({ player, name }) => (
              <button key={name} onClick={() => player.play()}>
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section-header">
            <div className="rope-line"></div>
            <h2>Bakgrunder</h2>
            <div className="rope-line"></div>
          </div>
          <div className="buttons">
            {loops.map(({ player, name }, index) => (
              <button
                key={name}
                className={loopsPlaying[index] ? "playing" : ""}
                onClick={() => {
                  const isPlaying = loopsPlaying[index];
                  if (isPlaying) {
                    player.stopAll();
                  } else {
                    player.resumeContextIfNeeded().then(() => player.play());
                  }
                  const newLoopsPlaying = [...loopsPlaying];
                  newLoopsPlaying[index] = !isPlaying;
                  setLoopsPlaying(newLoopsPlaying);
                }}
              >
                {loopsPlaying[index] ? <PauseIcon /> : <PlayIcon />} {name}
              </button>
            ))}
            <button
              onClick={() => {
                toggleGhostSinging();
              }}
            >
              Spöksång
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function PlayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width="16"
      height="16"
      fill="currentColor"
      aria-label="Play"
    >
      <polygon points="16,8 56,32 16,56" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width="16"
      height="16"
      fill="currentColor"
      aria-label="Pause"
    >
      <rect x="16" y="8" width="10" height="48" rx="2" />
      <rect x="38" y="8" width="10" height="48" rx="2" />
    </svg>
  );
}

export default App;
