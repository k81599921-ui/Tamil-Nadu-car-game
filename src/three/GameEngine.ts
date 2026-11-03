import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { isaiAudio } from '../audio/isaiEngine';
import { CAR_MODELS, LANDMARKS, RACE_ORDER } from '../data/i18n';
import {
  CameraMode,
  CarCustomization,
  GameMode,
  GamePhase,
  LandmarkId,
  TelemetryData,
  TouchInputState,
} from '../types/game';
import { buildCarRig, CarRig } from './carBuilder';
import { buildTamilNaduWorld, BuiltWorld } from './landmarkBuilder';
import {
  findNearestRoad,
  getLandmarkSpawnPose,
  groundHeightAt,
  ROAD_HALF_WIDTH,
  WORLD_BOUNDS,
} from './worldData';

// Pre-allocated math objects outside render loop (Zero GC!)
const _camDesiredPos = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();
const _smoothedLook = new THREE.Vector3();
const _dummyObj = new THREE.Object3D();
const _pColor = new THREE.Color();

interface ParticleSlot {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  r: number;
  g: number;
  b: number;
}

export interface EngineCallbacks {
  onTelemetry: (data: TelemetryData) => void;
  onRaceFinish: (totalMs: number, splitsMs: number[]) => void;
  onKeyShortcut: (action: 'pause' | 'camera' | 'station' | 'mute' | 'hud') => void;
}

export class ThamizhagamGameEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private sunLight: THREE.DirectionalLight;
  private isSoftwareGl: boolean;
  private maxAnisotropy: number;

  private world: BuiltWorld;
  private carRig: CarRig;
  private customization: CarCustomization;

  // Garage Studio Showcase Platform (elevated scenic deck overlooking Marina)
  private garageDeck: THREE.Group;
  private garageOrbitYaw = 0.55;
  private isDraggingGarage = false;
  private lastPointerX = 0;

  // Pooled InstancedMesh Particle System
  private particleMesh: THREE.InstancedMesh;
  private particles: ParticleSlot[] = [];
  private particleCursor = 0;

  // Game State
  private phase: GamePhase = 'title';
  private mode: GameMode = 'freeroam';
  private cameraMode: CameraMode = 'chase';

  // Vehicle Kinematics State
  private carX = -30;
  private carY = 2.6;
  private carZ = 352;
  private carHeading = 0; // Radians, 0 = +Z, PI/2 = +X
  private speed = 0; // m/s
  private lateralSlip = 0;
  private steerAngle = 0;
  private wheelSpin = 0;
  private bodyPitch = 0;
  private bodyRoll = 0;
  private nitro = 100;
  private isDrifting = false;
  private isBoosting = false;
  private wasBoosting = false;

  // Juice: Hitstop & Shake
  private hitstopTimer = 0;
  private cameraShake = 0;
  private titleOrbitAngle = 0;

  // Landmarks & Race State
  private discovered = new Set<LandmarkId>();
  private activeBannerId: LandmarkId | null = null;
  private bannerTimer = 0;
  private lastAnnouncedId: LandmarkId | null = null;

  private raceSequence: LandmarkId[] = [
    'thanjavur',
    'madurai',
    'kanyakumari',
    'ooty',
    'chennai',
  ];
  private checkpointIdx = 0;
  private raceElapsedMs = 0;
  private countdownTimer = 0;
  private lastCountdownInt = 0;
  private splitTimesMs: number[] = [];

  // Input State
  private heldKeys = new Set<string>();
  private touchInput: TouchInputState = {
    throttle: false,
    brake: false,
    left: false,
    right: false,
    drift: false,
    nitro: false,
  };

  // Loop management
  private clock = new THREE.Clock();
  private frameId = 0;
  private disposed = false;
  private hudEmitAccum = 0;

  constructor(
    container: HTMLElement,
    initialConfig: CarCustomization,
    callbacks: EngineCallbacks
  ) {
    this.container = container;
    this.customization = initialConfig;
    this.callbacks = callbacks;

    // 1. Software-WebGL Guard per Three.js studio directive
    this.isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    container.appendChild(this.renderer.domElement);

    this.maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();

    // 2. Scene, Sky Atmosphere & Mandatory RoomEnvironment PBR Reflections
    this.scene = new THREE.Scene();
    const skyColor = new THREE.Color('#dbeafe').lerp(new THREE.Color('#fde68a'), 0.35);
    this.scene.background = skyColor;
    this.scene.fog = new THREE.FogExp2(skyColor.getHex(), 0.00165);

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    pmremGenerator.dispose();

    // 3. Camera
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(62, w / h, 0.25, 1100);

    // 4. Balanced Warm/Cool Studio & Outdoor Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x92400e, 0.72);
    hemiLight.position.set(0, 120, 0);
    this.scene.add(hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff3d1, 2.1);
    this.sunLight.position.set(80, 120, 60);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    const d = 55;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 260;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Build Tamil Nadu World & Landmarks
    this.world = buildTamilNaduWorld(this.maxAnisotropy);
    this.scene.add(this.world.worldGroup);

    // Build Elevated Scenic Garage Turntable Platform (y = 75)
    this.garageDeck = this.buildGarageShowcaseStudio();
    this.garageDeck.visible = false;
    this.scene.add(this.garageDeck);

    // Build Player Car Rig
    this.carRig = buildCarRig(
      this.customization,
      this.isSoftwareGl,
      this.maxAnisotropy
    );
    this.scene.add(this.carRig.root);
    isaiAudio.setCarModel(this.customization.modelId);

    // Build Pooled Particle System (80 instances)
    const pCount = 80;
    const pGeo = new THREE.SphereGeometry(0.28, 6, 6);
    const pMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    this.particleMesh = new THREE.InstancedMesh(pGeo, pMat, pCount);
    this.particleMesh.frustumCulled = false;
    for (let i = 0; i < pCount; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: -100,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1,
        size: 1,
        r: 1,
        g: 1,
        b: 1,
      });
      _dummyObj.position.set(0, -100, 0);
      _dummyObj.scale.setScalar(0.001);
      _dummyObj.updateMatrix();
      this.particleMesh.setMatrixAt(i, _dummyObj.matrix);
      this.particleMesh.setColorAt(i, _pColor.setRGB(1, 1, 1));
    }
    this.scene.add(this.particleMesh);

    // Stage car on Kanyakumari overlook for dramatic Title Screen panorama!
    this.stageTitleScene();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.clock.start();
    this.scheduleNextFrame();
  }

  private buildGarageShowcaseStudio(): THREE.Group {
    const g = new THREE.Group();
    g.position.set(140, 72, -280);

    // Polished Obsidian & Chola Gold Turntable Plinth
    const outerRing = new THREE.Mesh(
      new THREE.CylinderGeometry(5.6, 6.2, 0.5, 48),
      new THREE.MeshPhysicalMaterial({
        color: 0xfbbf24,
        metalness: 0.9,
        roughness: 0.18,
      })
    );
    outerRing.position.y = -0.26;
    g.add(outerRing);

    const platter = new THREE.Mesh(
      new THREE.CylinderGeometry(5.2, 5.2, 0.54, 48),
      new THREE.MeshPhysicalMaterial({
        color: 0x0f172a,
        metalness: 0.65,
        roughness: 0.16,
        clearcoat: 0.9,
      })
    );
    platter.position.y = -0.25;
    platter.receiveShadow = true;
    g.add(platter);

    // Ornate Pillared Heritage Arch Backdrop
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.5,
      roughness: 0.35,
    });
    [-4.2, 4.2].forEach((px) => {
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.35, 4.4, 16),
        pillarMat
      );
      col.position.set(px, 2.2, -4.2);
      g.add(col);
    });

    if (!this.isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const softbox1 = new THREE.RectAreaLight(0xfffbeb, 4.5, 6, 2.5);
      softbox1.position.set(0, 4.6, 2.5);
      softbox1.lookAt(0, 0.6, 0);
      g.add(softbox1);

      const softbox2 = new THREE.RectAreaLight(0x38bdf8, 2.8, 4, 2);
      softbox2.position.set(-4.5, 2.8, -2.5);
      softbox2.lookAt(0, 0.6, 0);
      g.add(softbox2);
    }

    return g;
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleWindowBlur);

    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    dom.addEventListener('webglcontextlost', this.handleContextLost);
  }

  private handleContextLost = (e: Event): void => {
    e.preventDefault();
  };

  private handleResize = (): void => {
    if (this.disposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private handleWindowBlur = (): void => {
    this.heldKeys.clear();
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    // Ignore typing inside custom number plate text input
    if (
      document.activeElement &&
      (document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA')
    ) {
      return;
    }

    const code = e.code;
    const wasHeld = this.heldKeys.has(code);
    this.heldKeys.add(code);
    isaiAudio.init();

    if (!wasHeld) {
      if (code === 'Escape') {
        this.callbacks.onKeyShortcut('pause');
      } else if (code === 'KeyC' && this.phase === 'playing') {
        this.cycleCameraMode();
        this.callbacks.onKeyShortcut('camera');
      } else if (code === 'KeyN') {
        this.callbacks.onKeyShortcut('station');
      } else if (code === 'KeyM') {
        this.callbacks.onKeyShortcut('mute');
      } else if (code === 'KeyH') {
        this.callbacks.onKeyShortcut('hud');
      } else if (code === 'KeyR' && this.phase === 'playing') {
        this.resetCarToNearestRoad();
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.heldKeys.delete(e.code);
  };

  private handlePointerDown = (e: PointerEvent): void => {
    isaiAudio.init();
    if (this.phase === 'garage') {
      this.isDraggingGarage = true;
      this.lastPointerX = e.clientX;
    }
  };

  private handlePointerMove = (e: PointerEvent): void => {
    if (this.isDraggingGarage && this.phase === 'garage') {
      const dx = e.clientX - this.lastPointerX;
      this.lastPointerX = e.clientX;
      this.garageOrbitYaw -= dx * 0.01;
    }
  };

  private handlePointerUp = (): void => {
    this.isDraggingGarage = false;
  };

  // Public Controls API for React Shell
  public setPhase(phase: GamePhase): void {
    this.phase = phase;
    if (phase === 'title') {
      this.garageDeck.visible = false;
      this.world.setActiveCheckpoint(null);
      this.stageTitleScene();
    } else if (phase === 'garage') {
      this.garageDeck.visible = true;
      this.world.setActiveCheckpoint(null);
      this.carRig.root.position.set(140, 72.02, -280);
      this.carRig.root.rotation.set(0, 0.4, 0);
      this.carRig.bodyGroup.rotation.set(0, 0, 0);
      this.carRig.nitroFlames.forEach((f) => (f.visible = false));
    } else if (phase === 'playing') {
      this.garageDeck.visible = false;
    }
  }

  public startSession(mode: GameMode, spawnLandmark: LandmarkId = 'chennai'): void {
    this.mode = mode;
    this.garageDeck.visible = false;
    this.speed = 0;
    this.lateralSlip = 0;
    this.steerAngle = 0;
    this.nitro = 100;
    this.activeBannerId = null;
    this.bannerTimer = 0;

    const startId = mode === 'race' ? 'chennai' : spawnLandmark;
    const pose = getLandmarkSpawnPose(startId);
    this.carX = pose.x;
    this.carY = pose.y;
    this.carZ = pose.z;
    this.carHeading = pose.heading;

    this.carRig.root.position.set(this.carX, this.carY, this.carZ);
    this.carRig.root.rotation.set(0, this.carHeading, 0);

    // Snap camera immediately behind car on session start
    const backX = this.carX - Math.sin(this.carHeading) * 8.5;
    const backZ = this.carZ - Math.cos(this.carHeading) * 8.5;
    this.camera.position.set(backX, this.carY + 3.6, backZ);
    _smoothedLook.set(this.carX, this.carY + 1.2, this.carZ);
    this.camera.lookAt(_smoothedLook);

    if (mode === 'race') {
      this.checkpointIdx = 0;
      this.raceElapsedMs = 0;
      this.splitTimesMs = [];
      this.countdownTimer = 3.2;
      this.lastCountdownInt = 4;
      this.world.setActiveCheckpoint(this.raceSequence[0]);
    } else {
      this.countdownTimer = 0;
      this.world.setActiveCheckpoint(null);
    }

    this.phase = 'playing';
  }

  public teleportToLandmark(landmarkId: LandmarkId): void {
    const pose = getLandmarkSpawnPose(landmarkId);
    this.carX = pose.x;
    this.carY = pose.y;
    this.carZ = pose.z;
    this.carHeading = pose.heading;
    this.speed = 0;
    this.lateralSlip = 0;
    this.lastAnnouncedId = null; // Allow banner to trigger cleanly
    this.phase = 'playing';
    this.garageDeck.visible = false;
  }

  public resetCarToNearestRoad(): void {
    const nr = findNearestRoad(this.carX, this.carZ);
    this.carX = nr.x;
    this.carY = nr.roadY + 0.06;
    this.carZ = nr.z;
    this.carHeading = Math.atan2(nr.tx, nr.tz);
    this.speed = 0;
    this.lateralSlip = 0;
  }

  public updateCustomization(newConfig: CarCustomization): void {
    this.customization = newConfig;
    const prevPos = this.carRig.root.position.clone();
    const prevRot = this.carRig.root.rotation.clone();
    this.scene.remove(this.carRig.root);
    this.carRig.dispose();

    this.carRig = buildCarRig(newConfig, this.isSoftwareGl, this.maxAnisotropy);
    this.carRig.root.position.copy(prevPos);
    this.carRig.root.rotation.copy(prevRot);
    this.scene.add(this.carRig.root);
    isaiAudio.setCarModel(newConfig.modelId);
  }

  public cycleCameraMode(): CameraMode {
    const modes: CameraMode[] = ['chase', 'hood', 'cinematic'];
    this.cameraMode = modes[(modes.indexOf(this.cameraMode) + 1) % modes.length];
    return this.cameraMode;
  }

  public setTouchInput(partial: Partial<TouchInputState>): void {
    Object.assign(this.touchInput, partial);
  }

  private stageTitleScene(): void {
    const pose = getLandmarkSpawnPose('kanyakumari');
    this.carX = pose.x;
    this.carY = pose.y;
    this.carZ = pose.z;
    this.carHeading = pose.heading;
    this.carRig.root.position.set(this.carX, this.carY, this.carZ);
    this.carRig.root.rotation.set(0, this.carHeading, 0);
    this.carRig.nitroFlames.forEach((f) => (f.visible = false));
  }

  private spawnParticle(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    size: number,
    life: number,
    hexColor: number
  ): void {
    const slot = this.particles[this.particleCursor];
    this.particleCursor = (this.particleCursor + 1) % this.particles.length;
    _pColor.setHex(hexColor);
    slot.active = true;
    slot.x = x;
    slot.y = y;
    slot.z = z;
    slot.vx = vx;
    slot.vy = vy;
    slot.vz = vz;
    slot.size = size;
    slot.life = life;
    slot.maxLife = life;
    slot.r = _pColor.r;
    slot.g = _pColor.g;
    slot.b = _pColor.b;
  }

  // Software-WebGL Safe Frame Scheduler
  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || !gl.fenceSync) {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private scheduleNextFrame(): void {
    if (this.disposed) return;
    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  }

  private tick = (): void => {
    if (this.disposed) return;
    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05);
    const elapsed = this.clock.elapsedTime;

    // Animate Marina Lighthouse beacon & ocean shimmer
    this.world.lighthouseBeacon.rotation.y = elapsed * 0.9;
    this.world.oceanMesh.position.y = Math.sin(elapsed * 1.4) * 0.09;

    if (this.phase === 'title') {
      this.updateTitleCamera(dt);
      isaiAudio.updateVehicleAudio(0, false, false, false, false);
    } else if (this.phase === 'garage') {
      this.updateGarageCamera(dt);
      isaiAudio.updateVehicleAudio(0, false, false, false, false);
    } else if (this.phase === 'playing') {
      this.updateDrivingSimulation(dt);
      this.updateDrivingCamera(dt);
    } else {
      // Paused or Victory
      isaiAudio.updateVehicleAudio(0, false, false, false, false);
    }

    this.updateParticles(dt);

    // Keep Directional Sun shadow frustum centered on active car
    const activeTarget = this.carRig.root.position;
    this.sunLight.position.set(
      activeTarget.x + 65,
      activeTarget.y + 95,
      activeTarget.z + 55
    );
    this.sunLight.target.position.copy(activeTarget);

    this.renderer.render(this.scene, this.camera);
    this.scheduleNextFrame();
  };

  private updateTitleCamera(dt: number): void {
    this.titleOrbitAngle += dt * 0.16;
    // Dramatic panoramic orbit framing both the hero car on Kanyakumari overlook AND the 133-ft Thiruvalluvar Statue!
    const camX = -30 + Math.sin(this.titleOrbitAngle) * 32;
    const camZ = 334 + Math.cos(this.titleOrbitAngle * 0.7) * 14;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, 56, 4, dt);
    this.camera.updateProjectionMatrix();
    this.camera.position.set(camX, 14.5, camZ);
    this.camera.lookAt(-26, 14.0, 384);
  }

  private updateGarageCamera(dt: number): void {
    if (!this.isDraggingGarage) {
      this.garageOrbitYaw += dt * 0.38;
    }
    this.carRig.root.rotation.y = this.garageOrbitYaw;
    this.carRig.wheels.forEach((w) => {
      w.rotation.x += dt * 1.2;
    });

    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, 46, 5, dt);
    this.camera.updateProjectionMatrix();

    // Position car slightly in the upper-center of viewport so bottom dock never occludes it!
    _camDesiredPos.set(140, 74.35, -271.8);
    this.camera.position.lerp(_camDesiredPos, 1 - Math.exp(-6 * dt));
    this.camera.lookAt(140, 72.55, -280);
  }

  private updateDrivingSimulation(dt: number): void {
    // Hitstop brief freeze on heavy boundary impact
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    // Race Countdown handling
    if (this.mode === 'race' && this.countdownTimer > 0) {
      this.countdownTimer = Math.max(0, this.countdownTimer - dt);
      const ceilInt = Math.ceil(this.countdownTimer);
      if (ceilInt !== this.lastCountdownInt && ceilInt <= 3) {
        this.lastCountdownInt = ceilInt;
        isaiAudio.playCountdownBeep(ceilInt === 0);
      }
      isaiAudio.updateVehicleAudio(18, true, false, false, true);
      this.emitTelemetry(dt, true);
      return;
    }

    if (this.mode === 'race') {
      this.raceElapsedMs += dt * 1000;
    }

    const spec = CAR_MODELS[this.customization.modelId];
    const tune = this.customization.tuning;
    const maxSpeedMs =
      ((spec.baseSpeedKmh + (tune.topSpeed - 3) * 14) / 3.6);
    const accelRate = spec.baseAccel * (0.88 + tune.topSpeed * 0.05);
    const gripFactor = spec.baseGrip + (tune.handling - 3) * 0.025;

    const throttle =
      this.heldKeys.has('KeyW') ||
      this.heldKeys.has('ArrowUp') ||
      this.touchInput.throttle;
    const brake =
      this.heldKeys.has('KeyS') ||
      this.heldKeys.has('ArrowDown') ||
      this.touchInput.brake;
    const left =
      this.heldKeys.has('KeyA') ||
      this.heldKeys.has('ArrowLeft') ||
      this.touchInput.left;
    const right =
      this.heldKeys.has('KeyD') ||
      this.heldKeys.has('ArrowRight') ||
      this.touchInput.right;
    const driftHeld = this.heldKeys.has('Space') || this.touchInput.drift;
    const nitroHeld =
      this.heldKeys.has('ShiftLeft') ||
      this.heldKeys.has('ShiftRight') ||
      this.touchInput.nitro;

    // Nitro Boost Management
    this.isBoosting = nitroHeld && this.nitro > 4 && throttle && this.speed > 5;
    if (this.isBoosting) {
      if (!this.wasBoosting) {
        isaiAudio.playNitroWhoosh();
      }
      this.nitro = Math.max(0, this.nitro - dt * (28 - tune.nitroPower * 2.2));
    } else {
      const recharge = this.isDrifting ? 18 : 7.5;
      this.nitro = Math.min(100, this.nitro + dt * recharge);
    }
    this.wasBoosting = this.isBoosting;

    // Check surface: Highway vs Off-road
    const nr = findNearestRoad(this.carX, this.carZ);
    const onHighway = nr.dist <= ROAD_HALF_WIDTH + 1.4;
    const surfaceMult = onHighway ? 1.0 : spec.offroadBonus;

    const effectiveMaxSpeed =
      maxSpeedMs * surfaceMult * (this.isBoosting ? 1.28 + tune.nitroPower * 0.03 : 1.0);

    if (throttle) {
      const boostAccel = this.isBoosting ? 1.65 : 1.0;
      this.speed += accelRate * boostAccel * dt;
    } else if (brake) {
      if (this.speed > 1.5) {
        this.speed -= accelRate * 1.55 * dt;
      } else {
        this.speed -= accelRate * 0.7 * dt;
      }
    } else {
      // Natural aerodynamic & rolling resistance
      this.speed = THREE.MathUtils.damp(this.speed, 0, onHighway ? 0.85 : 2.1, dt);
    }

    this.speed = THREE.MathUtils.clamp(
      this.speed,
      -effectiveMaxSpeed * 0.35,
      effectiveMaxSpeed
    );

    // Steering & Handbrake Drift Physics
    const steerInput = (left ? 1 : 0) - (right ? 1 : 0);
    const targetSteer = steerInput * 0.52;
    this.steerAngle = THREE.MathUtils.damp(this.steerAngle, targetSteer, 11, dt);

    this.isDrifting = driftHeld && Math.abs(this.speed) > 10 && Math.abs(steerInput) > 0;
    const turnRate =
      (1.85 + (tune.handling - 3) * 0.14) *
      (this.isDrifting ? 1.38 : 1.0) *
      THREE.MathUtils.clamp(Math.abs(this.speed) / 10, 0, 1) *
      Math.sign(this.speed || 1);

    this.carHeading += this.steerAngle * turnRate * dt;

    // Lateral drift slip velocity
    const targetSlip = this.isDrifting ? -steerInput * Math.abs(this.speed) * 0.34 : 0;
    this.lateralSlip = THREE.MathUtils.damp(
      this.lateralSlip,
      targetSlip,
      this.isDrifting ? 4 : 9 * gripFactor,
      dt
    );

    const sinH = Math.sin(this.carHeading);
    const cosH = Math.cos(this.carHeading);
    // Right vector for heading in (+X, +Z): (cosH, -sinH) or (-cosH, sinH)
    const nextX = this.carX + sinH * this.speed * dt + cosH * this.lateralSlip * dt;
    const nextZ = this.carZ + cosH * this.speed * dt - sinH * this.lateralSlip * dt;
    const nextGroundY = groundHeightAt(nextX, nextZ);

    // Natural Coastline / Deep Water & World Perimeter Safety Guardrail!
    if (
      nextGroundY < 0.35 ||
      nextX < WORLD_BOUNDS.minX + 12 ||
      nextX > WORLD_BOUNDS.maxX - 12 ||
      nextZ < WORLD_BOUNDS.minZ + 12 ||
      nextZ > WORLD_BOUNDS.maxZ - 12
    ) {
      // Rebound cleanly toward nearest highway / safe ground with impact juice!
      const impactIntensity = Math.min(1, Math.abs(this.speed) / 35);
      if (impactIntensity > 0.25) {
        this.hitstopTimer = 0.042;
        this.cameraShake = 0.55 * impactIntensity;
        isaiAudio.playImpact(impactIntensity);
        for (let k = 0; k < 8; k++) {
          this.spawnParticle(
            this.carX,
            this.carY + 0.6,
            this.carZ,
            (Math.random() - 0.5) * 10,
            2 + Math.random() * 5,
            (Math.random() - 0.5) * 10,
            1.1,
            0.45,
            0xfbbf24
          );
        }
      }
      this.speed *= -0.35;
      // Nudge gently toward nearest road
      this.carX = THREE.MathUtils.lerp(this.carX, nr.x, 0.14);
      this.carZ = THREE.MathUtils.lerp(this.carZ, nr.z, 0.14);
    } else {
      this.carX = nextX;
      this.carZ = nextZ;
    }

    const groundY = groundHeightAt(this.carX, this.carZ);
    const roadSurfaceOffset = onHighway ? 0.08 : 0.02;
    this.carY = THREE.MathUtils.damp(this.carY, groundY + roadSurfaceOffset, 18, dt);

    // Sample terrain slope ahead for realistic mountain pitch on Ooty ghat road!
    const aheadY = groundHeightAt(this.carX + sinH * 2.6, this.carZ + cosH * 2.6);
    const slopePitch = -Math.atan2(aheadY - groundY, 2.6);
    const accelSquat = throttle ? -0.025 : brake ? 0.03 : 0;
    this.bodyPitch = THREE.MathUtils.damp(
      this.bodyPitch,
      slopePitch + accelSquat,
      10,
      dt
    );
    this.bodyRoll = THREE.MathUtils.damp(
      this.bodyRoll,
      -this.steerAngle * (Math.abs(this.speed) / 45) * 0.22,
      10,
      dt
    );

    // Apply transforms to 3D Car Rig
    this.carRig.root.position.set(this.carX, this.carY, this.carZ);
    this.carRig.root.rotation.set(0, this.carHeading + (this.isDrifting ? this.steerAngle * 0.35 : 0), 0);
    this.carRig.bodyGroup.rotation.set(this.bodyPitch, 0, this.bodyRoll);

    // Spin wheels & steer front pivots
    this.wheelSpin += (this.speed / 0.4) * dt;
    this.carRig.frontLeftPivot.rotation.y = this.steerAngle * 0.85;
    this.carRig.frontRightPivot.rotation.y = this.steerAngle * 0.85;
    this.carRig.wheels.forEach((w) => {
      w.rotation.x = this.wheelSpin;
    });

    // Nitro exhaust flames + Particle trails
    this.carRig.nitroFlames.forEach((f) => {
      f.visible = this.isBoosting;
      if (this.isBoosting) {
        f.scale.set(1, 0.85 + Math.random() * 0.45, 1);
      }
    });

    if (this.isDrifting || (!onHighway && Math.abs(this.speed) > 12)) {
      this.spawnParticle(
        this.carX - sinH * 1.8 + (Math.random() - 0.5) * 1.4,
        this.carY + 0.25,
        this.carZ - cosH * 1.8 + (Math.random() - 0.5) * 1.4,
        (Math.random() - 0.5) * 2,
        0.9 + Math.random() * 1.2,
        (Math.random() - 0.5) * 2,
        this.isDrifting ? 1.5 : 1.15,
        0.55,
        onHighway ? 0xe2e8f0 : 0xd99b52
      );
    }

    if (this.isBoosting) {
      this.spawnParticle(
        this.carX - sinH * 2.3,
        this.carY + 0.35,
        this.carZ - cosH * 2.3,
        -sinH * 4 + (Math.random() - 0.5) * 1.5,
        0.5 + Math.random(),
        -cosH * 4 + (Math.random() - 0.5) * 1.5,
        0.95,
        0.28,
        0x38bdf8
      );
    }

    // Update Engine & Drift Audio
    const speedKmh = Math.abs(this.speed) * 3.6;
    isaiAudio.updateVehicleAudio(
      speedKmh,
      throttle,
      this.isDrifting,
      this.isBoosting,
      true
    );

    // Check Landmarks & Race Checkpoints
    this.evaluateLandmarksAndCheckpoints(dt);
    this.emitTelemetry(dt, false);
  }

  private evaluateLandmarksAndCheckpoints(dt: number): void {
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) {
        this.activeBannerId = null;
      }
    }

    // Find closest landmark
    let closestId: LandmarkId = 'chennai';
    let closestDist = Infinity;

    for (const id of RACE_ORDER) {
      const lm = LANDMARKS[id];
      const d = Math.hypot(this.carX - lm.worldX, this.carZ - lm.worldZ);
      if (d < closestDist) {
        closestDist = d;
        closestId = id;
      }
    }

    const activeLm = LANDMARKS[closestId];
    if (closestDist <= activeLm.radius) {
      if (this.lastAnnouncedId !== closestId) {
        this.lastAnnouncedId = closestId;
        this.discovered.add(closestId);
        this.activeBannerId = closestId;
        this.bannerTimer = 5.5;

        if (activeLm.ambientType === 'temple') {
          isaiAudio.playTempleBell();
        } else if (activeLm.ambientType === 'coastal') {
          isaiAudio.playCoastalWave();
        } else {
          isaiAudio.playCheckpoint();
        }
      }
    } else if (closestDist > activeLm.radius + 25 && this.lastAnnouncedId === closestId) {
      this.lastAnnouncedId = null;
    }

    // Race Mode Checkpoint Detection
    if (this.mode === 'race' && this.checkpointIdx < this.raceSequence.length) {
      const targetId = this.raceSequence[this.checkpointIdx];
      const targetPose = getLandmarkSpawnPose(targetId);
      const distToGate = Math.hypot(this.carX - targetPose.x, this.carZ - targetPose.z);

      if (distToGate < 18.5) {
        this.splitTimesMs.push(this.raceElapsedMs);
        isaiAudio.playCheckpoint();
        this.checkpointIdx++;

        if (this.checkpointIdx >= this.raceSequence.length) {
          // Race Victory!
          this.world.setActiveCheckpoint(null);
          this.phase = 'victory';
          this.callbacks.onRaceFinish(this.raceElapsedMs, [...this.splitTimesMs]);
        } else {
          this.world.setActiveCheckpoint(this.raceSequence[this.checkpointIdx]);
        }
      }
    }
  }

  private updateDrivingCamera(dt: number): void {
    const sinH = Math.sin(this.carHeading);
    const cosH = Math.cos(this.carHeading);

    const speedRatio = THREE.MathUtils.clamp(Math.abs(this.speed) / 55, 0, 1);
    const targetFov =
      this.cameraMode === 'hood'
        ? 68 + (this.isBoosting ? 10 : 0)
        : 60 + speedRatio * 7 + (this.isBoosting ? 9 : 0);
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 6, dt);
    this.camera.updateProjectionMatrix();

    if (this.cameraMode === 'hood') {
      _camDesiredPos.set(
        this.carX + sinH * 0.45,
        this.carY + 1.52,
        this.carZ + cosH * 0.45
      );
      _camLookTarget.set(
        this.carX + sinH * 24,
        this.carY + 1.35 - this.bodyPitch * 12,
        this.carZ + cosH * 24
      );
      this.camera.position.copy(_camDesiredPos);
      this.camera.lookAt(_camLookTarget);
      return;
    }

    if (this.cameraMode === 'cinematic') {
      _camDesiredPos.set(
        this.carX - sinH * 11.5 + cosH * 4.5,
        this.carY + 4.8,
        this.carZ - cosH * 11.5 - sinH * 4.5
      );
      _camLookTarget.set(
        this.carX + sinH * 5,
        this.carY + 1.4,
        this.carZ + cosH * 5
      );
    } else {
      // Standard responsive Chase Camera
      const distBack = 7.8 + speedRatio * 1.4;
      _camDesiredPos.set(
        this.carX - sinH * distBack,
        this.carY + 3.35,
        this.carZ - cosH * distBack
      );
      _camLookTarget.set(
        this.carX + sinH * 4.5,
        this.carY + 1.25,
        this.carZ + cosH * 4.5
      );
    }

    // Prevent camera from dipping below ground on steep Nilgiri cliffs
    const camGround = groundHeightAt(_camDesiredPos.x, _camDesiredPos.z);
    if (_camDesiredPos.y < camGround + 1.4) {
      _camDesiredPos.y = camGround + 1.4;
    }

    const alpha = 1 - Math.exp(-8.5 * dt);
    this.camera.position.lerp(_camDesiredPos, alpha);
    _smoothedLook.lerp(_camLookTarget, 1 - Math.exp(-12 * dt));

    // Decaying impact camera shake
    if (this.cameraShake > 0.005) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake = THREE.MathUtils.damp(this.cameraShake, 0, 8, dt);
    }

    this.camera.lookAt(_smoothedLook);
  }

  private updateParticles(dt: number): void {
    let anyUpdated = false;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      anyUpdated = true;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        _dummyObj.position.set(0, -100, 0);
        _dummyObj.scale.setScalar(0.001);
        _dummyObj.updateMatrix();
        this.particleMesh.setMatrixAt(i, _dummyObj.matrix);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      const frac = p.life / p.maxLife;
      const sc = p.size * (0.4 + (1 - frac) * 1.1) * frac;
      _dummyObj.position.set(p.x, p.y, p.z);
      _dummyObj.scale.setScalar(Math.max(0.01, sc));
      _dummyObj.updateMatrix();
      this.particleMesh.setMatrixAt(i, _dummyObj.matrix);
      _pColor.setRGB(p.r, p.g, p.b);
      this.particleMesh.setColorAt(i, _pColor);
    }
    if (anyUpdated) {
      this.particleMesh.instanceMatrix.needsUpdate = true;
      if (this.particleMesh.instanceColor) {
        this.particleMesh.instanceColor.needsUpdate = true;
      }
    }
  }

  private emitTelemetry(dt: number, force: boolean): void {
    this.hudEmitAccum += dt;
    if (!force && this.hudEmitAccum < 0.05) return; // 20Hz smooth HUD telemetry updates
    this.hudEmitAccum = 0;

    const absKmh = Math.round(Math.abs(this.speed) * 3.6);
    const gear =
      this.speed < -1
        ? 'R'
        : absKmh < 2
          ? 'N'
          : String(Math.min(6, Math.floor(absKmh / 36) + 1));

    let nearestId: LandmarkId = 'chennai';
    let nearestDist = Infinity;
    for (const id of RACE_ORDER) {
      const lm = LANDMARKS[id];
      const d = Math.hypot(this.carX - lm.worldX, this.carZ - lm.worldZ);
      if (d < nearestDist) {
        nearestDist = d;
        nearestId = id;
      }
    }

    const cpTargetId =
      this.mode === 'race' && this.checkpointIdx < this.raceSequence.length
        ? this.raceSequence[this.checkpointIdx]
        : nearestId;
    const cpPose = getLandmarkSpawnPose(cpTargetId);

    this.callbacks.onTelemetry({
      speedKmh: absKmh,
      gear,
      rpmRatio: Math.min(1, ((absKmh % 38) / 38) * 0.7 + (absKmh / 220) * 0.35),
      nitro: Math.round(this.nitro),
      isDrifting: this.isDrifting,
      isBoosting: this.isBoosting,
      playerX: this.carX,
      playerZ: this.carZ,
      playerHeading: this.carHeading,
      altitudeM: Math.max(0, Math.round(this.carY * 22)),
      nearestLandmarkId: nearestId,
      nearestLandmarkDistM: Math.round(nearestDist * 12),
      activeBannerLandmarkId: this.activeBannerId,
      discoveredLandmarks: Array.from(this.discovered),
      raceElapsedMs: this.raceElapsedMs,
      raceCountdown: Math.ceil(this.countdownTimer),
      checkpointIndex: this.checkpointIdx,
      totalCheckpoints: this.raceSequence.length,
      checkpointTargetX: cpPose.x,
      checkpointTargetZ: cpPose.z,
      splitTimesMs: this.splitTimesMs,
    });
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);

    this.world.dispose();
    this.carRig.dispose();
    this.particleMesh.geometry.dispose();
    (this.particleMesh.material as THREE.Material).dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
