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
import { playSpaceLaser } from "./SpaceLaser.ts";
import { startAlienSinging } from "./AlienSinging.ts";
import { startSignalAmbience } from "./SignalAmbience.ts";
import {
  startAlienChorus,
  startRadioStatic,
  startUfoDrone,
  playAlienTransmission,
  playRadiationCounter,
} from "./SpaceSounds.ts";

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
const spaceAmbiences = [
  { key: "ufo", label: "UFO-drönare", start: startUfoDrone },
  { key: "chorus", label: "Alienkör", start: startAlienChorus },
  { key: "static", label: "Rymdradio", start: startRadioStatic },
  { key: "singing", label: "Alien sång", start: startAlienSinging },
];

type Theme = "pirate" | "space";
const themeStorageKey = "salty-samples-theme";

function getSavedTheme(): Theme {
  try {
    return localStorage.getItem(themeStorageKey) === "space" ? "space" : "pirate";
  } catch {
    return "pirate";
  }
}

function App() {
  const [theme, setTheme] = useState<Theme>(getSavedTheme);
  const isSpaceTheme = theme === "space";
  const [loopsPlaying, setLoopsPlaying] = useState<boolean[]>(
    loops.map(() => false),
  );
  const ambienceStops = useRef<Record<string, () => void>>({});
  const signalAmbienceStop = useRef<(() => void) | null>(null);
  const pendingAmbiences = useRef(new Set<string>());
  const ambienceEpoch = useRef(0);
  const ghostSinging = useRef<() => void | null>(null);
  const [ambiencesPlaying, setAmbiencesPlaying] = useState<Record<string, boolean>>({});
  const [signalsPlaying, setSignalsPlaying] = useState(false);
  useEffect(() => {
    oneShots.forEach(({ player }) => {
      void player.load();
    });
    loops.forEach(({ player }) => {
      void player.load();
      player.setLooping(true);
    });

    return () => {
      loops.forEach(({ player }) => player.stopAll());
      Object.values(ambienceStops.current).forEach((stop) => stop());
      signalAmbienceStop.current?.();
      ghostSinging.current?.();
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(themeStorageKey, theme);
    } catch {
      // Keep the selected theme for this session if storage is unavailable.
    }
  }, [theme]);

  function selectTheme(nextTheme: Theme) {
    if (nextTheme === theme) return;
    ambienceEpoch.current += 1;
    oneShots.forEach(({ player }) => player.stopAll());
    loops.forEach(({ player }) => player.stopAll());
    setLoopsPlaying(loops.map(() => false));
    Object.values(ambienceStops.current).forEach((stop) => stop());
    ambienceStops.current = {};
    setAmbiencesPlaying({});
    signalAmbienceStop.current?.();
    signalAmbienceStop.current = null;
    setSignalsPlaying(false);
    ghostSinging.current?.();
    ghostSinging.current = null;
    setTheme(nextTheme);
  }

  async function toggleAmbience(key: string, start: () => Promise<() => void>) {
    const stop = ambienceStops.current[key];
    if (stop) {
      stop();
      delete ambienceStops.current[key];
      setAmbiencesPlaying((playing) => ({ ...playing, [key]: false }));
      return;
    }
    if (pendingAmbiences.current.has(key)) return;
    pendingAmbiences.current.add(key);
    const startEpoch = ambienceEpoch.current;
    try {
      const stopAmbience = await start();
      if (startEpoch !== ambienceEpoch.current) {
        stopAmbience();
        return;
      }
      ambienceStops.current[key] = stopAmbience;
      setAmbiencesPlaying((playing) => ({ ...playing, [key]: true }));
    } finally {
      pendingAmbiences.current.delete(key);
    }
  }
  function toggleGhostSinging() {
    if (ghostSinging.current) {
      ghostSinging.current();
      ghostSinging.current = null;
    } else {
      ghostSinging.current = startGhostSinging();
    }
  }

  return (
    <main
      className={`app-shell ${isSpaceTheme ? "theme-space" : "theme-pirate"}`}
    >
      <header className="app-header">
        <p className="eyebrow">
          {isSpaceTheme ? "GALAKTISK LJUDPANEL" : "PIRATERNAS LJUDPANEL"}
        </p>
        <h1>{isSpaceTheme ? "Cosmic Samples" : "SaltySamples"}</h1>
        <p className="tagline">
          {isSpaceTheme
            ? "Signaler från en avlägsen galax"
            : "Ljud från de sju haven"}
        </p>
        <nav className="theme-switcher" aria-label="Välj tema">
          <button
            type="button"
            aria-pressed={!isSpaceTheme}
            className={!isSpaceTheme ? "selected" : ""}
            onClick={() => selectTheme("pirate")}
          >
            Pirat
          </button>
          <button
            type="button"
            aria-pressed={isSpaceTheme}
            className={isSpaceTheme ? "selected" : ""}
            onClick={() => selectTheme("space")}
          >
            Rymd
          </button>
        </nav>
      </header>
      <div className="container">
        <div className="section">
          <div className="section-header">
            <div className="section-rule"></div>
            <h2>{isSpaceTheme ? "Signaler" : "Ljud"}</h2>
            <div className="section-rule"></div>
          </div>
          <div className="buttons">
            {!isSpaceTheme && oneShots.map(({ player, name }) => (
              <button key={name} onClick={() => player.play()}>
                {name}
              </button>
            ))}
            {isSpaceTheme && (
              <>
                <button onClick={() => void playSpaceLaser()}>Rymdlaser</button>
                <button onClick={() => void playRadiationCounter()}>
                  Strålningsmätare
                </button>
                <button onClick={() => void playAlienTransmission()}>
                  Alienkontakt
                </button>
                <button
                  className={signalsPlaying ? "playing" : ""}
                  onClick={() => {
                    if (signalAmbienceStop.current) {
                      signalAmbienceStop.current();
                      signalAmbienceStop.current = null;
                      setSignalsPlaying(false);
                    } else {
                      signalAmbienceStop.current = startSignalAmbience();
                      setSignalsPlaying(true);
                    }
                  }}
                >
                  {signalsPlaying ? <PauseIcon /> : <PlayIcon />} Slumpmässiga signaler
                </button>
              </>
            )}
          </div>
        </div>

        <div className="section">
          <div className="section-header">
            <div className="section-rule"></div>
            <h2>{isSpaceTheme ? "Omgivning" : "Bakgrunder"}</h2>
            <div className="section-rule"></div>
          </div>
          <div className="buttons">
            {!isSpaceTheme && loops.map(({ player, name }, index) => (
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
            {isSpaceTheme && spaceAmbiences.map(({ key, label, start }) => (
              <button
                key={key}
                className={ambiencesPlaying[key] ? "playing" : ""}
                onClick={() => void toggleAmbience(key, start)}
              >
                {ambiencesPlaying[key] ? <PauseIcon /> : <PlayIcon />} {label}
              </button>
            ))}
            {!isSpaceTheme && <button
              onClick={() => {
                toggleGhostSinging();
              }}
            >
              Spöksång
            </button>}
          </div>
        </div>
      </div>
    </main>
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
