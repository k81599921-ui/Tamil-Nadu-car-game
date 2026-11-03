import React, { useEffect } from 'react';
import { Car, Compass, Flag, Music, Volume2, VolumeX, Wrench } from 'lucide-react';
import { CAR_MODELS, RADIO_STATIONS, UI_TEXT } from '../data/i18n';
import {
  CarCustomization,
  GameMode,
  Language,
  RadioStationId,
} from '../types/game';

interface TitleScreenProps {
  language: Language;
  selectedMode: GameMode;
  customization: CarCustomization;
  station: RadioStationId;
  muted: boolean;
  bestRaceMs: number | null;
  onSelectMode: (mode: GameMode) => void;
  onToggleLanguage: (lang: Language) => void;
  onStartDrive: () => void;
  onOpenGarage: () => void;
  onCycleStation: () => void;
  onToggleMute: () => void;
}

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  language,
  selectedMode,
  customization,
  station,
  muted,
  bestRaceMs,
  onSelectMode,
  onToggleLanguage,
  onStartDrive,
  onOpenGarage,
  onCycleStation,
  onToggleMute,
}) => {
  const t = UI_TEXT[language];
  const currentStation = RADIO_STATIONS.find((s) => s.id === station) || RADIO_STATIONS[0];
  const carSpec = CAR_MODELS[customization.modelId];

  // Press Enter or Space to start driving immediately
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStartDrive();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStartDrive]);

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-5 md:p-8 bg-gradient-to-t from-[#070b14]/90 via-[#070b14]/25 to-[#070b14]/70">
      {/* Top Perimeter Controls: Bilingual Switcher & Live Radio */}
      <div className="flex items-center justify-between gap-4 pointer-events-auto">
        {/* Bespoke Tamil Nadu Heritage Emblem Mark */}
        <div className="flex items-center gap-3 bg-[#090e1a]/90 border border-amber-500/25 rounded-xl px-3.5 py-2">
          <svg
            width="28"
            height="28"
            viewBox="0 0 36 36"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            {/* Stylized Gopuram + Sun + Highway Crest */}
            <circle cx="18" cy="14" r="10" fill="#F59E0B" fillOpacity="0.2" />
            <path
              d="M14 8H22L24 14H12L14 8ZM11 16H25L27 23H9L11 16Z"
              fill="#FBBF24"
            />
            <path d="M17 4L18 2L19 4H17Z" fill="#FEF08A" />
            <path
              d="M4 31L15 24H21L32 31H4Z"
              fill="#38BDF8"
              fillOpacity="0.85"
            />
          </svg>
          <span className="text-xs font-semibold text-amber-300 whitespace-nowrap">
            {carSpec.name[language]} · {customization.plateDistrict}
          </span>
        </div>

        {/* Right Cluster: Radio Station + Mute + Language Switch */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCycleStation}
            className="flex items-center gap-2 bg-[#090e1a]/90 hover:bg-[#111a2e] border border-amber-500/25 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Music className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{currentStation.name[language]}</span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label="Toggle Mute"
            className="p-2 bg-[#090e1a]/90 hover:bg-[#111a2e] border border-slate-700/80 rounded-xl text-slate-200 transition-colors cursor-pointer shrink-0"
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Instant Bilingual Tamil / English Segmented Switch */}
          <div className="flex items-center p-1 bg-[#090e1a]/95 border border-amber-500/35 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => onToggleLanguage('ta')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
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
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                language === 'en'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>

      {/* Center Negative Space Preserved (35%+ open live 3D Kanyakumari & Thiruvalluvar Statue!) */}
      <div className="my-auto max-w-2xl pointer-events-auto">
        {/* Bespoke Inline SVG Title Lockup */}
        <svg
          width="240"
          height="26"
          viewBox="0 0 240 26"
          fill="none"
          className="mb-2"
          aria-hidden="true"
        >
          <line x1="0" y1="13" x2="54" y2="13" stroke="#F59E0B" strokeWidth="2" />
          <polygon points="62,6 69,13 62,20 55,13" fill="#FBBF24" />
          <text
            x="78"
            y="17"
            fill="#FDE68A"
            fontSize="11"
            fontWeight="700"
            letterSpacing="2.2"
          >
            TAMIL NADU 3D TOUR
          </text>
        </svg>

        <h1
          className="font-extrabold tracking-tight text-white drop-shadow-lg"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.35rem, 4.6vw, 4rem)',
            lineHeight: 1.08,
            textWrap: 'balance',
          }}
        >
          {t.gameTitle}
        </h1>

        <p className="mt-2.5 text-sm md:text-base text-slate-200 max-w-xl leading-relaxed">
          {t.gameSubtitle}
        </p>

        <div className="mt-2 text-xs text-amber-300/95">
          {language === 'ta'
            ? 'சென்னை மெரினா · தஞ்சை பெரிய கோவில் · மதுரை மீனாட்சி · ஊட்டி மலை · கன்னியாகுமரி திருவள்ளுவர் சிலை'
            : 'Chennai Marina · Thanjavur Big Temple · Madurai Meenakshi · Ooty Hills · Kanyakumari Thiruvalluvar Statue'}
        </div>

        {/* Game Mode Selector Cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
          <button
            type="button"
            onClick={() => onSelectMode('freeroam')}
            className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
              selectedMode === 'freeroam'
                ? 'bg-[#0c1426]/95 border-amber-400 shadow-lg'
                : 'bg-[#090e1a]/85 border-slate-700/80 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400 shrink-0" />
                {t.freeRoamTitle}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
              {t.freeRoamDesc}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectMode('race')}
            className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
              selectedMode === 'race'
                ? 'bg-[#0c1426]/95 border-amber-400 shadow-lg'
                : 'bg-[#090e1a]/85 border-slate-700/80 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Flag className="w-4 h-4 text-cyan-400 shrink-0" />
                {t.raceModeTitle}
              </span>
              {bestRaceMs !== null && (
                <span className="text-[11px] font-mono tabular-nums text-amber-300 shrink-0">
                  {formatMs(bestRaceMs)}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
              {t.raceModeDesc}
            </p>
          </button>
        </div>

        {/* Primary Action Row */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onStartDrive}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Car className="w-4 h-4 shrink-0" />
            <span>{t.startDrive}</span>
            <span className="text-xs font-mono opacity-75 ml-1">[Enter]</span>
          </button>

          <button
            type="button"
            onClick={onOpenGarage}
            className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#090e1a]/95 hover:bg-[#131d33] border border-amber-500/40 text-amber-300 font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Wrench className="w-4 h-4 shrink-0" />
            <span>{t.openGarage}</span>
          </button>
        </div>
      </div>

      {/* Bottom Single-Line Control Hint */}
      <div className="pointer-events-auto flex items-center justify-between gap-4 text-xs text-slate-300 bg-[#090e1a]/85 border border-slate-800/90 rounded-xl px-4 py-2.5">
        <span className="truncate">{t.controlsHint}</span>
        <span className="text-amber-400 font-medium whitespace-nowrap shrink-0 hidden sm:inline">
          {currentStation.genre[language]}
        </span>
      </div>
    </div>
  );
};
