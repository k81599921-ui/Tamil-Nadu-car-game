import React from 'react';
import { LANDMARKS, RACE_ORDER } from '../data/i18n';
import {
  MINIMAP_COAST_PATH,
  MINIMAP_ROAD_PATH,
  worldToMiniMap,
} from '../three/worldData';
import { GameMode, LandmarkId, Language } from '../types/game';

interface MiniMapProps {
  playerX: number;
  playerZ: number;
  playerHeading: number;
  mode: GameMode;
  discovered: LandmarkId[];
  activeCheckpointId: LandmarkId | null;
  language: Language;
  onTeleport?: (id: LandmarkId) => void;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  playerX,
  playerZ,
  playerHeading,
  mode,
  discovered,
  activeCheckpointId,
  language,
  onTeleport,
}) => {
  const playerPt = worldToMiniMap(playerX, playerZ);
  // Heading: 0 = +Z (down on SVG +Y), PI/2 = +X (right on SVG +X)
  // SVG arrow pointing up (0, -1) rotated clockwise:
  // If heading = 0 (+Z -> +Y down), rotation deg = 180.
  // If heading = PI/2 (+X -> +X right), rotation deg = 90.
  const arrowDeg = 180 - (playerHeading * 180) / Math.PI;

  return (
    <div className="bg-[#090e1a]/90 border border-amber-500/25 rounded-xl p-2.5 shadow-xl pointer-events-auto w-[164px]">
      <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1.5 px-0.5">
        <span className="font-semibold text-amber-400 truncate">
          {language === 'ta' ? 'தமிழ்நாடு மேப்' : 'Tamil Nadu Map'}
        </span>
        <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
          {mode === 'freeroam'
            ? `${discovered.length}/5`
            : language === 'ta'
              ? 'பந்தயம்'
              : 'RALLY'}
        </span>
      </div>

      <div className="relative w-full aspect-[10/11] rounded-lg overflow-hidden bg-[#082f49] border border-slate-800">
        <svg viewBox="0 0 100 100" className="w-full h-full block">
          {/* Tamil Nadu Landmass Peninsula */}
          <path
            d={MINIMAP_COAST_PATH}
            fill="#14332b"
            stroke="#eab308"
            strokeOpacity="0.45"
            strokeWidth="1.2"
          />

          {/* Western Ghats / Ooty Highland Shading */}
          <ellipse cx="22" cy="34" rx="13" ry="16" fill="#15803d" fillOpacity="0.45" />

          {/* Highway Loop */}
          <path
            d={MINIMAP_ROAD_PATH}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path
            d={MINIMAP_ROAD_PATH}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="0.6"
            strokeDasharray="2 2"
          />

          {/* 5 Iconic Landmarks */}
          {RACE_ORDER.map((id) => {
            const lm = LANDMARKS[id];
            const pt = worldToMiniMap(lm.worldX, lm.worldZ);
            const isTarget = activeCheckpointId === id;
            const isVisited = discovered.includes(id);

            return (
              <g
                key={id}
                onClick={() => {
                  if (mode === 'freeroam' && onTeleport) {
                    onTeleport(id);
                  }
                }}
                className={mode === 'freeroam' ? 'cursor-pointer' : ''}
              >
                <title>{lm.name[language]}</title>
                {isTarget && (
                  <circle
                    cx={pt.mx}
                    cy={pt.my}
                    r="6.2"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="1.3"
                  />
                )}
                <circle
                  cx={pt.mx}
                  cy={pt.my}
                  r={isTarget ? '3.6' : '2.9'}
                  fill={isTarget ? '#fbbf24' : isVisited ? lm.accentColor : '#64748b'}
                  stroke="#090e1a"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* Player Directional Arrow */}
          <g transform={`translate(${playerPt.mx}, ${playerPt.my}) rotate(${arrowDeg})`}>
            <polygon
              points="0,-5.2 3.8,4.2 0,2.2 -3.8,4.2"
              fill="#38bdf8"
              stroke="#ffffff"
              strokeWidth="0.9"
            />
          </g>
        </svg>
      </div>

      {mode === 'freeroam' && (
        <div className="mt-1.5 text-[10px] text-slate-400 text-center truncate">
          {language === 'ta'
            ? 'புள்ளியைத் தொட்டு நேரில் செல்க'
            : 'Click any dot to fast travel'}
        </div>
      )}
    </div>
  );
};
