import { useCallback, useEffect, useRef, useState } from 'react';
import { isaiAudio } from './audio/isaiEngine';
import { DrivingHud } from './components/DrivingHud';
import { GarageOverlay } from './components/GarageOverlay';
import { PauseAndVictoryModal } from './components/PauseAndVictoryModal';
import { TitleScreen } from './components/TitleScreen';
import { DEFAULT_CUSTOMIZATION } from './data/i18n';
import { ThamizhagamGameEngine } from './three/GameEngine';
import {
  CameraMode,
  CarCustomization,
  GameMode,
  GamePhase,
  LandmarkId,
  Language,
  RadioStationId,
  TelemetryData,
  TouchInputState,
} from './types/game';

const STORAGE_KEYS = {
  lang: 'tn_drive_lang_v1',
  car: 'tn_drive_car_v1',
  bestRace: 'tn_drive_best_ms_v1',
};

const INITIAL_TELEMETRY: TelemetryData = {
  speedKmh: 0,
  gear: 'N',
  rpmRatio: 0,
  nitro: 100,
  isDrifting: false,
  isBoosting: false,
  playerX: 162,
  playerZ: -312,
  playerHeading: 0,
  altitudeM: 50,
  nearestLandmarkId: 'chennai',
  nearestLandmarkDistM: 0,
  activeBannerLandmarkId: null,
  discoveredLandmarks: [],
  raceElapsedMs: 0,
  raceCountdown: 0,
  checkpointIndex: 0,
  totalCheckpoints: 5,
  checkpointTargetX: 105,
  checkpointTargetZ: -35,
  splitTimesMs: [],
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ThamizhagamGameEngine | null>(null);

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.lang);
    return saved === 'en' || saved === 'ta' ? saved : 'ta';
  });

  const [customization, setCustomization] = useState<CarCustomization>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.car);
      if (raw) {
        return { ...DEFAULT_CUSTOMIZATION, ...JSON.parse(raw) };
      }
    } catch {
      // Fallback to default customization
    }
    return DEFAULT_CUSTOMIZATION;
  });

  const [bestRaceMs, setBestRaceMs] = useState<number | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.bestRace);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  });

  const [phase, setPhase] = useState<GamePhase>('title');
  const [mode, setMode] = useState<GameMode>('freeroam');
  const [cameraMode, setCameraMode] = useState<CameraMode>('chase');
  const [station, setStation] = useState<RadioStationId>('marabu');
  const [muted, setMuted] = useState<boolean>(false);
  const [musicVolume, setMusicVolume] = useState<number>(0.68);
  const [sfxVolume, setSfxVolume] = useState<number>(0.58);
  const [hudCollapsed, setHudCollapsed] = useState<boolean>(false);

  const [telemetry, setTelemetry] = useState<TelemetryData>(INITIAL_TELEMETRY);
  const [lastRaceMs, setLastRaceMs] = useState<number>(0);
  const [lastSplitsMs, setLastSplitsMs] = useState<number[]>([]);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  // Keep refs synced for stable keyboard shortcut callbacks inside Three.js engine
  const phaseRef = useRef<GamePhase>(phase);
  phaseRef.current = phase;
  const bestRaceRef = useRef<number | null>(bestRaceMs);
  bestRaceRef.current = bestRaceMs;

  const handleToggleLanguage = useCallback((nextLang: Language) => {
    setLanguage(nextLang);
    localStorage.setItem(STORAGE_KEYS.lang, nextLang);
    document.documentElement.lang = nextLang;
  }, []);

  const handleCustomizationChange = useCallback((next: CarCustomization) => {
    setCustomization(next);
    localStorage.setItem(STORAGE_KEYS.car, JSON.stringify(next));
    engineRef.current?.updateCustomization(next);
  }, []);

  const handleCycleStation = useCallback(() => {
    isaiAudio.init();
    const next = isaiAudio.cycleStation();
    setStation(next);
  }, []);

  const handleSelectStation = useCallback((st: RadioStationId) => {
    isaiAudio.init();
    isaiAudio.setStation(st);
    setStation(st);
  }, []);

  const handleToggleMute = useCallback(() => {
    isaiAudio.init();
    setMuted((prev) => {
      const next = !prev;
      isaiAudio.setMuted(next);
      return next;
    });
  }, []);

  const handleMusicVol = useCallback((v: number) => {
    setMusicVolume(v);
    isaiAudio.setMusicVolume(v);
  }, []);

  const handleSfxVol = useCallback((v: number) => {
    setSfxVolume(v);
    isaiAudio.setSfxVolume(v);
  }, []);

  // Initialize isolated Three.js WebGL Engine once
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const engine = new ThamizhagamGameEngine(mount, customization, {
      onTelemetry: (data) => {
        setTelemetry(data);
      },
      onRaceFinish: (totalMs, splits) => {
        setLastRaceMs(totalMs);
        setLastSplitsMs(splits);
        const currentBest = bestRaceRef.current;
        if (currentBest === null || totalMs < currentBest) {
          setBestRaceMs(totalMs);
          setIsNewRecord(true);
          localStorage.setItem(STORAGE_KEYS.bestRace, String(Math.round(totalMs)));
        } else {
          setIsNewRecord(false);
        }
        setPhase('victory');
      },
      onKeyShortcut: (action) => {
        if (action === 'pause') {
          if (phaseRef.current === 'playing') {
            engine.setPhase('paused');
            setPhase('paused');
          } else if (phaseRef.current === 'paused') {
            engine.setPhase('playing');
            setPhase('playing');
          }
        } else if (action === 'station') {
          const nextSt = isaiAudio.cycleStation();
          setStation(nextSt);
        } else if (action === 'mute') {
          setMuted((prev) => {
            const next = !prev;
            isaiAudio.setMuted(next);
            return next;
          });
        } else if (action === 'hud') {
          setHudCollapsed((prev) => !prev);
        } else if (action === 'camera') {
          // Camera mode already cycled inside engine; sync label
          setCameraMode((prev) => {
            const order: CameraMode[] = ['chase', 'hood', 'cinematic'];
            return order[(order.indexOf(prev) + 1) % order.length];
          });
        }
      },
    });

    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
    // Mount once so React UI updates never re-create WebGL canvas!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartDrive = useCallback(() => {
    isaiAudio.init();
    engineRef.current?.startSession(mode, 'chennai');
    setPhase('playing');
  }, [mode]);

  const handleOpenGarage = useCallback(() => {
    isaiAudio.init();
    engineRef.current?.setPhase('garage');
    setPhase('garage');
  }, []);

  const handleBackToTitle = useCallback(() => {
    engineRef.current?.setPhase('title');
    setPhase('title');
  }, []);

  const handleResume = useCallback(() => {
    engineRef.current?.setPhase('playing');
    setPhase('playing');
  }, []);

  const handleRestart = useCallback(() => {
    engineRef.current?.startSession(mode, 'chennai');
    setPhase('playing');
  }, [mode]);

  const handleSwitchToFreeRoam = useCallback(() => {
    setMode('freeroam');
    engineRef.current?.startSession('freeroam', 'kanyakumari');
    setPhase('playing');
  }, []);

  const handleCycleCamera = useCallback(() => {
    const next = engineRef.current?.cycleCameraMode();
    if (next) setCameraMode(next);
  }, []);

  const handleResetCar = useCallback(() => {
    engineRef.current?.resetCarToNearestRoad();
  }, []);

  const handleTeleport = useCallback((id: LandmarkId) => {
    engineRef.current?.teleportToLandmark(id);
    setPhase('playing');
  }, []);

  const handleTouchInput = useCallback((partial: Partial<TouchInputState>) => {
    isaiAudio.init();
    engineRef.current?.setTouchInput(partial);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#070b14]">
      {/* Isolated Three.js WebGL Mount Container */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full"
        aria-label="3D Tamil Nadu Driving Viewport"
      />

      {/* Semantic Low-Occlusion Game Shell Overlays */}
      {phase === 'title' && (
        <TitleScreen
          language={language}
          selectedMode={mode}
          customization={customization}
          station={station}
          muted={muted}
          bestRaceMs={bestRaceMs}
          onSelectMode={setMode}
          onToggleLanguage={handleToggleLanguage}
          onStartDrive={handleStartDrive}
          onOpenGarage={handleOpenGarage}
          onCycleStation={handleCycleStation}
          onToggleMute={handleToggleMute}
        />
      )}

      {phase === 'garage' && (
        <GarageOverlay
          language={language}
          customization={customization}
          onChange={handleCustomizationChange}
          onToggleLanguage={handleToggleLanguage}
          onBackToTitle={handleBackToTitle}
          onDriveNow={handleStartDrive}
        />
      )}

      {(phase === 'playing' || phase === 'paused' || phase === 'victory') && (
        <DrivingHud
          language={language}
          mode={mode}
          cameraMode={cameraMode}
          station={station}
          muted={muted}
          hudCollapsed={hudCollapsed}
          telemetry={telemetry}
          onToggleLanguage={handleToggleLanguage}
          onCycleStation={handleCycleStation}
          onToggleMute={handleToggleMute}
          onCycleCamera={handleCycleCamera}
          onResetCar={handleResetCar}
          onToggleHudCollapsed={() => setHudCollapsed((v) => !v)}
          onPause={() => {
            engineRef.current?.setPhase('paused');
            setPhase('paused');
          }}
          onTeleport={handleTeleport}
          onTouchInput={handleTouchInput}
        />
      )}

      {(phase === 'paused' || phase === 'victory') && (
        <PauseAndVictoryModal
          phase={phase}
          language={language}
          mode={mode}
          customization={customization}
          station={station}
          musicVolume={musicVolume}
          sfxVolume={sfxVolume}
          lastRaceMs={lastRaceMs}
          bestRaceMs={bestRaceMs}
          isNewRecord={isNewRecord}
          splitTimesMs={lastSplitsMs}
          onResume={handleResume}
          onRestart={handleRestart}
          onSwitchToFreeRoam={handleSwitchToFreeRoam}
          onOpenGarage={handleOpenGarage}
          onBackToTitle={handleBackToTitle}
          onSelectStation={handleSelectStation}
          onChangeMusicVol={handleMusicVol}
          onChangeSfxVol={handleSfxVol}
          onToggleLanguage={handleToggleLanguage}
          onTeleport={handleTeleport}
        />
      )}
    </main>
  );
}
