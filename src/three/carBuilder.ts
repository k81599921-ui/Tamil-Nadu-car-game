import * as THREE from 'three';
import { CarCustomization } from '../types/game';

export interface CarRig {
  root: THREE.Group;
  bodyGroup: THREE.Group; // Tilts for pitch/roll/squat
  frontLeftPivot: THREE.Group; // Steers Y
  frontRightPivot: THREE.Group; // Steers Y
  wheels: THREE.Group[]; // Spins X (FL, FR, RL, RR)
  nitroFlames: THREE.Mesh[];
  headlightBeams: THREE.Mesh[];
  dispose: () => void;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 128, 12, 64, 128, 62);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  grad.addColorStop(0.65, 'rgba(0, 0, 0, 0.36)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.save();
  ctx.scale(1, 1.9);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(64, 67, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createNumberPlateTexture(
  district: string,
  numberText: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Crisp Indian High-Security Registration Plate (HSRP) style
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, 512, 128);

  // Outer dark metallic border
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 502, 118);

  // Left blue IND strip
  ctx.fillStyle = '#1D4ED8';
  ctx.fillRect(12, 12, 68, 104);

  // Ashoka Chakra ring hint + IND text
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(46, 44, 14, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('IND', 46, 98);

  // Plate registration string
  const cleanCode = `${district.trim()} ${numberText.trim().slice(0, 8)}`.toUpperCase();
  ctx.fillStyle = '#090D16';
  ctx.font = 'bold 54px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cleanCode, 292, 66);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function buildCarRig(
  config: CarCustomization,
  isSoftwareGl: boolean,
  maxAnisotropy: number
): CarRig {
  const disposables: Array<{ dispose: () => void }> = [];
  const trackG = <T extends THREE.BufferGeometry>(g: T): T => {
    disposables.push(g);
    return g;
  };
  const trackM = <T extends THREE.Material>(m: T): T => {
    disposables.push(m);
    return m;
  };

  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  // Soft Grounding Contact Shadow (y = 0.03 to prevent Z-fighting)
  const shadowTex = createContactShadowTexture();
  disposables.push(shadowTex);
  const shadowMat = trackM(
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  const shadowPlane = new THREE.Mesh(
    trackG(new THREE.PlaneGeometry(2.9, 5.4)),
    shadowMat
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.03;
  root.add(shadowPlane);

  // Optional Chassis Underglow
  if (config.underglowColor !== 'none') {
    const glowMat = trackM(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(config.underglowColor),
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    const glowPlane = new THREE.Mesh(
      trackG(new THREE.PlaneGeometry(2.35, 4.4)),
      glowMat
    );
    glowPlane.rotation.x = -Math.PI / 2;
    glowPlane.position.y = 0.05;
    root.add(glowPlane);
  }

  // Primary Car Paint Material (varied PBR finish)
  const paintMat = trackM(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(config.bodyColor),
      metalness:
        config.finish === 'metallic'
          ? 0.82
          : config.finish === 'pearl'
            ? 0.45
            : 0.18,
      roughness:
        config.finish === 'matte'
          ? 0.62
          : config.finish === 'pearl'
            ? 0.18
            : 0.22,
      clearcoat: config.finish === 'matte' ? 0.08 : 1.0,
      clearcoatRoughness: config.finish === 'matte' ? 0.5 : 0.08,
      iridescence: config.finish === 'pearl' ? 0.85 : 0,
      iridescenceIOR: 1.35,
    })
  );

  // Secondary Trim / Chassis Material (roughness delta >= 0.25 vs body)
  const trimMat = trackM(
    new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.35,
      roughness: 0.72,
    })
  );

  const chromeMat = trackM(
    new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.95,
      roughness: 0.12,
    })
  );

  const glassMat = trackM(
    new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      metalness: 0.1,
      roughness: 0.08,
      transmission: isSoftwareGl ? 0 : 0.62,
      transparent: true,
      opacity: isSoftwareGl ? 0.78 : 0.9,
      ior: 1.5,
      clearcoat: 1.0,
      depthWrite: false,
    })
  );

  const headlightMat = trackM(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfef08a,
      emissiveIntensity: 2.2,
      roughness: 0.15,
    })
  );

  const taillightMat = trackM(
    new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 2.0,
      roughness: 0.2,
    })
  );

  // Build Model-Specific Silhouette (1. Hull, 2. Cabin/Fenders, 3. Accents)
  let wheelRadius = 0.4;
  let wheelWidth = 0.28;
  let wheelbaseHalfZ = 1.38;
  let trackHalfX = 0.98;
  let roofTopY = 1.32;
  let hoodFrontZ = 2.08;
  let rearBackZ = -2.1;

  if (config.modelId === 'kaveri_gt') {
    wheelRadius = 0.39;
    wheelWidth = 0.3;
    wheelbaseHalfZ = 1.42;
    trackHalfX = 1.02;
    roofTopY = 1.24;
    hoodFrontZ = 2.22;
    rearBackZ = -2.16;

    // Extruded aerodynamic side profile (+Z is forward)
    const sideShape = new THREE.Shape();
    sideShape.moveTo(-2.16, 0.32);
    sideShape.lineTo(2.2, 0.26);
    sideShape.lineTo(2.26, 0.52);
    sideShape.lineTo(1.35, 0.76);
    sideShape.lineTo(0.45, 1.2);
    sideShape.lineTo(-0.85, 1.18);
    sideShape.lineTo(-1.95, 0.82);
    sideShape.lineTo(-2.18, 0.65);
    sideShape.closePath();

    const hullGeo = trackG(
      new THREE.ExtrudeGeometry(sideShape, {
        depth: 1.82,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.08,
        bevelSegments: 3,
      })
    );
    hullGeo.rotateY(Math.PI / 2);
    hullGeo.translate(-0.91, 0, 0);
    const hull = new THREE.Mesh(hullGeo, paintMat);
    hull.castShadow = true;
    hull.receiveShadow = true;
    bodyGroup.add(hull);

    // Smoked Aero Glass Canopy
    const canopyGeo = trackG(new THREE.BoxGeometry(1.52, 0.42, 1.95));
    const canopy = new THREE.Mesh(canopyGeo, glassMat);
    canopy.position.set(0, 1.03, -0.18);
    canopy.renderOrder = 2;
    bodyGroup.add(canopy);

    // Lower Carbon Splitter & Diffuser
    const splitter = new THREE.Mesh(
      trackG(new THREE.BoxGeometry(2.04, 0.1, 4.48)),
      trimMat
    );
    splitter.position.set(0, 0.25, 0.02);
    bodyGroup.add(splitter);

    // Side Air Intakes
    [-0.98, 0.98].forEach((sx) => {
      const intake = new THREE.Mesh(
        trackG(new THREE.BoxGeometry(0.12, 0.32, 0.95)),
        trimMat
      );
      intake.position.set(sx, 0.56, -0.35);
      bodyGroup.add(intake);
    });

    // Sleek Angular LED Headlights & Rear Lightbar
    [-0.68, 0.68].forEach((hx) => {
      const hl = new THREE.Mesh(
        trackG(new THREE.BoxGeometry(0.42, 0.1, 0.18)),
        headlightMat
      );
      hl.position.set(hx, 0.54, 2.22);
      bodyGroup.add(hl);
    });
    const rearBar = new THREE.Mesh(
      trackG(new THREE.BoxGeometry(1.76, 0.11, 0.1)),
      taillightMat
    );
    rearBar.position.set(0, 0.72, -2.19);
    bodyGroup.add(rearBar);
  } else if (config.modelId === 'nilgiri_4x4') {
    wheelRadius = 0.49;
    wheelWidth = 0.34;
    wheelbaseHalfZ = 1.36;
    trackHalfX = 1.06;
    roofTopY = 1.78;
    hoodFrontZ = 2.02;
    rearBackZ = -2.02;

    // Rugged 4x4 Lower Tub
    const tub = new THREE.Mesh(
      trackG(new THREE.BoxGeometry(1.88, 0.68, 3.96)),
      paintMat
    );
    tub.position.set(0, 0.78, 0);
    tub.castShadow = true;
    tub.receiveShadow = true;
    bodyGroup.add(tub);

    // Boxy Hardtop Cabin & Roll Cage
    const cabin = new THREE.Mesh(
      trackG(new THREE.BoxGeometry(1.82, 0.72, 2.35)),
      trimMat
    );
    cabin.position.set(0, 1.44, -0.58);
    cabin.castShadow = true;
    bodyGroup.add(cabin);

    const windshield = new THREE.Mesh(
      trackG(new THREE.BoxGeometry(1.66, 0.54, 2.15)),
      glassMat
    );
    windshield.position.set(0, 1.44, -0.52);
    windshield.renderOrder = 2;
    bodyGroup.add(windshield);

    // Flared Off-Road Fender Arches & Heavy Bumpers
    const frontBumper = new THREE.Mesh(
      trackG(new THREE.BoxGeometry(2.14, 0.24, 0.36)),
      trimMat
    );
    frontBumper.position.set(0, 0.46, 2.04);
    bodyGroup.add(frontBumper);

    const rearBumper = new THREE.Mesh(
      trackG(new THREE.BoxGeometry(2.12, 0.24, 0.32)),
      trimMat
    );
    rearBumper.position.set(0, 0.48, -2.02);
    bodyGroup.add(rearBumper);

    [-0.98, 0.98].forEach((fx) => {
      [1.34, -1.34].forEach((fz) => {
        const flare = new THREE.Mesh(
          trackG(new THREE.BoxGeometry(0.28, 0.22, 0.96)),
          trimMat
        );
        flare.position.set(fx, 0.78, fz);
        bodyGroup.add(flare);
      });
    });

    // Classic 7-Slot Front Grille + Round Halo Headlights
    const grille = new THREE.Mesh(
      trackG(new THREE.BoxGeometry(1.48, 0.5, 0.08)),
      trimMat
    );
    grille.position.set(0, 0.86, 1.99);
    bodyGroup.add(grille);

    [-0.54, 0.54].forEach((hx) => {
      const roundHl = new THREE.Mesh(
        trackG(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 20)),
        headlightMat
      );
      roundHl.rotation.x = Math.PI / 2;
      roundHl.position.set(hx, 0.88, 2.02);
      bodyGroup.add(roundHl);
    });

    // Rear-Mounted Full-Size Spare Tire!
    const spareTire = new THREE.Mesh(
      trackG(new THREE.CylinderGeometry(0.42, 0.42, 0.26, 24)),
      trimMat
    );
    spareTire.rotation.x = Math.PI / 2;
    spareTire.position.set(0, 1.12, -2.12);
    spareTire.castShadow = true;
    bodyGroup.add(spareTire);

    [-0.78, 0.78].forEach((tx) => {
      const tl = new THREE.Mesh(
        trackG(new THREE.BoxGeometry(0.18, 0.32, 0.1)),
        taillightMat
      );
      tl.position.set(tx, 0.92, -2.0);
      bodyGroup.add(tl);
    });
  } else {
    // Madras Classic (Iconic Curved Vintage Ambassador)
    wheelRadius = 0.4;
    wheelWidth = 0.25;
    wheelbaseHalfZ = 1.38;
    trackHalfX = 0.95;
    roofTopY = 1.48;
    hoodFrontZ = 2.12;
    rearBackZ = -2.12;

    // Rounded Vintage Side Profile
    const ambyShape = new THREE.Shape();
    ambyShape.moveTo(-2.12, 0.34);
    ambyShape.lineTo(2.08, 0.34);
    ambyShape.quadraticCurveTo(2.18, 0.68, 1.92, 0.88);
    ambyShape.lineTo(0.95, 0.96);
    ambyShape.quadraticCurveTo(0.65, 1.46, 0.15, 1.48);
    ambyShape.lineTo(-0.85, 1.46);
    ambyShape.quadraticCurveTo(-1.35, 1.42, -1.62, 0.94);
    ambyShape.quadraticCurveTo(-2.14, 0.86, -2.12, 0.34);
    ambyShape.closePath();

    const hullGeo = trackG(
      new THREE.ExtrudeGeometry(ambyShape, {
        depth: 1.68,
        bevelEnabled: true,
        bevelThickness: 0.14,
        bevelSize: 0.12,
        bevelSegments: 4,
      })
    );
    hullGeo.rotateY(Math.PI / 2);
    hullGeo.translate(-0.84, 0, 0);
    const hull = new THREE.Mesh(hullGeo, paintMat);
    hull.castShadow = true;
    hull.receiveShadow = true;
    bodyGroup.add(hull);

    // Classic Greenhouse Windows
    const cabinGlass = new THREE.Mesh(
      trackG(new THREE.BoxGeometry(1.58, 0.44, 2.08)),
      glassMat
    );
    cabinGlass.position.set(0, 1.18, -0.35);
    cabinGlass.renderOrder = 2;
    bodyGroup.add(cabinGlass);

    // Signature Chrome Bumpers & Horizontal Chrome Grille
    const fChrome = new THREE.Mesh(
      trackG(new THREE.BoxGeometry(1.98, 0.16, 0.24)),
      chromeMat
    );
    fChrome.position.set(0, 0.38, 2.16);
    bodyGroup.add(fChrome);

    const rChrome = new THREE.Mesh(
      trackG(new THREE.BoxGeometry(1.98, 0.16, 0.24)),
      chromeMat
    );
    rChrome.position.set(0, 0.38, -2.16);
    bodyGroup.add(rChrome);

    const chromeGrille = new THREE.Mesh(
      trackG(new THREE.BoxGeometry(1.24, 0.32, 0.08)),
      chromeMat
    );
    chromeGrille.position.set(0, 0.64, 2.15);
    bodyGroup.add(chromeGrille);

    // Classic Round Chrome-Bezel Headlamps
    [-0.68, 0.68].forEach((hx) => {
      const bezel = new THREE.Mesh(
        trackG(new THREE.CylinderGeometry(0.19, 0.19, 0.1, 20)),
        chromeMat
      );
      bezel.rotation.x = Math.PI / 2;
      bezel.position.set(hx, 0.74, 2.12);
      bodyGroup.add(bezel);

      const lamp = new THREE.Mesh(
        trackG(new THREE.CylinderGeometry(0.15, 0.15, 0.12, 20)),
        headlightMat
      );
      lamp.rotation.x = Math.PI / 2;
      lamp.position.set(hx, 0.74, 2.14);
      bodyGroup.add(lamp);
    });

    [-0.72, 0.72].forEach((tx) => {
      const tail = new THREE.Mesh(
        trackG(new THREE.BoxGeometry(0.16, 0.3, 0.1)),
        taillightMat
      );
      tail.position.set(tx, 0.68, -2.16);
      bodyGroup.add(tail);
    });
  }

  // Side Mirrors (Accent Detail)
  [-0.98, 0.98].forEach((mx) => {
    const mirror = new THREE.Mesh(
      trackG(new THREE.BoxGeometry(0.22, 0.12, 0.16)),
      paintMat
    );
    mirror.position.set(mx, 0.98, 0.56);
    bodyGroup.add(mirror);
  });

  // Front & Rear TN District Number Plates!
  const plateTex = createNumberPlateTexture(
    config.plateDistrict,
    config.plateNumber,
    maxAnisotropy
  );
  disposables.push(plateTex);
  const plateMat = trackM(
    new THREE.MeshStandardMaterial({
      map: plateTex,
      roughness: 0.32,
      metalness: 0.1,
    })
  );
  const plateGeo = trackG(new THREE.PlaneGeometry(0.82, 0.21));

  const frontPlate = new THREE.Mesh(plateGeo, plateMat);
  frontPlate.position.set(0, 0.4, hoodFrontZ + 0.17);
  bodyGroup.add(frontPlate);

  const rearPlate = new THREE.Mesh(plateGeo, plateMat);
  rearPlate.rotation.y = Math.PI;
  rearPlate.position.set(0, 0.52, rearBackZ - 0.16);
  bodyGroup.add(rearPlate);

  // Customizable Accessories (Spoiler, Roof Rack, or Festive Temple Garland!)
  if (config.accessory === 'spoiler') {
    const wingGroup = new THREE.Group();
    [-0.58, 0.58].forEach((sx) => {
      const strut = new THREE.Mesh(
        trackG(new THREE.BoxGeometry(0.08, 0.34, 0.28)),
        trimMat
      );
      strut.position.set(sx, 0.98, rearBackZ + 0.28);
      wingGroup.add(strut);
    });
    const blade = new THREE.Mesh(
      trackG(new THREE.BoxGeometry(1.96, 0.08, 0.42)),
      paintMat
    );
    blade.position.set(0, 1.16, rearBackZ + 0.24);
    blade.rotation.x = 0.12;
    blade.castShadow = true;
    wingGroup.add(blade);
    bodyGroup.add(wingGroup);
  } else if (config.accessory === 'roofrack') {
    const rackGroup = new THREE.Group();
    const frame = new THREE.Mesh(
      trackG(new THREE.BoxGeometry(1.42, 0.12, 1.56)),
      trimMat
    );
    frame.position.set(0, roofTopY + 0.08, -0.42);
    rackGroup.add(frame);

    // 4 Auxiliary Rally Spotlights on front of roof rack
    [-0.45, -0.15, 0.15, 0.45].forEach((lx) => {
      const pod = new THREE.Mesh(
        trackG(new THREE.CylinderGeometry(0.09, 0.09, 0.12, 14)),
        headlightMat
      );
      pod.rotation.x = Math.PI / 2;
      pod.position.set(lx, roofTopY + 0.16, 0.38);
      rackGroup.add(pod);
    });
    bodyGroup.add(rackGroup);
  } else if (config.accessory === 'garland') {
    // Authentic Tamil Nadu Festive Car Pooja Marigold & Jasmine Garland (பூ மாலை)!
    const garlandGroup = new THREE.Group();
    const marigoldMat = trackM(
      new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.78 })
    );
    const jasmineMat = trackM(
      new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.7 })
    );
    const leafMat = trackM(
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.65 })
    );
    const beadCount = 15;
    for (let i = 0; i < beadCount; i++) {
      const t = i / (beadCount - 1); // 0..1 across hood/grille
      const gx = (t - 0.5) * 1.48;
      const sag = Math.sin(t * Math.PI) * 0.26;
      const gy = 0.78 - sag;
      const gz = hoodFrontZ + 0.11 + Math.sin(t * Math.PI) * 0.06;
      const mat = i % 3 === 0 ? jasmineMat : i % 5 === 0 ? leafMat : marigoldMat;
      const flower = new THREE.Mesh(
        trackG(new THREE.SphereGeometry(0.075, 10, 10)),
        mat
      );
      flower.position.set(gx, gy, gz);
      garlandGroup.add(flower);
    }
    bodyGroup.add(garlandGroup);
  }

  // Dual Exhaust Pipes + Nitro Boost Flame Cones
  const nitroFlames: THREE.Mesh[] = [];
  const flameMat = trackM(
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  [-0.52, 0.52].forEach((ex) => {
    const pipe = new THREE.Mesh(
      trackG(new THREE.CylinderGeometry(0.07, 0.07, 0.28, 12)),
      chromeMat
    );
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(ex, 0.32, rearBackZ - 0.08);
    bodyGroup.add(pipe);

    const flame = new THREE.Mesh(
      trackG(new THREE.ConeGeometry(0.11, 0.85, 12)),
      flameMat
    );
    flame.rotation.x = -Math.PI / 2;
    flame.position.set(ex, 0.32, rearBackZ - 0.58);
    flame.visible = false;
    bodyGroup.add(flame);
    nitroFlames.push(flame);
  });

  // Subtle Volumetric Headlight Ground Cones
  const headlightBeams: THREE.Mesh[] = [];
  const beamMat = trackM(
    new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.11,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  [-0.62, 0.62].forEach((bx) => {
    const cone = new THREE.Mesh(
      trackG(new THREE.ConeGeometry(0.9, 5.2, 16, 1, true)),
      beamMat
    );
    cone.rotation.x = -Math.PI / 2 - 0.08;
    cone.position.set(bx, 0.45, hoodFrontZ + 2.6);
    bodyGroup.add(cone);
    headlightBeams.push(cone);
  });

  // Build 4 Composite Wheels (Tire + Custom Rim + Spokes/Cap)
  const tireMat = trackM(
    new THREE.MeshStandardMaterial({
      color: 0x171717,
      roughness: 0.88,
      metalness: 0.08,
    })
  );
  const rimMat = trackM(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(config.wheelColor),
      metalness: 0.9,
      roughness: 0.18,
      clearcoat: 0.8,
    })
  );

  const createWheelAssembly = (): THREE.Group => {
    const wg = new THREE.Group();
    const tire = new THREE.Mesh(
      trackG(new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 24)),
      tireMat
    );
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wg.add(tire);

    const rimRadius = wheelRadius * 0.68;
    const rim = new THREE.Mesh(
      trackG(new THREE.CylinderGeometry(rimRadius, rimRadius, wheelWidth + 0.02, 20)),
      rimMat
    );
    rim.rotation.z = Math.PI / 2;
    wg.add(rim);

    if (config.wheelStyle === 'sport') {
      for (let s = 0; s < 5; s++) {
        const spoke = new THREE.Mesh(
          trackG(new THREE.BoxGeometry(wheelWidth + 0.04, rimRadius * 1.85, 0.055)),
          chromeMat
        );
        spoke.rotation.x = (s * Math.PI) / 5;
        wg.add(spoke);
      }
    } else if (config.wheelStyle === 'offroad') {
      const ring = new THREE.Mesh(
        trackG(new THREE.TorusGeometry(rimRadius * 0.88, 0.035, 8, 16)),
        trimMat
      );
      ring.rotation.y = Math.PI / 2;
      ring.position.x = wheelWidth * 0.5;
      wg.add(ring);
    } else {
      // Classic domed chrome hubcap
      const cap = new THREE.Mesh(
        trackG(new THREE.SphereGeometry(rimRadius * 0.72, 16, 12)),
        chromeMat
      );
      cap.scale.set(0.32, 1, 1);
      wg.add(cap);
    }
    return wg;
  };

  const frontLeftPivot = new THREE.Group();
  frontLeftPivot.position.set(-trackHalfX, wheelRadius, wheelbaseHalfZ);
  root.add(frontLeftPivot);
  const wFL = createWheelAssembly();
  frontLeftPivot.add(wFL);

  const frontRightPivot = new THREE.Group();
  frontRightPivot.position.set(trackHalfX, wheelRadius, wheelbaseHalfZ);
  root.add(frontRightPivot);
  const wFR = createWheelAssembly();
  frontRightPivot.add(wFR);

  const wRL = createWheelAssembly();
  wRL.position.set(-trackHalfX, wheelRadius, -wheelbaseHalfZ);
  root.add(wRL);

  const wRR = createWheelAssembly();
  wRR.position.set(trackHalfX, wheelRadius, -wheelbaseHalfZ);
  root.add(wRR);

  return {
    root,
    bodyGroup,
    frontLeftPivot,
    frontRightPivot,
    wheels: [wFL, wFR, wRL, wRR],
    nitroFlames,
    headlightBeams,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
