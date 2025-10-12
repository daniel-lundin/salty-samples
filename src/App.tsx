import "./App.css";
import { SamplePlayer } from "./SamplePlayer.tsx";
import { useEffect, useState } from "react";

import skeppsKlockaSample from "./assets/skeppsklocka.mp3";
import knarrSample from "./assets/knarr.mp3";
import vindSample from "./assets/vind.mp3";
import kanonSample from "./assets/kanon.mp3";
import temaSample from "./assets/tema-loop.mp3";
import toapapperSample from "./assets/toapapper.mp3";

const skeppsKlocka = new SamplePlayer(skeppsKlockaSample);
const knarr = new SamplePlayer(knarrSample);
const vind = new SamplePlayer(vindSample);

const kanon = new SamplePlayer(kanonSample);
const toapapper = new SamplePlayer(toapapperSample);
const temaLoop = new SamplePlayer(temaSample);
knarr.toggleLooping();
vind.toggleLooping();
temaLoop.toggleLooping();

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
    });
  }, []);

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
                {loopsPlaying[index] ? "⏸" : "▶"} {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
