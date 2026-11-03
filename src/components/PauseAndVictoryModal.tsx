import React from 'react';
import {
  Compass,
  Download,
  Home,
  MapPin,
  Music,
  Play,
  RotateCcw,
  Trophy,
  Wrench,
} from 'lucide-react';
import {
  CAR_MODELS,
  LANDMARKS,
  RACE_ORDER,
  RADIO_STATIONS,
  UI_TEXT,
} from '../data/i18n';
import {
  CarCustomization,
  GameMode,
  GamePhase,
  LandmarkId,
  Language,
  RadioStationId,
} from '../types/game';

interface PauseAndVictoryModalProps {
  phase: Extract<GamePhase, 'paused' | 'victory'>;
  language: Language;
  mode: GameMode;
  customization: CarCustomization;
  station: RadioStationId;
  musicVolume: number;
  sfxVolume: number;
  lastRaceMs: number;
  bestRaceMs: number | null;
  isNewRecord: boolean;
  splitTimesMs: number[];
  onResume: () => void;
  onRestart: () => void;
  onSwitchToFreeRoam: () => void;
  onOpenGarage: () => void;
  onBackToTitle: () => void;
  onSelectStation: (st: RadioStationId) => void;
  onChangeMusicVol: (v: number) => void;
  onChangeSfxVol: (v: number) => void;
  onToggleLanguage: (lang: Language) => void;
  onTeleport: (id: LandmarkId) => void;
}

const RACE_LEG_IDS: LandmarkId[] = [
  'thanjavur',
  'madurai',
  'kanyakumari',
  'ooty',
  'chennai',
];

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}

export const PauseAndVictoryModal: React.FC<PauseAndVictoryModalProps> = ({
  phase,
  language,
  mode,
  customization,
  station,
  musicVolume,
  sfxVolume,
  lastRaceMs,
  bestRaceMs,
  isNewRecord,
  splitTimesMs,
  onResume,
  onRestart,
  onSwitchToFreeRoam,
  onOpenGarage,
  onBackToTitle,
  onSelectStation,
  onChangeMusicVol,
  onChangeSfxVol,
  onToggleLanguage,
  onTeleport,
}) => {
  const t = UI_TEXT[language];

  const handleExportHtmlCard = () => {
    const carName = CAR_MODELS[customization.modelId].name[language];
    const htmlContent = `<!doctype html>
<html lang="${language}">
<head>
<meta charset="utf-8" />
<title>Thamizhagam Drive 3D — ${carName}</title>
<style>
  body { margin: 0; font-family: system-ui, sans-serif; background: #070b14; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
  .card { max-width: 640px; width: 100%; background: #0f172a; border: 1px solid rgba(245,158,11,0.4); border-radius: 20px; padding: 32px; box-shadow: 0 24px 48px rgba(0,0,0,0.5); }
  h1 { margin: 0 0 8px; color: #fbbf24; font-size: 28px; }
  .plate { display: inline-block; margin-top: 12px; padding: 8px 16px; background: #f8fafc; color: #090d16; font-family: monospace; font-weight: 800; font-size: 20px; border-radius: 8px; border: 3px solid #1d4ed8; }
  .swatch { display: inline-block; width: 16px; height: 16px; border-radius: 4px; vertical-align: middle; margin-right: 6px; background: ${customization.bodyColor}; border: 1px solid #fff; }
  ul { padding-left: 18px; line-height: 1.8; color: #cbd5e1; }
</style>
</head>
<body>
  <div class="card">
    <h1>${t.gameTitle}</h1>
    <p>${t.gameSubtitle}</p>
    <div class="plate">IND · ${customization.plateDistrict} ${customization.plateNumber}</div>
    <h3>${carName}</h3>
    <p><span class="swatch"></span> Paint: ${customization.bodyColor} (${customization.finish}) · Wheels: ${customization.wheelStyle} · Trim: ${customization.accessory}</p>
    <h4>Tamil Nadu 3D Landmarks Route:</h4>
    <ul>
      ${RACE_ORDER.map((id) => `<li><strong>${LANDMARKS[id].name.ta}</strong> — ${LANDMARKS[id].name.en}</li>`).join('')}
    </ul>
    ${bestRaceMs ? `<p><strong>Best Rally Record:</strong> ${formatMs(bestRaceMs)}</p>` : ''}
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thamizhagam-drive-${customization.plateDistrict.replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (phase === 'victory') {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-[#070b14]/88">
        <div className="w-full max-w-lg bg-[#0c1324] border border-amber-400/50 rounded-2xl p-6 md:p-7 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-amber-400">
              <Trophy className="w-6 h-6 shrink-0" />
              <h2 className="text-xl font-extrabold text-white">
                {t.victoryTitle}
              </h2>
            </div>
            {isNewRecord && (
              <span className="text-xs font-bold text-amber-300">
                ★ {t.newRecord}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-300 mt-1.5">{t.victorySubtitle}</p>

          <div className="mt-5 grid grid-cols-2 gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <div>
              <div className="text-xs text-slate-400">{t.raceTime}</div>
              <div className="font-mono text-2xl font-extrabold text-white tabular-nums mt-0.5">
                {formatMs(lastRaceMs)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">{t.bestTime}</div>
              <div className="font-mono text-2xl font-extrabold text-amber-400 tabular-nums mt-0.5">
                {bestRaceMs ? formatMs(bestRaceMs) : formatMs(lastRaceMs)}
              </div>
            </div>
          </div>

          {/* 5-Region Checkpoint Split Breakdown */}
          <div className="mt-4 space-y-1.5">
            {RACE_LEG_IDS.map((id, idx) => (
              <div
                key={id}
                className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/80 last:border-0"
              >
                <span className="text-slate-300 truncate pr-3">
                  0{idx + 1}. {LANDMARKS[id].name[language]}
                </span>
                <span className="font-mono tabular-nums text-amber-300 shrink-0">
                  {splitTimesMs[idx] ? formatMs(splitTimesMs[idx]) : '--:--.-'}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onRestart}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs md:text-sm cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.playAgain}</span>
            </button>
            <button
              type="button"
              onClick={onSwitchToFreeRoam}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs md:text-sm cursor-pointer whitespace-nowrap"
            >
              <Compass className="w-4 h-4 text-amber-400" />
              <span>{t.switchToFreeRoam}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-[#070b14]/86">
      <div className="w-full max-w-2xl bg-[#0b1222] border border-amber-500/35 rounded-2xl p-5 md:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header + Language Toggle */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <h2 className="text-lg md:text-xl font-bold text-white">
            {t.pauseTitle}
          </h2>

          <div className="flex items-center p-1 bg-slate-900 border border-amber-500/35 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => onToggleLanguage('ta')}
              className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer ${
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
              className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer ${
                language === 'en'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Music & Radio Mixer Section */}
        <div className="mt-4">
          <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-2.5">
            <Music className="w-3.5 h-3.5" />
            <span>{t.musicSettings}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            {RADIO_STATIONS.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => onSelectStation(st.id)}
                className={`text-left px-3 py-2 rounded-xl border transition-colors cursor-pointer ${
                  station === st.id
                    ? 'bg-amber-500/15 border-amber-400 text-white'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold truncate">
                  {st.name[language]}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {st.genre[language]}
                </div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/70 rounded-xl p-3 border border-slate-800">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>{t.musicVolume}</span>
                <span className="font-mono tabular-nums">
                  {Math.round(musicVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={musicVolume}
                onChange={(e) => onChangeMusicVol(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>{t.sfxVolume}</span>
                <span className="font-mono tabular-nums">
                  {Math.round(sfxVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={sfxVolume}
                onChange={(e) => onChangeSfxVol(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Fast Travel to Tamil Nadu Landmarks (Available in Free Roam) */}
        {mode === 'freeroam' && (
          <div className="mt-4">
            <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>{t.teleportSection}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RACE_ORDER.map((id) => {
                const lm = LANDMARKS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onTeleport(id)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left text-xs text-slate-200 transition-colors cursor-pointer"
                  >
                    <span className="truncate font-medium">
                      {lm.name[language]}
                    </span>
                    <span className="text-[10px] text-amber-400 shrink-0 ml-2">
                      →
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs md:text-sm cursor-pointer whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{t.resumeGame}</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.restartRace}</span>
          </button>

          <button
            type="button"
            onClick={onOpenGarage}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs cursor-pointer whitespace-nowrap"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>{t.customizeCar}</span>
          </button>

          <button
            type="button"
            onClick={onBackToTitle}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs cursor-pointer whitespace-nowrap"
          >
            <Home className="w-3.5 h-3.5" />
            <span>{t.backToTitle}</span>
          </button>

          <button
            type="button"
            onClick={handleExportHtmlCard}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.exportHtmlBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
