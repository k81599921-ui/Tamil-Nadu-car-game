export type Language = 'ta' | 'en';

export type GamePhase = 'title' | 'garage' | 'playing' | 'paused' | 'victory';

export type GameMode = 'freeroam' | 'race';

export type CameraMode = 'chase' | 'hood' | 'cinematic';

export type CarModelId = 'kaveri_gt' | 'nilgiri_4x4' | 'madras_classic';

export type PaintFinish = 'metallic' | 'matte' | 'pearl';

export type WheelStyle = 'sport' | 'offroad' | 'classic';

export type CarAccessory = 'none' | 'spoiler' | 'roofrack' | 'garland';

export type RadioStationId = 'marabu' | 'turbo' | 'nilgiri' | 'off';

export type LandmarkId =
  | 'chennai'
  | 'thanjavur'
  | 'madurai'
  | 'ooty'
  | 'kanyakumari';

export interface CarTuning {
  topSpeed: number; // 1 to 5
  handling: number; // 1 to 5
  nitroPower: number; // 1 to 5
}

export interface CarCustomization {
  modelId: CarModelId;
  bodyColor: string;
  finish: PaintFinish;
  wheelStyle: WheelStyle;
  wheelColor: string;
  accessory: CarAccessory;
  underglowColor: string; // 'none' or hex
  plateDistrict: string; // e.g., 'TN 01', 'TN 49'
  plateNumber: string; // e.g., 'CH 2026'
  tuning: CarTuning;
}

export interface LandmarkInfo {
  id: LandmarkId;
  worldX: number;
  worldZ: number;
  radius: number;
  elevation: number;
  accentColor: string;
  ambientType: 'coastal' | 'temple' | 'hill';
  name: { ta: string; en: string };
  subtitle: { ta: string; en: string };
  description: { ta: string; en: string };
}

export interface TelemetryData {
  speedKmh: number;
  gear: string;
  rpmRatio: number;
  nitro: number; // 0..100
  isDrifting: boolean;
  isBoosting: boolean;
  playerX: number;
  playerZ: number;
  playerHeading: number;
  altitudeM: number;
  nearestLandmarkId: LandmarkId;
  nearestLandmarkDistM: number;
  activeBannerLandmarkId: LandmarkId | null;
  discoveredLandmarks: LandmarkId[];
  // Race telemetry
  raceElapsedMs: number;
  raceCountdown: number; // 3, 2, 1, 0 (0 = go/active)
  checkpointIndex: number;
  totalCheckpoints: number;
  checkpointTargetX: number;
  checkpointTargetZ: number;
  splitTimesMs: number[];
}

export interface TouchInputState {
  throttle: boolean;
  brake: boolean;
  left: boolean;
  right: boolean;
  drift: boolean;
  nitro: boolean;
}
