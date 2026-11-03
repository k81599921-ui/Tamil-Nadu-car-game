import * as THREE from 'three';
import { LANDMARKS } from '../data/i18n';
import { LandmarkId } from '../types/game';

export const WORLD_BOUNDS = {
  minX: -360,
  maxX: 290,
  minZ: -430,
  maxZ: 450,
};

export const ROAD_HALF_WIDTH = 8.5;

// Closed Grand Tamil Nadu Highway Loop (Counter-Clockwise or Clockwise):
// Chennai (NE Coast) -> Mahabalipuram/ECR -> Thanjavur (Cauvery Delta) ->
// Madurai (Temple Plains) -> Kanyakumari (Southern Tip) ->
// Western Ghats Foothills -> Ooty (Nilgiri Mountain Hairpins) ->
// Northern Plateau -> Chennai
const RAW_HIGHWAY_WAYPOINTS: Array<[number, number]> = [
  [162, -312], // 0: Chennai Marina Promenade
  [172, -230], // ECR Coastal Highway
  [152, -135], // Pondicherry / Chidambaram Coast
  [102, -42],  // 3: Thanjavur Big Temple Boulevard
  [54, 48],    // Trichy / Cauvery Plain
  [-16, 148],  // 5: Madurai Meenakshi Temple Avenue
  [-8, 255],   // Tirunelveli Windmill Highway
  [-30, 352],  // 7: Kanyakumari Coastal Overlook (Thiruvalluvar Statue)
  [-98, 325],  // Nagercoil Southwest Curve
  [-155, 210], // Courtallam / Western Ghats Base
  [-188, 92],  // Pollachi Foothills
  [-222, -22], // Nilgiri Ghat Hairpin 1 (Climbing!)
  [-186, -78], // Nilgiri Ghat Hairpin 2
  [-212, -138],// 13: Ooty Tea Estate Summit
  [-168, -225],// Descent via Mysore/Krishnagiri Plateau
  [-72, -295], // Vellore / Kanchipuram Highway
  [48, -332],  // Sriperumbudur Approach
];

// Base regional terrain height (without road smoothing)
export function rawTerrainHeight(x: number, z: number): number {
  // Check Tamil Nadu Peninsula Coastline boundary!
  // East coast (Bay of Bengal): roughly slopes into sea east of xCoastEast(z)
  const eastCoastX =
    z < -120
      ? 188 - (z + 320) * 0.04
      : z < 120
        ? 175 - (z + 120) * 0.36
        : 88 - (z - 120) * 0.46;

  // Southern tip (Kanyakumari point around x = -32, z = 372)
  const southCapZ = 372 - Math.abs(x + 32) * 0.52;

  // Western border (Western Ghats)
  const westBorderX = -275 + Math.max(0, Math.abs(z + 40) - 240) * 0.25;
  const northBorderZ = -375 + Math.abs(x - 40) * 0.14;

  // Signed distance inside landmass (positive = land, negative = sea)
  const distEast = eastCoastX - x;
  const distSouth = southCapZ - z;
  const distWest = x - westBorderX;
  const distNorth = z - northBorderZ;

  const landMargin = Math.min(distEast, distSouth);

  if (landMargin < -18) {
    return -3.2; // Deep Bay of Bengal / Indian Ocean seabed
  }

  const shoreBlend = THREE.MathUtils.smoothstep(landMargin, -16, 22);

  // Base gentle undulating plains
  let h =
    1.8 +
    Math.sin(x * 0.018) * Math.cos(z * 0.016) * 1.4 +
    Math.sin((x + z) * 0.009) * 1.1;

  // Ooty / Nilgiri Mountain massif centered around (-205, -110)
  const dxOoty = (x - -205) / 118;
  const dzOoty = (z - -105) / 145;
  const ootyDistSq = dxOoty * dxOoty + dzOoty * dzOoty;
  if (ootyDistSq < 1.35) {
    const mountainFactor = Math.pow(Math.max(0, 1 - ootyDistSq / 1.35), 1.65);
    h += mountainFactor * 41.0;
    // Terraced tea hill ripples
    h += mountainFactor * Math.sin(x * 0.12 + z * 0.08) * 1.35;
  }

  // Western Ghats southern ridge along x ~ -210, z in [20..260]
  const dxGhats = (x - -225) / 85;
  const dzGhats = (z - 140) / 185;
  const ghatsSq = dxGhats * dxGhats + dzGhats * dzGhats;
  if (ghatsSq < 1.0) {
    h += Math.pow(1 - ghatsSq, 1.8) * 24.0;
  }

  // Outer north/west natural perimeter hills so world has natural horizon mountain rim
  const westRim = THREE.MathUtils.smoothstep(-distWest, -25, 45) * 26;
  const northRim = THREE.MathUtils.smoothstep(-distNorth, -25, 45) * 18;
  h += westRim + northRim;

  // Flatten around temple compounds so architecture sits majestically level
  const flattenSpots: Array<[number, number, number, number]> = [
    [168, -310, 48, 2.3], // Chennai Marina
    [105, -35, 52, 4.0],  // Thanjavur Big Temple
    [-20, 155, 52, 5.5],  // Madurai Meenakshi Temple
    [-32, 355, 42, 2.6],  // Kanyakumari Overlook
  ];

  for (let i = 0; i < flattenSpots.length; i++) {
    const [sx, sz, rad, targetH] = flattenSpots[i];
    const d = Math.hypot(x - sx, z - sz);
    if (d < rad * 1.45) {
      const w = 1 - THREE.MathUtils.smoothstep(d, rad * 0.55, rad * 1.45);
      h = THREE.MathUtils.lerp(h, targetH, w);
    }
  }

  return THREE.MathUtils.lerp(-3.2, h, shoreBlend);
}

// Build dense sampled highway spline for ultra-fast O(1) spatial grid / lookup
export interface RoadSample {
  x: number;
  y: number;
  z: number;
  tx: number;
  tz: number;
  s: number; // 0..1 progress along loop
}

const curvePoints = RAW_HIGHWAY_WAYPOINTS.map(([wx, wz]) => {
  const wy = Math.max(2.2, rawTerrainHeight(wx, wz));
  return new THREE.Vector3(wx, wy, wz);
});

export const HIGHWAY_CURVE = new THREE.CatmullRomCurve3(
  curvePoints,
  true,
  'centripetal',
  0.45
);

const SAMPLE_COUNT = 720;
export const ROAD_SAMPLES: RoadSample[] = [];

for (let i = 0; i < SAMPLE_COUNT; i++) {
  const s = i / SAMPLE_COUNT;
  const pt = HIGHWAY_CURVE.getPointAt(s);
  const tan = HIGHWAY_CURVE.getTangentAt(s);
  // Ensure coastal bridges stay safely above water
  const safeY = Math.max(2.15, pt.y);
  ROAD_SAMPLES.push({
    x: pt.x,
    y: safeY,
    z: pt.z,
    tx: tan.x,
    tz: tan.z,
    s,
  });
}

export interface NearestRoadResult {
  dist: number;
  roadY: number;
  sampleIndex: number;
  x: number;
  z: number;
  tx: number;
  tz: number;
}

const _nearestResult: NearestRoadResult = {
  dist: 9999,
  roadY: 2.2,
  sampleIndex: 0,
  x: 0,
  z: 0,
  tx: 0,
  tz: 1,
};

export function findNearestRoad(x: number, z: number): NearestRoadResult {
  let bestDistSq = Infinity;
  let bestIdx = 0;

  // Coarse step then fine refinement around best sample for speed!
  for (let i = 0; i < SAMPLE_COUNT; i += 4) {
    const s = ROAD_SAMPLES[i];
    const dx = x - s.x;
    const dz = z - s.z;
    const dSq = dx * dx + dz * dz;
    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestIdx = i;
    }
  }

  const start = bestIdx - 4;
  const end = bestIdx + 4;
  for (let k = start; k <= end; k++) {
    const idx = (k + SAMPLE_COUNT) % SAMPLE_COUNT;
    const s = ROAD_SAMPLES[idx];
    const dx = x - s.x;
    const dz = z - s.z;
    const dSq = dx * dx + dz * dz;
    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestIdx = idx;
    }
  }

  const chosen = ROAD_SAMPLES[bestIdx];
  _nearestResult.dist = Math.sqrt(bestDistSq);
  _nearestResult.roadY = chosen.y;
  _nearestResult.sampleIndex = bestIdx;
  _nearestResult.x = chosen.x;
  _nearestResult.z = chosen.z;
  _nearestResult.tx = chosen.tx;
  _nearestResult.tz = chosen.tz;
  return _nearestResult;
}

// Authoritative ground height at any (x, z) blending terrain smoothly up to highway embankment
export function groundHeightAt(x: number, z: number): number {
  const baseH = rawTerrainHeight(x, z);
  const nr = findNearestRoad(x, z);
  if (nr.dist < ROAD_HALF_WIDTH + 16) {
    const blend = 1 - THREE.MathUtils.smoothstep(nr.dist, ROAD_HALF_WIDTH + 0.8, ROAD_HALF_WIDTH + 16);
    return THREE.MathUtils.lerp(baseH, nr.roadY - 0.08, blend);
  }
  return baseH;
}

// Get exact spawn position on the highway right beside a given landmark
export function getLandmarkSpawnPose(landmarkId: LandmarkId): {
  x: number;
  y: number;
  z: number;
  heading: number;
} {
  const lm = LANDMARKS[landmarkId];
  const nr = findNearestRoad(lm.worldX, lm.worldZ);
  const heading = Math.atan2(nr.tx, nr.tz);
  return {
    x: nr.x,
    y: nr.roadY + 0.06,
    z: nr.z,
    heading,
  };
}

// Project 3D world (x, z) to normalized [0..100] SVG Mini-Map coordinates
export function worldToMiniMap(x: number, z: number): { mx: number; my: number } {
  const mx = ((x - WORLD_BOUNDS.minX) / (WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX)) * 100;
  const my = ((z - WORLD_BOUNDS.minZ) / (WORLD_BOUNDS.maxZ - WORLD_BOUNDS.minZ)) * 100;
  return {
    mx: THREE.MathUtils.clamp(mx, 2, 98),
    my: THREE.MathUtils.clamp(my, 2, 98),
  };
}

// Precompute Tamil Nadu coastline polygon points for the 2D SVG Mini-Map
export const MINIMAP_COAST_PATH: string = (() => {
  const pts: Array<[number, number]> = [
    [40, -370],
    [186, -340],
    [182, -160],
    [164, -80],
    [118, 25],
    [88, 120],
    [35, 240],
    [-28, 372], // Kanyakumari Southern Tip!
    [-112, 330],
    [-185, 215],
    [-245, 70],
    [-265, -135], // Ooty / Nilgiris West projection
    [-215, -285],
    [-90, -355],
  ];
  return (
    pts
      .map(([wx, wz], idx) => {
        const { mx, my } = worldToMiniMap(wx, wz);
        return `${idx === 0 ? 'M' : 'L'} ${mx.toFixed(1)} ${my.toFixed(1)}`;
      })
      .join(' ') + ' Z'
  );
})();

export const MINIMAP_ROAD_PATH: string = (() => {
  const step = 6;
  const cmds: string[] = [];
  for (let i = 0; i < ROAD_SAMPLES.length; i += step) {
    const s = ROAD_SAMPLES[i];
    const { mx, my } = worldToMiniMap(s.x, s.z);
    cmds.push(`${i === 0 ? 'M' : 'L'} ${mx.toFixed(1)} ${my.toFixed(1)}`);
  }
  return cmds.join(' ') + ' Z';
})();
