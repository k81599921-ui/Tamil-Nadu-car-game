import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Gamepad2,
  Music,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { isaiAudio } from '../audio/isaiEngine';
import { LANDMARKS, RADIO_STATIONS, UI_TEXT } from '../data/i18n';
import {
  CameraMode,
  GameMode,
  LandmarkId,
  Language,
  RadioStationId,
  TelemetryData,
  TouchInputState,
} from '../types/game';
import { MiniMap } from './MiniMap';

interface DrivingHudProps {
  language: Language;
  mode: GameMode;
  cameraMode: CameraMode;
  station: RadioStationId;
  muted: boolean;
  hudCollapsed: boolean;
  telemetry: TelemetryData;
  onToggleLanguage: (lang: Language) => void;
  onCycleStation: () => void;
  onToggleMute: () => void;
  onCycleCamera: () => void;
  onResetCar: () => void;
  onToggleHudCollapsed: () => void;
  onPause: () => void;
  onTeleport: (id: LandmarkId) => void;
  onTouchInput: (partial: Partial<TouchInputState>) => void;
}

const RACE_SEQUENCE_IDS: LandmarkId[] = [
  'thanjavur',
  'madurai',
  'kanyakumari',
  'ooty',
  'chennai',
];

function formatRaceClock(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}

export const DrivingHud: React.FC<DrivingHudProps> = ({
  language,
  mode,
  cameraMode,
  station,
  muted,
  hudCollapsed,
  telemetry,
  onToggleLanguage,
  onCycleStation,
  onToggleMute,
  onCycleCamera,
  onResetCar,
  onToggleHudCollapsed,
  onPause,
  onTeleport,
  onTouchInput,
}) => {
  const t = UI_TEXT[language];
  const currentStation =
    RADIO_STATIONS.find((s) => s.id === station) || RADIO_STATIONS[0];

  const [showTouchPads, setShowTouchPads] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    return false;
  });

  // 5-bar real-time Web Audio Equalizer animated strictly via compositor transform: scaleY
  const barRefs = useRef<Array<HTMLSpanElement | null>>([]);
  useEffect(() => {
    const levels: [number, number, number, number, number] = [0.2, 0.2, 0.2, 0.2, 0.2];
    let raf = 0;
    const updateBars = () => {
      isaiAudio.getVisualizerBars(levels);
      for (let i = 0; i < 5; i++) {
        const el = barRefs.current[i];
        if (el) {
          el.style.transform = `scaleY(${levels[i].toFixed(2)})`;
        }
      }
      raf = requestAnimationFrame(updateBars);
    };
    raf = requestAnimationFrame(updateBars);
    return () => cancelAnimationFrame(raf);
  }, []);

  const activeCheckpointId: LandmarkId | null =
    mode === 'race' && telemetry.checkpointIndex < RACE_SEQUENCE_IDS.length
      ? RACE_SEQUENCE_IDS[telemetry.checkpointIndex]
      : null;

  const nearestLm = LANDMARKS[telemetry.nearestLandmarkId];
  const bannerLm = telemetry.activeBannerLandmarkId
    ? LANDMARKS[telemetry.activeBannerLandmarkId]
    : null;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-3.5 md:p-5">
      {/* TOP PERIMETER CLUSTER */}
      <div className="flex items-start justify-between gap-3">
        {/* Top-Left: Tamil Nadu Mini-Map + Race / Tour Status */}
        <div className="flex flex-col gap-2">
          <MiniMap
            playerX={telemetry.playerX}
            playerZ={telemetry.playerZ}
            playerHeading={telemetry.playerHeading}
            mode={mode}
            discovered={telemetry.discoveredLandmarks}
            activeCheckpointId={activeCheckpointId}
            language={language}
            onTeleport={onTeleport}
          />

          {mode === 'race' ? (
            <div className="bg-[#090e1a]/92 border border-amber-500/30 rounded-xl px-3.5 py-2.5 pointer-events-auto w-[164px]">
              <div className="text-[10px] text-slate-400">
                {t.checkpoint} {Math.min(telemetry.checkpointIndex + 1, telemetry.totalCheckpoints)}/{telemetry.totalCheckpoints}
              </div>
              {activeCheckpointId && (
                <div className="text-xs font-bold text-amber-300 truncate mt-0.5">
                  {LANDMARKS[activeCheckpointId].name[language]}
                </div>
              )}
              <div className="mt-1.5 font-mono text-lg font-bold text-white tabular-nums">
                {formatRaceClock(telemetry.raceElapsedMs)}
              </div>
            </div>
          ) : (
            <div className="bg-[#090e1a]/90 border border-slate-800 rounded-xl px-3 py-2 pointer-events-auto w-[164px]">
              <div className="text-[10px] text-slate-400">{t.discoveredCount}</div>
              <div className="text-xs font-bold text-amber-300 tabular-nums mt-0.5">
                {telemetry.discoveredLandmarks.length} / 5{' '}
                <span className="text-slate-400 font-normal">
                  {language === 'ta' ? 'இடங்கள்' : 'Visited'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Top-Center: Cultural Landmark Discovery Banner & Race Countdown */}
        <div className="flex-1 flex flex-col items-center pointer-events-none px-2">
          {mode === 'race' && telemetry.raceCountdown > 0 && (
            <div className="mt-8 bg-[#090e1a]/95 border-2 border-amber-400 rounded-2xl px-8 py-4 shadow-2xl text-center">
              <div className="font-mono text-5xl font-extrabold text-amber-400 tabular-nums">
                {telemetry.raceCountdown}
              </div>
              <div className="text-xs text-slate-300 mt-1">
                {t.raceModeTitle}
              </div>
            </div>
          )}

          {bannerLm && (
            <div className="max-w-md bg-[#090e1a]/94 border border-amber-400/50 rounded-2xl px-5 py-3.5 shadow-2xl text-center transition-opacity duration-200">
              <div className="text-[11px] font-semibold text-amber-400">
                {t.landmarkReached} · {bannerLm.subtitle[language]}
              </div>
              <div className="text-base md:text-lg font-bold text-white mt-0.5">
                {bannerLm.name[language]}
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {bannerLm.description[language]}
              </p>
            </div>
          )}
        </div>

        {/* Top-Right: Single-Line Radio Bar + Camera + Language + Pause */}
        <div className="flex flex-wrap items-center justify-end gap-2 pointer-events-auto max-w-[520px]">
          {/* Live Isai FM Radio Bar */}
          <button
            type="button"
            onClick={onCycleStation}
            title="Next Radio Station (N)"
            className="flex items-center gap-2.5 bg-[#090e1a]/92 hover:bg-[#131d33] border border-amber-500/30 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Music className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="max-w-[145px] truncate">
              {currentStation.name[language]}
            </span>
            {/* 5-bar compositor-only visualizer */}
            <span className="flex items-end gap-0.5 h-3.5 ml-0.5" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((idx) => (
                <span
                  key={idx}
                  ref={(el) => {
                    barRefs.current[idx] = el;
                  }}
                  className="w-0.5 h-3.5 bg-amber-400 origin-bottom transition-transform duration-75"
                  style={{ transform: 'scaleY(0.25)' }}
                />
              ))}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            title="Mute / Unmute (M)"
            className="p-2 bg-[#090e1a]/92 hover:bg-[#131d33] border border-slate-700/90 rounded-xl text-slate-200 cursor-pointer shrink-0"
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-400" />
            )}
          </button>

          <button
            type="button"
            onClick={onCycleCamera}
            title={`${t.cameraBtn}: ${cameraMode}`}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#090e1a]/92 hover:bg-[#131d33] border border-slate-700/90 rounded-xl text-xs font-medium text-slate-200 cursor-pointer whitespace-nowrap shrink-0 hidden sm:flex"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span className="capitalize">{cameraMode}</span>
          </button>

          <button
            type="button"
            onClick={onResetCar}
            title={t.resetCar}
            className="p-2 bg-[#090e1a]/92 hover:bg-[#131d33] border border-slate-700/90 rounded-xl text-slate-200 cursor-pointer shrink-0"
          >
            <RotateCcw className="w-4 h-4 text-slate-300" />
          </button>

          <button
            type="button"
            onClick={() => setShowTouchPads((v) => !v)}
            title={t.touchControls}
            className={`p-2 border rounded-xl cursor-pointer shrink-0 ${
              showTouchPads
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-[#090e1a]/92 text-slate-300 border-slate-700/90 hover:bg-[#131d33]'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
          </button>

          {/* Instant Tamil / English Switch */}
          <div className="flex items-center p-0.5 bg-[#090e1a]/95 border border-amber-500/35 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => onToggleLanguage('ta')}
              className={`px-2 py-1 text-[11px] font-bold rounded-lg cursor-pointer ${
                language === 'ta'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              தமிழ்
            </button>
            <button
              type="button"
              onClick={() => onToggleLanguage('en')}
              className={`px-2 py-1 text-[11px] font-bold rounded-lg cursor-pointer ${
                language === 'en'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>

          <button
            type="button"
            onClick={onPause}
            title="Pause (Esc)"
            className="flex items-center gap-1.5 px-3 py-2 bg-[#090e1a]/95 hover:bg-[#131d33] border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300 cursor-pointer shrink-0"
          >
            <Pause className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Esc</span>
          </button>
        </div>
      </div>

      {/* OPTIONAL MOBILE / TOUCH DRIVING PADS */}
      {showTouchPads && (
        <div className="flex items-end justify-between gap-4 my-auto mt-auto mb-2 pointer-events-none">
          {/* Left Thumb: Steer Left / Right */}
          <div className="flex items-center gap-2.5 pointer-events-auto">
            <button
              type="button"
              onPointerDown={() => onTouchInput({ left: true })}
              onPointerUp={() => onTouchInput({ left: false })}
              onPointerLeave={() => onTouchInput({ left: false })}
              className="w-16 h-16 rounded-2xl bg-[#090e1a]/90 active:bg-amber-500 active:text-slate-950 border border-slate-700 text-xl font-bold text-white shadow-lg"
            >
              ◀
            </button>
            <button
              type="button"
              onPointerDown={() => onTouchInput({ right: true })}
              onPointerUp={() => onTouchInput({ right: false })}
              onPointerLeave={() => onTouchInput({ right: false })}
              className="w-16 h-16 rounded-2xl bg-[#090e1a]/90 active:bg-amber-500 active:text-slate-950 border border-slate-700 text-xl font-bold text-white shadow-lg"
            >
              ▶
            </button>
          </div>

          {/* Right Thumb: Drift, Nitro, Brake, Gas */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onPointerDown={() => onTouchInput({ drift: true })}
              onPointerUp={() => onTouchInput({ drift: false })}
              onPointerLeave={() => onTouchInput({ drift: false })}
              className="px-3.5 h-14 rounded-2xl bg-[#090e1a]/90 active:bg-amber-500 active:text-slate-950 border border-slate-700 text-xs font-bold text-amber-300"
            >
              DRIFT
            </button>
            <button
              type="button"
              onPointerDown={() => onTouchInput({ nitro: true })}
              onPointerUp={() => onTouchInput({ nitro: false })}
              onPointerLeave={() => onTouchInput({ nitro: false })}
              className="px-3.5 h-14 rounded-2xl bg-[#090e1a]/90 active:bg-cyan-400 active:text-slate-950 border border-cyan-500/50 text-xs font-bold text-cyan-300"
            >
              NITRO
            </button>
            <button
              type="button"
              onPointerDown={() => onTouchInput({ brake: true })}
              onPointerUp={() => onTouchInput({ brake: false })}
              onPointerLeave={() => onTouchInput({ brake: false })}
              className="w-14 h-16 rounded-2xl bg-[#090e1a]/90 active:bg-rose-500 border border-rose-500/40 text-xs font-bold text-rose-300"
            >
              BRAKE
            </button>
            <button
              type="button"
              onPointerDown={() => onTouchInput({ throttle: true })}
              onPointerUp={() => onTouchInput({ throttle: false })}
              onPointerLeave={() => onTouchInput({ throttle: false })}
              className="w-16 h-20 rounded-2xl bg-amber-500/95 active:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg"
            >
              GAS
            </button>
          </div>
        </div>
      )}

      {/* UNIFIED COLLAPSIBLE BOTTOM TELEMETRY DOCK */}
      <div className="mx-auto w-full max-w-[740px] pointer-events-auto">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onToggleHudCollapsed}
            className="flex items-center gap-1 px-3 py-0.5 rounded-t-lg bg-[#090e1a]/92 border border-b-0 border-slate-800 text-[10px] font-medium text-slate-400 hover:text-white cursor-pointer"
          >
            {hudCollapsed ? (
              <>
                <ChevronUp className="w-3 h-3" />
                <span>{t.showHud}</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                <span>{t.hideHud}</span>
              </>
            )}
          </button>
        </div>

        {!hudCollapsed && (
          <div className="bg-[#090e1a]/94 border border-amber-500/25 rounded-2xl px-5 py-3 shadow-2xl flex flex-wrap items-center justify-between gap-4">
            {/* Digital Speedometer + Gear */}
            <div className="flex items-baseline gap-3">
              <div className="font-mono text-3xl md:text-4xl font-extrabold text-white tabular-nums tracking-tight min-w-[3.2ch] text-right">
                {telemetry.speedKmh}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-amber-400">
                  {t.speedUnit}
                </span>
                <span className="text-xs font-mono text-slate-300 tabular-nums">
                  GEAR {telemetry.gear}
                </span>
              </div>
            </div>

            {/* Nitro Boost Bar */}
            <div className="flex-1 min-w-[140px] max-w-[220px]">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-semibold text-cyan-300 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {t.nitroLabel}
                </span>
                <span className="font-mono tabular-nums text-slate-300">
                  {telemetry.nitro}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-cyan-400 origin-left transition-transform duration-75"
                  style={{
                    transform: `scaleX(${(telemetry.nitro / 100).toFixed(2)})`,
                  }}
                />
              </div>
            </div>

            {/* Nearest Tamil Nadu Landmark & Elevation Readout (Unboxed clean metadata) */}
            <div className="text-right hidden sm:block">
              <div className="text-[11px] text-slate-400">
                {t.nearestPlace} · {t.altitudeLabel}{' '}
                <span className="font-mono tabular-nums text-slate-200">
                  {telemetry.altitudeM}m
                </span>
              </div>
              <div className="text-xs font-bold text-amber-300 mt-0.5">
                {nearestLm.name[language]}{' '}
                <span className="font-mono text-slate-300 font-normal tabular-nums">
                  · {telemetry.nearestLandmarkDistM}m
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
