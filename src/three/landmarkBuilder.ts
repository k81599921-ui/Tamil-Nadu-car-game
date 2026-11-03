import * as THREE from 'three';
import { LANDMARKS, RACE_ORDER } from '../data/i18n';
import { LandmarkId } from '../types/game';
import {
  findNearestRoad,
  groundHeightAt,
  ROAD_HALF_WIDTH,
  ROAD_SAMPLES,
  WORLD_BOUNDS,
} from './worldData';

export interface BuiltWorld {
  worldGroup: THREE.Group;
  oceanMesh: THREE.Mesh;
  lighthouseBeacon: THREE.Group;
  checkpointArch: THREE.Group;
  setActiveCheckpoint: (landmarkId: LandmarkId | null) => void;
  dispose: () => void;
}

function createRoadAsphaltTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Rich highway asphalt with subtle aggregate grain
  ctx.fillStyle = '#1e2430';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 4500; i++) {
    const shade = 24 + Math.floor(Math.random() * 22);
    ctx.fillStyle = `rgb(${shade}, ${shade + 4}, ${shade + 10})`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }

  // Outer white highway shoulder lines
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(24, 0, 10, 512);
  ctx.fillRect(478, 0, 10, 512);

  // Warm golden-yellow dashed Tamil Nadu National Highway center divider
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(250, 30, 12, 195);
  ctx.fillRect(250, 286, 12, 195);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createGopuramStuccoTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const bands = ['#dc2626', '#0284c7', '#d97706', '#15803d', '#9333ea', '#eab308'];
  const bandH = 256 / bands.length;
  bands.forEach((col, idx) => {
    ctx.fillStyle = col;
    ctx.fillRect(0, idx * bandH, 256, bandH);
    // Ornamental pilaster niches along each Dravidian tier
    ctx.fillStyle = 'rgba(255, 248, 220, 0.42)';
    for (let x = 10; x < 250; x += 24) {
      ctx.fillRect(x, idx * bandH + 6, 10, bandH - 12);
    }
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function buildTamilNaduWorld(maxAnisotropy: number): BuiltWorld {
  const disposables: Array<{ dispose: () => void }> = [];
  const trackG = <T extends THREE.BufferGeometry>(g: T): T => {
    disposables.push(g);
    return g;
  };
  const trackM = <T extends THREE.Material>(m: T): T => {
    disposables.push(m);
    return m;
  };

  const worldGroup = new THREE.Group();

  // 1. Sculpted Tamil Nadu Peninsula Terrain Mesh with Biome Vertex Colors
  const segX = 155;
  const segZ = 185;
  const spanX = WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX + 260;
  const spanZ = WORLD_BOUNDS.maxZ - WORLD_BOUNDS.minZ + 260;
  const centerX = (WORLD_BOUNDS.minX + WORLD_BOUNDS.maxX) * 0.5;
  const centerZ = (WORLD_BOUNDS.minZ + WORLD_BOUNDS.maxZ) * 0.5;

  const terrainGeo = trackG(new THREE.PlaneGeometry(spanX, spanZ, segX, segZ));
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);
  const cSand = new THREE.Color('#eab676');
  const cDeltaGreen = new THREE.Color('#2d6a3e');
  const cPlainsEarth = new THREE.Color('#9a6b3b');
  const cTeaEmerald = new THREE.Color('#15803d');
  const cMountainRock = new THREE.Color('#475569');
  const tmpColor = new THREE.Color();

  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i) + centerX;
    const vz = posAttr.getZ(i) + centerZ;
    const vy = groundHeightAt(vx, vz);
    posAttr.setXYZ(i, vx, vy, vz);

    if (vy < 1.25) {
      tmpColor.copy(cSand);
    } else if (vy > 28) {
      tmpColor.copy(cMountainRock).lerp(cTeaEmerald, 0.55);
    } else if (vy > 12) {
      tmpColor.copy(cTeaEmerald);
    } else if (vx > 20 && vz < 80) {
      // Lush Cauvery Delta & Northern Plains
      tmpColor.copy(cDeltaGreen).lerp(cPlainsEarth, 0.22);
    } else {
      // Southern Temple Plains
      tmpColor.copy(cPlainsEarth).lerp(cDeltaGreen, 0.42);
    }
    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  terrainGeo.computeVertexNormals();

  const terrainMat = trackM(
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.04,
    })
  );
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  worldGroup.add(terrainMesh);

  // 2. Expansive Bay of Bengal & Indian Ocean Surface (y = 0.0)
  const oceanGeo = trackG(new THREE.PlaneGeometry(2600, 2600, 64, 64));
  oceanGeo.rotateX(-Math.PI / 2);
  const oceanMat = trackM(
    new THREE.MeshPhysicalMaterial({
      color: 0x0369a1,
      roughness: 0.16,
      metalness: 0.15,
      clearcoat: 0.9,
      clearcoatRoughness: 0.12,
    })
  );
  const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
  oceanMesh.position.set(centerX + 120, 0.0, centerZ + 80);
  worldGroup.add(oceanMesh);

  // 3. Continuous 3D Highway Ribbon Mesh (Elevated >= 0.08 above roadbed to avoid Z-fighting)
  const roadTex = createRoadAsphaltTexture(maxAnisotropy);
  disposables.push(roadTex);
  const nSamples = ROAD_SAMPLES.length;
  const roadVerts = new Float32Array((nSamples + 1) * 2 * 3);
  const roadUvs = new Float32Array((nSamples + 1) * 2 * 2);
  const roadIndices: number[] = [];

  let accumDist = 0;
  for (let i = 0; i <= nSamples; i++) {
    const s = ROAD_SAMPLES[i % nSamples];
    if (i > 0) {
      const prev = ROAD_SAMPLES[(i - 1) % nSamples];
      accumDist += Math.hypot(s.x - prev.x, s.z - prev.z);
    }
    // Right perpendicular vector (-tz, tx)
    const len = Math.hypot(s.tx, s.tz) || 1;
    const rx = (-s.tz / len) * ROAD_HALF_WIDTH;
    const rz = (s.tx / len) * ROAD_HALF_WIDTH;
    const ry = s.y + 0.08;

    const vBase = i * 2 * 3;
    roadVerts[vBase] = s.x - rx;
    roadVerts[vBase + 1] = ry;
    roadVerts[vBase + 2] = s.z - rz;

    roadVerts[vBase + 3] = s.x + rx;
    roadVerts[vBase + 4] = ry;
    roadVerts[vBase + 5] = s.z + rz;

    const uBase = i * 2 * 2;
    const vCoord = accumDist * 0.075;
    roadUvs[uBase] = 0;
    roadUvs[uBase + 1] = vCoord;
    roadUvs[uBase + 2] = 1;
    roadUvs[uBase + 3] = vCoord;

    if (i < nSamples) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      roadIndices.push(a, c, b, b, c, d);
    }
  }

  const roadGeo = trackG(new THREE.BufferGeometry());
  roadGeo.setAttribute('position', new THREE.BufferAttribute(roadVerts, 3));
  roadGeo.setAttribute('uv', new THREE.BufferAttribute(roadUvs, 2));
  roadGeo.setIndex(roadIndices);
  roadGeo.computeVertexNormals();

  const roadMat = trackM(
    new THREE.MeshStandardMaterial({
      map: roadTex,
      roughness: 0.72,
      metalness: 0.08,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.receiveShadow = true;
  worldGroup.add(roadMesh);

  // =========================================================================
  // 4. ICONIC COMPOSITE 3D TAMIL NADU LANDMARKS (6–12 PART PROCEDURAL GROUPS)
  // =========================================================================

  const goldMat = trackM(
    new THREE.MeshPhysicalMaterial({
      color: 0xfbbf24,
      metalness: 0.92,
      roughness: 0.16,
      clearcoat: 0.8,
    })
  );
  const sandstoneMat = trackM(
    new THREE.MeshStandardMaterial({
      color: 0xd99b52,
      roughness: 0.76,
      metalness: 0.06,
    })
  );
  const darkGraniteMat = trackM(
    new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.62,
      metalness: 0.14,
    })
  );
  const statueStoneMat = trackM(
    new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.58,
      metalness: 0.08,
    })
  );

  // --- LANDMARK A: KANYAKUMARI THIRUVALLUVAR STATUE & VIVEKANANDA ROCK ---
  const kumariGroup = new THREE.Group();
  kumariGroup.position.set(-30, 0, 392);

  // Seafoam ring around Thiruvalluvar sea rock
  const foamMat = trackM(
    new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    })
  );
  const foamRing1 = new THREE.Mesh(
    trackG(new THREE.RingGeometry(15, 21, 32)),
    foamMat
  );
  foamRing1.rotation.x = -Math.PI / 2;
  foamRing1.position.y = 0.08;
  kumariGroup.add(foamRing1);

  // Granite Sea Rock Island
  const seaRock1 = new THREE.Mesh(
    trackG(new THREE.CylinderGeometry(12, 17, 6.5, 12)),
    darkGraniteMat
  );
  seaRock1.position.y = 2.8;
  seaRock1.castShadow = true;
  seaRock1.receiveShadow = true;
  kumariGroup.add(seaRock1);

  // 38-ft Athupal Sculpted Pedestal (3 stepped tiers + pillared mandapam gallery)
  const pedBase = new THREE.Mesh(
    trackG(new THREE.BoxGeometry(11.5, 3.2, 11.5)),
    sandstoneMat
  );
  pedBase.position.y = 7.6;
  pedBase.castShadow = true;
  kumariGroup.add(pedBase);

  const pedColonnade = new THREE.Mesh(
    trackG(new THREE.BoxGeometry(9.2, 5.4, 9.2)),
    sandstoneMat
  );
  pedColonnade.position.y = 11.9;
  pedColonnade.castShadow = true;
  kumariGroup.add(pedColonnade);

  const pedCrown = new THREE.Mesh(
    trackG(new THREE.BoxGeometry(10.2, 1.4, 10.2)),
    goldMat
  );
  pedCrown.position.y = 15.2;
  kumariGroup.add(pedCrown);

  // Iconic 95-ft Thiruvalluvar Sculpted Figure (facing north toward the Tamil Nadu highway!)
  const valluvar = new THREE.Group();
  valluvar.position.y = 15.9;
  valluvar.rotation.y = Math.PI; // Faces -Z (toward oncoming driver on coastal overlook!)

  // Draped Dhoti Lower Robe
  const dhoti = new THREE.Mesh(
    trackG(new THREE.CylinderGeometry(2.3, 3.1, 10.5, 16)),
    statueStoneMat
  );
  dhoti.position.y = 5.25;
  dhoti.castShadow = true;
  valluvar.add(dhoti);

  // Sculpted Torso & Angavastram Sash
  const torso = new THREE.Mesh(
    trackG(new THREE.CylinderGeometry(2.7, 2.3, 7.6, 16)),
    statueStoneMat
  );
  torso.position.y = 14.0;
  torso.castShadow = true;
  valluvar.add(torso);

  const sash = new THREE.Mesh(
    trackG(new THREE.BoxGeometry(4.8, 6.8, 1.2)),
    statueStoneMat
  );
  sash.rotation.z = 0.42;
  sash.position.set(0, 14.1, 1.45);
  valluvar.add(sash);

  // Sage Head, Flowing Beard & Traditional Kondai Topknot
  const head = new THREE.Mesh(
    trackG(new THREE.SphereGeometry(1.95, 18, 18)),
    statueStoneMat
  );
  head.position.set(0, 19.8, 0);
  head.castShadow = true;
  valluvar.add(head);

  const beard = new THREE.Mesh(
    trackG(new THREE.ConeGeometry(1.35, 3.1, 12)),
    statueStoneMat
  );
  beard.rotation.x = Math.PI;
  beard.position.set(0, 18.0, 1.05);
  valluvar.add(beard);

  const kondai = new THREE.Mesh(
    trackG(new THREE.SphereGeometry(1.05, 14, 14)),
    statueStoneMat
  );
  kondai.position.set(0, 22.1, -0.2);
  valluvar.add(kondai);

  // Raised Right Arm pointing 3 fingers skyward (Aram, Porul, Inbam)!
  const rightArm = new THREE.Mesh(
    trackG(new THREE.CylinderGeometry(0.68, 0.82, 7.4, 12)),
    statueStoneMat
  );
  rightArm.position.set(-3.1, 18.4, 0.8);
  rightArm.rotation.z = 0.18;
  valluvar.add(rightArm);

  const handPalm = new THREE.Mesh(
    trackG(new THREE.BoxGeometry(1.1, 1.8, 0.65)),
    statueStoneMat
  );
  handPalm.position.set(-3.55, 22.5, 0.85);
  valluvar.add(handPalm);

  // Left Arm holding Palm-Leaf Tirukkural Manuscript (Olai Chuvadi)
  const leftArm = new THREE.Mesh(
    trackG(new THREE.CylinderGeometry(0.68, 0.78, 5.2, 12)),
    statueStoneMat
  );
  leftArm.position.set(2.9, 14.5, 1.2);
  leftArm.rotation.x = 0.75;
  valluvar.add(leftArm);

  const olaiScroll = new THREE.Mesh(
    trackG(new THREE.BoxGeometry(2.2, 0.52, 0.75)),
    goldMat
  );
  olaiScroll.position.set(2.5, 13.6, 2.7);
  valluvar.add(olaiScroll);

  kumariGroup.add(valluvar);

  // Adjacent Vivekananda Rock Memorial Island
  const vivekRock = new THREE.Group();
  vivekRock.position.set(34, 0, -4);
  const seaRock2 = new THREE.Mesh(
    trackG(new THREE.CylinderGeometry(14, 19, 5.8, 12)),
    darkGraniteMat
  );
  seaRock2.position.y = 2.5;
  vivekRock.add(seaRock2);

  const mandapamHall = new THREE.Mesh(
    trackG(new THREE.BoxGeometry(11, 5.2, 15)),
     trackM(new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.65 }))
  );
  mandapamHall.position.y = 8.0;
  mandapamHall.castShadow = true;
  vivekRock.add(mandapamHall);

  const vimanaDome = new THREE.Mesh(
    trackG(new THREE.SphereGeometry(3.8, 16, 14)),
    sandstoneMat
  );
  vimanaDome.position.set(0, 12.2, -2);
  vivekRock.add(vimanaDome);

  const domeFinial = new THREE.Mesh(
    trackG(new THREE.ConeGeometry(0.7, 2.4, 12)),
    goldMat
  );
  domeFinial.position.set(0, 16.4, -2);
  vivekRock.add(domeFinial);

  kumariGroup.add(vivekRock);
  worldGroup.add(kumariGroup);

  // --- LANDMARK B: THANJAVUR BRIHADEESWARAR TEMPLE (தஞ்சை பெரிய கோவில்) ---
  const tanjoreGroup = new THREE.Group();
  const tjX = 128;
  const tjZ = -35;
  const tjY = groundHeightAt(tjX, tjZ);
  tanjoreGroup.position.set(tjX, tjY, tjZ);

  // Granite Temple Plinth & Prakaram Walls
  const tjPlinth = new THREE.Mesh(
    trackG(new THREE.BoxGeometry(36, 2.2, 50)),
    sandstoneMat
  );
  tjPlinth.position.y = 1.1;
  tjPlinth.receiveShadow = true;
  tanjoreGroup.add(tjPlinth);

  // 13-Tiered Soaring Chola Sri Vimana Pyramid
  for (let tier = 0; tier < 13; tier++) {
    const tFrac = tier / 13;
    const w = 16.5 * (1 - tFrac * 0.68);
    const tierMesh = new THREE.Mesh(
      trackG(new THREE.BoxGeometry(w, 2.1, w)),
      sandstoneMat
    );
    tierMesh.position.set(0, 3.2 + tier * 2.05, 8);
    tierMesh.castShadow = true;
    tierMesh.receiveShadow = true;
    tanjoreGroup.add(tierMesh);
  }

  // Monolithic 80-Ton Octagonal Sikharam Cupola + Golden Kalasam
  const sikharam = new THREE.Mesh(
    trackG(new THREE.SphereGeometry(3.6, 8, 12)),
    sandstoneMat
  );
  sikharam.position.set(0, 31.2, 8);
  sikharam.castShadow = true;
  tanjoreGroup.add(sikharam);

  const tjKalasam = new THREE.Mesh(
    trackG(new THREE.ConeGeometry(0.95, 3.8, 14)),
    goldMat
  );
  tjKalasam.position.set(0, 35.8, 8);
  tanjoreGroup.add(tjKalasam);

  // Pillared Nandi Mandapam + Sculpted Black Granite Nandi!
  const nandiPlatform = new THREE.Mesh(
    trackG(new THREE.BoxGeometry(9.5, 1.4, 11.5)),
    sandstoneMat
  );
  nandiPlatform.position.set(0, 2.8, -13);
  tanjoreGroup.add(nandiPlatform);

  const nandiBody = new THREE.Mesh(
    trackG(new THREE.CapsuleGeometry(1.5, 3.0, 8, 12)),
    darkGraniteMat
  );
  nandiBody.rotation.x = Math.PI / 2;
  nandiBody.position.set(0, 4.7, -13);
  tanjoreGroup.add(nandiBody);

  const nandiHead = new THREE.Mesh(
    trackG(new THREE.SphereGeometry(1.25, 12, 12)),
    darkGraniteMat
  );
  nandiHead.position.set(0, 5.8, -10.8);
  tanjoreGroup.add(nandiHead);

  const nandiRoof = new THREE.Mesh(
    trackG(new THREE.BoxGeometry(9.8, 1.2, 11.8)),
    sandstoneMat
  );
  nandiRoof.position.set(0, 8.2, -13);
  tanjoreGroup.add(nandiRoof);

  worldGroup.add(tanjoreGroup);

  // --- LANDMARK C: MADURAI MEENAKSHI AMMAN TEMPLE (மதுரை மீனாட்சி அம்மன் கோவில்) ---
  const maduraiGroup = new THREE.Group();
  const mdX = -46;
  const mdZ = 158;
  const mdY = groundHeightAt(mdX, mdZ);
  maduraiGroup.position.set(mdX, mdY, mdZ);

  const stuccoTex = createGopuramStuccoTexture(maxAnisotropy);
  disposables.push(stuccoTex);
  const gopuramMat = trackM(
    new THREE.MeshStandardMaterial({
      map: stuccoTex,
      roughness: 0.58,
      metalness: 0.08,
    })
  );

  const buildRajaGopuram = (gx: number, gz: number, rotY: number) => {
    const g = new THREE.Group();
    g.position.set(gx, 0, gz);
    g.rotation.y = rotY;

    // Stone base gateway
    const base = new THREE.Mesh(
      trackG(new THREE.BoxGeometry(15, 5.5, 9.5)),
      sandstoneMat
    );
    base.position.y = 2.75;
    base.castShadow = true;
    g.add(base);

    // 9 Colorful Dravidian Stucco Tiers
    for (let t = 0; t < 9; t++) {
      const frac = t / 9;
      const w = 14.2 * (1 - frac * 0.52);
      const d = 8.8 * (1 - frac * 0.55);
      const tier = new THREE.Mesh(
        trackG(new THREE.BoxGeometry(w, 2.55, d)),
        gopuramMat
      );
      tier.position.y = 6.7 + t * 2.5;
      tier.castShadow = true;
      g.add(tier);
    }

    // Vaulted Sala Crown + 7 Golden Kalasams
    const sala = new THREE.Mesh(
      trackG(new THREE.CylinderGeometry(1.9, 2.2, 7.2, 16)),
      goldMat
    );
    sala.rotation.z = Math.PI / 2;
    sala.position.y = 29.5;
    g.add(sala);

    for (let k = -3; k <= 3; k++) {
      const kalasam = new THREE.Mesh(
        trackG(new THREE.ConeGeometry(0.32, 1.35, 10)),
        goldMat
      );
      kalasam.position.set(k * 0.95, 31.8, 0);
      g.add(kalasam);
    }
    return g;
  };

  maduraiGroup.add(buildRajaGopuram(0, -18, 0));
  maduraiGroup.add(buildRajaGopuram(-18, 4, Math.PI / 2));

  // Sacred Potramarai Kulam (Golden Lotus Tank)
  const tankFrame = new THREE.Mesh(
    trackG(new THREE.BoxGeometry(18, 1.2, 18)),
    sandstoneMat
  );
  tankFrame.position.set(4, 0.6, 4);
  maduraiGroup.add(tankFrame);

  const tankWater = new THREE.Mesh(
    trackG(new THREE.PlaneGeometry(14.5, 14.5)),
    trackM(new THREE.MeshPhysicalMaterial({ color: 0x0d9488, roughness: 0.12, clearcoat: 1 }))
  );
  tankWater.rotation.x = -Math.PI / 2;
  tankWater.position.set(4, 1.26, 4);
  maduraiGroup.add(tankWater);

  // Central Golden Lotus Sculpture!
  const goldenLotus = new THREE.Mesh(
    trackG(new THREE.OctahedronGeometry(1.6, 1)),
    goldMat
  );
  goldenLotus.position.set(4, 2.4, 4);
  maduraiGroup.add(goldenLotus);

  worldGroup.add(maduraiGroup);

  // --- LANDMARK D: CHENNAI MARINA LIGHTHOUSE & NAPIER BRIDGE ARCHES ---
  const chennaiRoad = findNearestRoad(162, -312);
  const napierGroup = new THREE.Group();
  napierGroup.position.set(chennaiRoad.x, chennaiRoad.roadY, chennaiRoad.z);
  napierGroup.rotation.y = Math.atan2(chennaiRoad.tx, chennaiRoad.tz);

  const whiteBridgeMat = trackM(
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 })
  );
  const blueBridgeMat = trackM(
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.38 })
  );

  // Twin Bowstring Arches spanning either side of the highway!
  [-ROAD_HALF_WIDTH - 1.1, ROAD_HALF_WIDTH + 1.1].forEach((sideX) => {
    for (const zOff of [-11, 11]) {
      const arch = new THREE.Mesh(
        trackG(new THREE.TorusGeometry(9.5, 0.65, 12, 28, Math.PI)),
        sideX < 0 ? whiteBridgeMat : blueBridgeMat
      );
      arch.rotation.y = Math.PI / 2;
      arch.position.set(sideX, 0.2, zOff);
      arch.castShadow = true;
      napierGroup.add(arch);

      // Vertical suspension hangers
      for (let h = -6; h <= 6; h += 3) {
        const hangerH = Math.sqrt(Math.max(1, 90 - h * h));
        const rod = new THREE.Mesh(
          trackG(new THREE.CylinderGeometry(0.1, 0.1, hangerH, 8)),
          whiteBridgeMat
        );
        rod.position.set(sideX, hangerH * 0.5, zOff + h);
        napierGroup.add(rod);
      }
    }
  });
  worldGroup.add(napierGroup);

  // Iconic Red-and-White Banded Chennai Marina Lighthouse!
  const lighthouseGroup = new THREE.Group();
  const lhX = 182;
  const lhZ = -295;
  lighthouseGroup.position.set(lhX, groundHeightAt(lhX, lhZ), lhZ);

  const redStripeMat = trackM(
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45 })
  );
  for (let band = 0; band < 6; band++) {
    const rBot = 3.6 - band * 0.28;
    const rTop = 3.6 - (band + 1) * 0.28;
    const cyl = new THREE.Mesh(
      trackG(new THREE.CylinderGeometry(rTop, rBot, 4.4, 16)),
      band % 2 === 0 ? redStripeMat : whiteBridgeMat
    );
    cyl.position.y = 2.2 + band * 4.4;
    cyl.castShadow = true;
    lighthouseGroup.add(cyl);
  }

  const lanternRoom = new THREE.Mesh(
    trackG(new THREE.CylinderGeometry(2.1, 2.1, 2.8, 16)),
    goldMat
  );
  lanternRoom.position.y = 27.8;
  lighthouseGroup.add(lanternRoom);

  const lighthouseBeacon = new THREE.Group();
  lighthouseBeacon.position.y = 28.0;
  const beaconCone = new THREE.Mesh(
    trackG(new THREE.ConeGeometry(4.5, 28, 16, 1, true)),
    trackM(
      new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
  );
  beaconCone.rotation.z = Math.PI / 2;
  beaconCone.position.x = 14;
  lighthouseBeacon.add(beaconCone);
  lighthouseGroup.add(lighthouseBeacon);
  worldGroup.add(lighthouseGroup);

  // --- LANDMARK E: OOTY NILGIRI MOUNTAIN VIEWPOINT & HERITAGE RAILWAY ARCHES ---
  const ootyGroup = new THREE.Group();
  const otX = -232;
  const otZ = -138;
  const otY = groundHeightAt(otX, otZ);
  ootyGroup.position.set(otX, otY, otZ);

  // Stepped Emerald Tea Estate Terraces
  const teaMat = trackM(
    new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.85 })
  );
  for (let step = 0; step < 5; step++) {
    const terrace = new THREE.Mesh(
      trackG(new THREE.CylinderGeometry(18 - step * 3, 20 - step * 3, 2.2, 18)),
      teaMat
    );
    terrace.position.set(-6, 1.1 + step * 2.1, 0);
    terrace.receiveShadow = true;
    ootyGroup.add(terrace);
  }

  // Timber & Red-Tile Doddabetta Mist Pavilion on top of tea terraces
  const pavPillars = new THREE.Mesh(
    trackG(new THREE.CylinderGeometry(4.2, 4.6, 4.5, 8)),
    sandstoneMat
  );
  pavPillars.position.set(-6, 12.8, 0);
  ootyGroup.add(pavPillars);

  const pavRoof = new THREE.Mesh(
    trackG(new THREE.ConeGeometry(6.8, 3.6, 8)),
    redStripeMat
  );
  pavRoof.position.set(-6, 16.8, 0);
  pavRoof.castShadow = true;
  ootyGroup.add(pavRoof);

  worldGroup.add(ootyGroup);

  // =========================================================================
  // 5. INSTANCED FLORA & HIGHWAY PROPS (COCONUT PALMS, NILGIRI PINES, POSTS)
  // =========================================================================
  const palmCount = 150;
  const trunkGeo = trackG(new THREE.CylinderGeometry(0.22, 0.38, 7.5, 7));
  trunkGeo.translate(0, 3.75, 0);
  const trunkMat = trackM(
    new THREE.MeshStandardMaterial({ color: 0x78553a, roughness: 0.9 })
  );
  const palmTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, palmCount);

  const crownGeo = trackG(new THREE.ConeGeometry(2.8, 2.4, 7));
  crownGeo.translate(0, 7.6, 0);
  const crownMat = trackM(
    new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.78 })
  );
  const palmCrowns = new THREE.InstancedMesh(crownGeo, crownMat, palmCount);

  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  let placedPalms = 0;
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let attempt = 0; attempt < 900 && placedPalms < palmCount; attempt++) {
    const px = WORLD_BOUNDS.minX + rand() * (WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX);
    const pz = WORLD_BOUNDS.minZ + rand() * (WORLD_BOUNDS.maxZ - WORLD_BOUNDS.minZ);
    const py = groundHeightAt(px, pz);
    const nr = findNearestRoad(px, pz);

    // Place coconut palms on coastal & plains land safely away from highway & temples
    if (
      py > 1.2 &&
      py < 12 &&
      nr.dist > ROAD_HALF_WIDTH + 4.5 &&
      Math.hypot(px - tjX, pz - tjZ) > 36 &&
      Math.hypot(px - mdX, pz - mdZ) > 36
    ) {
      const sc = 0.85 + rand() * 0.35;
      dummy.position.set(px, py - 0.15, pz);
      dummy.rotation.set((rand() - 0.5) * 0.14, rand() * Math.PI * 2, (rand() - 0.5) * 0.14);
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      palmTrunks.setMatrixAt(placedPalms, dummy.matrix);
      palmCrowns.setMatrixAt(placedPalms, dummy.matrix);

      tint.setHSL(0.29 + (rand() - 0.5) * 0.05, 0.62, 0.34 + rand() * 0.1);
      palmCrowns.setColorAt(placedPalms, tint);
      placedPalms++;
    }
  }
  palmTrunks.count = placedPalms;
  palmCrowns.count = placedPalms;
  palmTrunks.instanceMatrix.needsUpdate = true;
  palmCrowns.instanceMatrix.needsUpdate = true;
  if (palmCrowns.instanceColor) palmCrowns.instanceColor.needsUpdate = true;
  palmTrunks.computeBoundingSphere();
  palmCrowns.computeBoundingSphere();
  palmTrunks.castShadow = true;
  palmCrowns.castShadow = true;
  worldGroup.add(palmTrunks);
  worldGroup.add(palmCrowns);

  // Nilgiri Pine / Eucalyptus Trees on elevated hills (y >= 11)
  const pineCount = 120;
  const pineGeo = trackG(new THREE.ConeGeometry(2.4, 9.5, 7));
  pineGeo.translate(0, 5.2, 0);
  const pineMat = trackM(
    new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.82 })
  );
  const pines = new THREE.InstancedMesh(pineGeo, pineMat, pineCount);
  let placedPines = 0;

  for (let attempt = 0; attempt < 900 && placedPines < pineCount; attempt++) {
    const px = -290 + rand() * 190;
    const pz = -260 + rand() * 520;
    const py = groundHeightAt(px, pz);
    const nr = findNearestRoad(px, pz);
    if (py >= 10.5 && nr.dist > ROAD_HALF_WIDTH + 4.2 && Math.hypot(px - otX, pz - otZ) > 25) {
      const sc = 0.85 + rand() * 0.4;
      dummy.position.set(px, py - 0.3, pz);
      dummy.rotation.set(0, rand() * Math.PI * 2, 0);
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      pines.setMatrixAt(placedPines, dummy.matrix);
      tint.setHSL(0.38 + (rand() - 0.5) * 0.04, 0.55, 0.24 + rand() * 0.08);
      pines.setColorAt(placedPines, tint);
      placedPines++;
    }
  }
  pines.count = placedPines;
  pines.instanceMatrix.needsUpdate = true;
  if (pines.instanceColor) pines.instanceColor.needsUpdate = true;
  pines.computeBoundingSphere();
  pines.castShadow = true;
  worldGroup.add(pines);

  // Highway Reflector Marker Posts along curves
  const postCount = Math.floor(ROAD_SAMPLES.length / 6) * 2;
  const postGeo = trackG(new THREE.BoxGeometry(0.28, 1.05, 0.28));
  postGeo.translate(0, 0.52, 0);
  const postMat = trackM(
    new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.45,
      roughness: 0.4,
    })
  );
  const posts = new THREE.InstancedMesh(postGeo, postMat, postCount);
  let pIdx = 0;
  for (let i = 0; i < ROAD_SAMPLES.length; i += 6) {
    const s = ROAD_SAMPLES[i];
    const len = Math.hypot(s.tx, s.tz) || 1;
    const rx = (-s.tz / len) * (ROAD_HALF_WIDTH + 0.9);
    const rz = (s.tx / len) * (ROAD_HALF_WIDTH + 0.9);
    for (const side of [-1, 1]) {
      if (pIdx < postCount) {
        dummy.position.set(s.x + rx * side, s.y, s.z + rz * side);
        dummy.rotation.set(0, Math.atan2(s.tx, s.tz), 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        posts.setMatrixAt(pIdx++, dummy.matrix);
      }
    }
  }
  posts.count = pIdx;
  posts.instanceMatrix.needsUpdate = true;
  posts.computeBoundingSphere();
  worldGroup.add(posts);

  // 6. Glowing Golden Race Checkpoint Arch (Positioned dynamically for Race Mode!)
  const checkpointArch = new THREE.Group();
  const archBeamMat = trackM(
    new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.85,
    })
  );
  const leftPillar = new THREE.Mesh(
    trackG(new THREE.CylinderGeometry(0.45, 0.55, 11, 12)),
    goldMat
  );
  leftPillar.position.set(-ROAD_HALF_WIDTH - 0.6, 5.5, 0);
  checkpointArch.add(leftPillar);

  const rightPillar = new THREE.Mesh(
    trackG(new THREE.CylinderGeometry(0.45, 0.55, 11, 12)),
    goldMat
  );
  rightPillar.position.set(ROAD_HALF_WIDTH + 0.6, 5.5, 0);
  checkpointArch.add(rightPillar);

  const topBanner = new THREE.Mesh(
    trackG(new THREE.BoxGeometry((ROAD_HALF_WIDTH + 1.2) * 2, 1.5, 0.8)),
    archBeamMat
  );
  topBanner.position.set(0, 10.8, 0);
  checkpointArch.add(topBanner);

  const skyBeacon = new THREE.Mesh(
    trackG(new THREE.CylinderGeometry(0.9, 2.8, 48, 16, 1, true)),
    trackM(
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
  );
  skyBeacon.position.set(0, 24, 0);
  checkpointArch.add(skyBeacon);

  checkpointArch.visible = false;
  worldGroup.add(checkpointArch);

  const setActiveCheckpoint = (landmarkId: LandmarkId | null) => {
    if (!landmarkId) {
      checkpointArch.visible = false;
      return;
    }
    const lm = LANDMARKS[landmarkId];
    const nr = findNearestRoad(lm.worldX, lm.worldZ);
    checkpointArch.position.set(nr.x, nr.roadY, nr.z);
    checkpointArch.rotation.y = Math.atan2(nr.tx, nr.tz);
    checkpointArch.visible = true;
  };

  // Place subtle permanent landmark beacon rings in Free Roam / Race
  RACE_ORDER.forEach((id) => {
    const lm = LANDMARKS[id];
    const nr = findNearestRoad(lm.worldX, lm.worldZ);
    const marker = new THREE.Mesh(
      trackG(new THREE.RingGeometry(2.8, 3.5, 24)),
      trackM(
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(lm.accentColor),
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
        })
      )
    );
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(nr.x, nr.roadY + 0.12, nr.z);
    worldGroup.add(marker);
  });

  return {
    worldGroup,
    oceanMesh,
    lighthouseBeacon,
    checkpointArch,
    setActiveCheckpoint,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
