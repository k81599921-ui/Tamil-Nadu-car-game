import React, { useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Gauge,
  Palette,
  Play,
  Settings2,
  Shield,
  Sparkles,
} from 'lucide-react';
import {
  CAR_MODELS,
  PAINT_SWATCHES,
  TN_DISTRICTS,
  UI_TEXT,
  UNDERGLOW_SWATCHES,
  WHEEL_COLOR_SWATCHES,
} from '../data/i18n';
import {
  CarAccessory,
  CarCustomization,
  CarModelId,
  Language,
  PaintFinish,
  WheelStyle,
} from '../types/game';

interface GarageOverlayProps {
  language: Language;
  customization: CarCustomization;
  onChange: (next: CarCustomization) => void;
  onToggleLanguage: (lang: Language) => void;
  onBackToTitle: () => void;
  onDriveNow: () => void;
}

type GarageTab = 'model' | 'paint' | 'parts' | 'plate' | 'tuning';

export const GarageOverlay: React.FC<GarageOverlayProps> = ({
  language,
  customization,
  onChange,
  onToggleLanguage,
  onBackToTitle,
  onDriveNow,
}) => {
  const [activeTab, setActiveTab] = useState<GarageTab>('model');
  const [collapsed, setCollapsed] = useState(false);

  const t = UI_TEXT[language];
  const spec = CAR_MODELS[customization.modelId];

  const update = (partial: Partial<CarCustomization>) => {
    onChange({ ...customization, ...partial });
  };

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 md:p-6">
      {/* Minimal Top Bar — 100% Unobstructed Central 3D Car Turntable */}
      <div className="flex items-center justify-between gap-4 pointer-events-auto">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToTitle}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#090e1a]/92 hover:bg-[#131d33] border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>{t.backToTitle}</span>
          </button>

          <div className="bg-[#090e1a]/92 border border-amber-500/25 rounded-xl px-4 py-2 hidden sm:block">
            <div className="text-sm font-bold text-white">
              {spec.name[language]}
            </div>
            <div className="text-[11px] text-slate-400">
              {spec.tagline[language]} ·{' '}
              <span className="text-amber-300 font-mono">
                {customization.plateDistrict} {customization.plateNumber}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Instant Tamil / English Toggle */}
          <div className="flex items-center p-1 bg-[#090e1a]/95 border border-amber-500/35 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => onToggleLanguage('ta')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
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
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
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
            onClick={onDriveNow}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs md:text-sm shadow-lg transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Play className="w-4 h-4 fill-current shrink-0" />
            <span>{t.driveFromGarage}</span>
          </button>
        </div>
      </div>

      {/* Subtle Drag Orbit Hint */}
      <div className="mx-auto my-auto pointer-events-none text-center mt-4">
        <span className="text-[11px] text-slate-300/80 bg-[#090e1a]/65 px-3 py-1 rounded-lg">
          {language === 'ta'
            ? 'காரை 360° சுற்றிப் பார்க்க இழுக்கவும் (Drag to rotate 360°)'
            : 'Drag horizontally on car to inspect 360°'}
        </span>
      </div>

      {/* Unified Collapsible Bottom Customization Dock (Zero Side-Panel Clutter!) */}
      <div className="w-full max-w-[940px] mx-auto pointer-events-auto">
        <div className="flex justify-center mb-1.5">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center gap-1.5 px-3.5 py-1 rounded-t-lg bg-[#090e1a]/95 border border-b-0 border-amber-500/30 text-[11px] font-semibold text-amber-300 hover:text-white cursor-pointer"
          >
            {collapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>{t.showHud}</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>{t.hideHud}</span>
              </>
            )}
          </button>
        </div>

        {!collapsed && (
          <div className="bg-[#090e1a]/95 border border-amber-500/30 rounded-2xl p-4 shadow-2xl">
            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-3 border-b border-slate-800">
              {(
                [
                  { id: 'model', icon: Gauge, label: t.tabModel },
                  { id: 'paint', icon: Palette, label: t.tabPaint },
                  { id: 'parts', icon: Sparkles, label: t.tabParts },
                  { id: 'plate', icon: Shield, label: t.tabPlate },
                  { id: 'tuning', icon: Settings2, label: t.tabTuning },
                ] as Array<{ id: GarageTab; icon: typeof Gauge; label: string }>
              ).map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content Body */}
            <div className="pt-3.5 min-h-[126px]">
              {activeTab === 'model' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(Object.keys(CAR_MODELS) as CarModelId[]).map((mId) => {
                    const m = CAR_MODELS[mId];
                    const selected = customization.modelId === mId;
                    return (
                      <button
                        key={mId}
                        type="button"
                        onClick={() => update({ modelId: mId })}
                        className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                          selected
                            ? 'bg-slate-900 border-amber-400'
                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="font-bold text-sm text-white">
                          {m.name[language]}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {m.tagline[language]}
                        </p>
                        <div className="mt-2.5 flex items-center gap-3 text-[11px] text-amber-300 font-mono tabular-nums">
                          <span>{m.baseSpeedKmh} KM/H</span>
                          <span>·</span>
                          <span>
                            {language === 'ta' ? 'மலைத்திறன்' : 'Hill'}{' '}
                            {Math.round(m.offroadBonus * 100)}%
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {activeTab === 'paint' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  {/* Body Color Swatches */}
                  <div>
                    <div className="text-xs font-semibold text-slate-300 mb-2">
                      {t.tabPaint}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {PAINT_SWATCHES.map((sw) => (
                        <button
                          key={sw.hex}
                          type="button"
                          title={sw.name[language]}
                          onClick={() => update({ bodyColor: sw.hex })}
                          className={`w-8 h-8 rounded-lg border-2 transition-transform cursor-pointer ${
                            customization.bodyColor === sw.hex
                              ? 'border-white scale-110'
                              : 'border-slate-700 hover:scale-105'
                          }`}
                          style={{ backgroundColor: sw.hex }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Paint Finish Type */}
                  <div>
                    <div className="text-xs font-semibold text-slate-300 mb-2">
                      {t.finishLabel}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(['metallic', 'matte', 'pearl'] as PaintFinish[]).map((fin) => (
                        <button
                          key={fin}
                          type="button"
                          onClick={() => update({ finish: fin })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap ${
                            customization.finish === fin
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {t.finishChoices[fin]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chassis Underglow */}
                  <div>
                    <div className="text-xs font-semibold text-slate-300 mb-2">
                      {t.underglowLabel}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {UNDERGLOW_SWATCHES.map((ug) => (
                        <button
                          key={ug.hex}
                          type="button"
                          onClick={() => update({ underglowColor: ug.hex })}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer whitespace-nowrap ${
                            customization.underglowColor === ug.hex
                              ? 'border-amber-400 bg-slate-800 text-white'
                              : 'border-slate-800 bg-slate-900 text-slate-400'
                          }`}
                        >
                          {ug.name[language]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'parts' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Wheel Rim Style */}
                  <div>
                    <div className="text-xs font-semibold text-slate-300 mb-2">
                      {t.wheelStyleLabel}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(['sport', 'offroad', 'classic'] as WheelStyle[]).map((ws) => (
                        <button
                          key={ws}
                          type="button"
                          onClick={() => update({ wheelStyle: ws })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap ${
                            customization.wheelStyle === ws
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {t.wheelChoices[ws]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Wheel Rim Accent Color */}
                  <div>
                    <div className="text-xs font-semibold text-slate-300 mb-2">
                      {t.wheelColorLabel}
                    </div>
                    <div className="flex items-center gap-2">
                      {WHEEL_COLOR_SWATCHES.map((wc) => (
                        <button
                          key={wc.hex}
                          type="button"
                          title={wc.name[language]}
                          onClick={() => update({ wheelColor: wc.hex })}
                          className={`w-8 h-8 rounded-lg border-2 cursor-pointer ${
                            customization.wheelColor === wc.hex
                              ? 'border-amber-400 scale-110'
                              : 'border-slate-700'
                          }`}
                          style={{ backgroundColor: wc.hex }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Roof / Hood Cultural & Aero Accessories */}
                  <div>
                    <div className="text-xs font-semibold text-slate-300 mb-2">
                      {t.accessoryLabel}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        ['none', 'spoiler', 'roofrack', 'garland'] as CarAccessory[]
                      ).map((acc) => (
                        <button
                          key={acc}
                          type="button"
                          onClick={() => update({ accessory: acc })}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium truncate cursor-pointer ${
                            customization.accessory === acc
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {t.accessoryChoices[acc]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'plate' && (
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-300 mb-2">
                      {t.districtLabel}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {TN_DISTRICTS.map((d) => (
                        <button
                          key={d.code}
                          type="button"
                          onClick={() => update({ plateDistrict: d.code })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap ${
                            customization.plateDistrict === d.code
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {d.code} · {d.city[language]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="w-full md:w-64">
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      {t.plateCodeLabel}
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      value={customization.plateNumber}
                      onChange={(e) =>
                        update({ plateNumber: e.target.value.toUpperCase() })
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 focus:outline-none font-mono text-sm text-white uppercase tracking-wider"
                      placeholder="VA 2026"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'tuning' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {(
                    [
                      { key: 'topSpeed', label: t.statSpeed },
                      { key: 'handling', label: t.statHandling },
                      { key: 'nitroPower', label: t.statNitro },
                    ] as const
                  ).map((item) => {
                    const currentVal = customization.tuning[item.key];
                    return (
                      <div key={item.key}>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-semibold text-slate-200">
                            {item.label}
                          </span>
                          <span className="font-mono tabular-nums text-amber-400">
                            Lv.{currentVal}/5
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() =>
                                update({
                                  tuning: {
                                    ...customization.tuning,
                                    [item.key]: lvl,
                                  },
                                })
                              }
                              className={`h-8 rounded-lg font-mono text-xs font-bold transition-colors cursor-pointer ${
                                lvl <= currentVal
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
