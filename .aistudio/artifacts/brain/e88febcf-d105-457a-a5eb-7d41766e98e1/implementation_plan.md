# Thamizhagam Drive 3D — தமிழ்நாடு 3D கார் பயணம் & பந்தயம்

An interactive 3D open-highway driving and checkpoint racing game set across an interconnected miniature map of Tamil Nadu, featuring iconic cultural landmarks, three customizable multi-part 3D vehicles, instant Tamil/English (`தமிழ் / English`) language switching, and a rich multi-station procedural music & sound engine.

## User Review & Critical Decisions

> [!IMPORTANT]
> உங்கள் விருப்பங்களின் அடிப்படையில் கீழ்க்கண்ட முக்கிய அம்சங்கள் திட்டத்தில் உறுதி செய்யப்பட்டுள்ளன (Confirmed choices from your answers):

- **Confirmed Game Modes (விளையாட்டு முறைகள்)**: Both **Free Roam Heritage Tour (சுற்றுலா ஓட்டம்)** with landmark discovery cards and **Tamil Nadu Grand Tour Time Trial (நேர சவால் பந்தயம்)** with highway checkpoints, split timers, and medal rankings.
- **Confirmed 3D Tamil Nadu Map & Landmarks (முக்கிய இடங்கள்)**: Connected regional highway loop spanning **Chennai** (Marina Coast & Napier Bridge), **Thanjavur** (Brihadeeswarar Peruvudaiyar Kovil), **Madurai** (Meenakshi Amman Gopurams), **Ooty** (Nilgiri Mountain Hairpin Bends & Tea Estates), and **Kanyakumari** (133-ft Thiruvalluvar Statue & Vivekananda Rock over the Southern Ocean).
- **Confirmed Vehicles & Customization (கார்கள் & கஸ்டமைசேஷன்)**: Three distinct multi-part 3D vehicles — **Kaveri GT (Sports Coupe)**, **Nilgiri 4x4 (Off-Road Thar Jeep)**, and **Madras Classic (Vintage Ambassador)** — with full paint finish, wheel rim, spoiler/roof accessory, TN district registration plate, and performance tuning customization.
- **Confirmed Music & Radio System (இசை & வானொலி)**: Multi-station real-time Web Audio synthesizer radio featuring **Isai Marabu FM** (Nadaswaram, Thavil & Tanpura Carnatic melodies), **Chennai Turbo FM** (Kuthu-inspired electronic racing beats), and **Nilgiri Flute FM** (hill-station Bansuri melodies), alongside dynamic engine RPM and environmental temple/ocean soundscapes.

---

## 1. Overview & Core Concept

- **What It Does (கேமின் சிறப்பம்சம்)**: Players select and customize their own car in a 3D showroom garage, switch seamlessly between **தமிழ்** and **English** at any moment, tune into Tamil cultural or modern racing music stations, and drive across a stylized 3D geographical map of Tamil Nadu from northern coastal Chennai through temple towns and misty Nilgiri hills down to the Thiruvalluvar Statue at Kanyakumari.
- **Target Audience**: Players looking for an authentic, culturally rooted 3D driving experience celebrating Tamil Nadu's architecture, landscapes, vehicles, and musical heritage.
- **Key Value**: Combines responsive 60fps arcade car physics (drifting, nitro boost, elevation climbs on Ooty ghat roads) with unmistakable multi-part 3D Tamil Nadu monuments and expressive procedural music—entirely self-contained with zero external broken assets.

---

## 2. User Experience & Visual Design

### Key User Flows (பயனர் அனுபவம்)

1. **Atmospheric 3D Title Screen (முகப்புத் திரை)**:
   - Opens directly into a live, sweeping 3D camera orbit over the Kanyakumari ocean sunrise and Thiruvalluvar Statue with gentle Nadaswaram/ambient intro music.
   - Features a bespoke inline SVG title lockup (`தமிழகம் டிரைவ் 3D / THAMIZHAGAM DRIVE 3D`), instant `தமிழ் | English` toggle in the top perimeter, mode selection (**Free Roam Tour** or **Grand Tamil Nadu Race**), a **3D Garage / Customize** button, and a primary `Enter / Space` Start CTA.
2. **Interactive 3D Garage & Car Customization (கார் கஸ்டமைசேஷன் கூடம்)**:
   - Live rotating 3D turntable showcasing the selected vehicle under warm studio lighting.
   - Sleek bottom customization dock allowing players to configure:
     - **Model**: *Kaveri GT* (Sports), *Nilgiri 4x4* (Jeep), *Madras Classic* (Ambassador).
     - **Paint & Finish**: Chola Gold, Madurai Crimson, Marina Cyan, Nilgiri Emerald, Pearl White, Obsidian Matte (with adjustable metallic/clearcoat sheen).
     - **Wheels & Trim**: Sport Multi-Spoke, Off-Road Beadlock, Classic Chrome Hubcaps + Spoiler / Roof Carrier / Festive Garland Bumper toggle.
     - **TN Number Plate**: District code selector (`TN 01 Chennai`, `TN 45 Trichy`, `TN 49 Thanjavur`, `TN 58 Madurai`, `TN 43 Ooty`, `TN 74 Kanyakumari`).
     - **Performance Tuning**: Top Speed, Hill Grip, and Nitro Boost balance.
3. **Active 3D Driving & Exploration (விளையாட்டுத் திரை)**:
   - **Free Roam Mode**: Drive freely across coastal roads, temple avenues, and mountain hairpins. Approaching any major landmark triggers a non-intrusive bilingual discovery banner with historical highlights and chimes a temple bell or coastal wave cue. Fast-travel signposts let players jump to any of the 5 regions if desired.
   - **Checkpoint Race Mode**: A timed North-to-South Tamil Nadu Highway Rally from Chennai Marina -> Thanjavur -> Madurai -> Ooty Ghat -> Kanyakumari Finish Arch, complete with split times, drift/nitro bonus meter, and best-time persistence.
4. **Pause, Landmark Map & Race Summary Modal**:
   - Pressing `Esc` opens a clean modal to switch language (`தமிழ் / English`), change radio station/volume, teleport to a landmark (in Free Roam), or return to the Garage.

### Visual Identity & Theme

- **Aesthetic Direction**: **Golden-Hour Dravidian Horizon & Motorsport Telemetry** — rich sunlit temple sandstone, lush emerald paddy/tea hills, deep Indian Ocean blues, and crisp obsidian telemetry HUD panels that keep over 85% of the 3D viewport completely unobstructed.
- **Color Palette & Mood**:
  - *3D World Palette*: Warm Golden Sunlight (`#FBBF24`), Temple Sandstone Ochre (`#D97706`), Gopuram Terracotta & Vivid Stucco Accents, Nilgiri Tea Leaf Green (`#15803D`), and Kanyakumari Deep Sea (`#0369A1`).
  - *HUD Surface Tokens*: Deep Obsidian Translucent Surfaces (`rgba(10, 15, 28, 0.86)` — solid alpha without `backdrop-filter` to guarantee peak WebGL frame pacing), Crisp Ivory Text (`#F8FAFC`), Temple Gold Primary Accent (`#F59E0B`), and Nitro Cyan (`#06B6D4`).
- **Typography & Hierarchy**:
  - *Display / Headings*: `Outfit` paired with clean Tamil geometric rendering (`Noto Sans Tamil` fallback stack) for crisp bilingual titles.
  - *Body & Bilingual Labels*: `Plus Jakarta Sans` + `Noto Sans Tamil` at comfortable legibility contrast.
  - *Speedometer, Timers & Distances*: Monospace/tabular numerals (`JetBrains Mono`, `tabular-nums`) so speed (`KM/H`), race clock, and landmark distances never jitter horizontally.
- **Low-Occlusion Perimeter HUD Layout**:
  - **Top-Left**: Compact Tamil Nadu 2D SVG Mini-Map showing the state silhouette, road network, 5 landmark icons, and live player directional arrow.
  - **Top-Right**: Single-line Radio Station switcher (`♪ Isai Marabu FM`), Mute toggle (`M`), Camera view toggle (`C` — Chase / Hood / Cinematic), and `தமிழ் | EN` switch.
  - **Bottom Dock (Collapsible via `H`)**: Digital/arc Speedometer (`KM/H`), Gear & Nitro bar, active Landmark compass distance readout, and touch-friendly steering/pedal controls on touch devices.

### Interactive Feedback & Motion

- **Vehicle Feel**: Frame-rate independent exponential camera damping, subtle FOV widening during Nitro boost, body roll on sharp Ooty hairpin turns, tire skid trails, dust/spark particle bursts, brief impact hitstop + decaying camera shake on guardrail collisions, and glowing golden checkpoint arches.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Stylized Interconnected 3D Tamil Nadu Peninsula Map vs. Flat Endless Track**
  - *Chosen Approach*: Build a true shaped 3D Tamil Nadu terrain peninsula bounded naturally by the Bay of Bengal on the east, Indian Ocean at the southern tip, and Western Ghats mountains on the west, connected by a continuous scenic highway loop with elevation changes (rising steeply in Ooty and descending to sea level at Kanyakumari).
  - *Why*: Directly fulfills the request for a real Tamil Nadu map feel where players physically drive between Chennai, temples, hill roads, and the Thiruvalluvar Statue in 3D space without invisible indoor walls.
- **Decision 2: Procedural Multi-Part 3D Architecture & Vehicles vs. External Model Files**
  - *Chosen Approach*: Construct all 3 cars and all 5 major Tamil Nadu landmarks (stepped Thanjavur Vimana tower with Nandi mandapam, colorful tiered Madurai Gopurams, 133-ft Thiruvalluvar Statue on its 38-ft pedestal island, Chennai Napier Bridge arches & Lighthouse, and Ooty terraced tea hills) using composite 6–12 part `THREE.Group` procedural geometries and canvas-generated PBR textures.
  - *Why*: Guarantees instant loading, zero 404 errors, crisp studio PBR reflections, and real-time part-by-part car customization (swapping spoilers, roof racks, wheel rims, and live license plate canvas textures).
- **Decision 3: Real-Time Procedural Multi-Station Tamil & Racing Synthesizer vs. Static Loops**
  - *Chosen Approach*: Build a dedicated Web Audio polyphonic music sequencer & sound engine synthesizing Carnatic raga scales (with characteristic Nadaswaram harmonic reed timbre, Thavil rhythmic cadence, and drone), Kuthu-synthwave bass/drums, and Bansuri flute melodies alongside speed-reactive engine audio.
  - *Why*: Gives music first-class prominence ("இசைக்கு முக்கியத்துவம்"), responds dynamically to speed/landmarks, works offline with zero audio file failures, and provides a genuine interactive in-car radio experience.
- **Decision 4: Persistence & Standalone Portability**
  - *Chosen Approach*: Persist customized cars, preferred language (`ta` / `en`), and best race times in `localStorage`, and include a one-click bilingual control guide and clean state reset.
  - *Why*: Players immediately retain their custom car build and language choice across sessions without login friction.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌───────────────────────────────────────────────────────────────────────────┐
│                   Bilingual Game Shell (தமிழ் / English)                   │
│         [Title Screen]  <──>  [3D Garage]  <──>  [Active Driving]         │
└───────────────┬───────────────────────────────────────────┬───────────────┘
                │                                           │
                ▼                                           ▼
┌───────────────────────────────────┐     ┌─────────────────────────────────┐
│   Isolated Three.js WebGL Engine  │     │    Low-Occlusion DOM Overlays   │
│ ───────────────────────────────── │     │ ─────────────────────────────── │
│ • Tamil Nadu Peninsula Terrain    │     │ • Bilingual i18n Context (TA/EN)│
│   & Elevation Spline Road Network │     │ • TN Silhouette SVG Mini-Map    │
│ • 5 Composite 3D Landmark Groups: │     │ • Radio Station & Audio Bar     │
│   - Chennai Marina & Napier Bridge│     │ • Speedometer, Nitro & Timer HUD│
│   - Thanjavur Big Temple Vimana   │     │ • Landmark Discovery Banner     │
│   - Madurai Meenakshi Gopurams    │     │ • Collapsible Garage Customizer │
│   - Ooty Nilgiri Hairpin Hills    │     │ • Touch D-Pad / Pedals (Mobile) │
│   - Kanyakumari Thiruvalluvar     │     └────────────────┬────────────────┘
│ • 3 Customizable 3D Car Rigs      │                      │
│ • Arcade Vehicle Physics & Drift  │◄─────────────────────┘
│ • Pooled Particles & Chase Camera │        Mutable Refs & Command Bus
└───────────────┬───────────────────┘        (Zero React Loop Re-renders)
                │
                ▼
┌───────────────────────────────────────────────────────────────────────────┐
│              Procedural Web Audio Music & SFX Engine (Isai FM)            │
│ ───────────────────────────────────────────────────────────────────────── │
│ • Station 1: Isai Marabu FM (Carnatic Raga Nadaswaram + Thavil + Drone)   │
│ • Station 2: Chennai Turbo FM (High-Tempo Kuthu Electronic Racing Synth)  │
│ • Station 3: Nilgiri Breeze FM (Melodic Hill Flute + Plucked Accompaniment│
│ • SFX Bus: Engine RPM Oscillator, Drift Tire Screech, Nitro, Temple Bell  │
└───────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State

- **Language & Localization Store (`Language`: `'ta' | 'en'`)**: Complete bilingual dictionary covering every title, button, car spec, customization option, radio station name, control hint, and historical landmark description in natural Tamil and English.
- **Vehicle Configuration (`CarCustomization`)**:
  - `modelId`: `'kaveri_gt' | 'nilgiri_4x4' | 'madras_classic'`
  - `bodyColor`, `finishType` (`'metallic' | 'matte' | 'pearl'`), `wheelStyle` (`'sport' | 'offroad' | 'classic'`), `wheelColor`, `accessory` (`'none' | 'spoiler' | 'roofrack' | 'garland'`), `underglowColor`, `plateDistrict` (`'TN 01' | 'TN 43' | 'TN 45' | 'TN 49' | 'TN 58' | 'TN 74'`), and `tuning` (`speed`, `handling`, `nitro`).
- **World & Race Telemetry**:
  - Continuous vehicle physics state (`position`, `heading`, `velocity`, `steeringAngle`, `wheelSpin`, `driftFactor`, `nitroCharge`, `groundElevation`) updated at 60fps inside the Three.js loop and throttled to HUD readouts.
  - Landmark registry containing 3D world coordinates, discovery radius, regional elevation profile, ambient audio trigger, and bilingual title/description.

### Interactive Component & State Mapping

- **Language Toggle (`தமிழ் | English`)**: Accessible on the Title Screen, Garage, Top-Right HUD, and Pause Menu; updates all UI labels, landmark banners, and customizer tabs instantaneously without interrupting the 3D simulation or music playback.
- **3D Garage Customizer**: Selecting a car model rebuilds the composite `THREE.Group` vehicle on the turntable; changing paint, finish, wheels, accessories, or TN license plate updates PBR materials and regenerates the dynamic `CanvasTexture` number plate in real time.
- **Driving Input & Camera Controls**: Separates continuous held inputs (`WASD` / `Arrow Keys` + mobile touch buttons for Throttle, Brake/Reverse, Steer, Drift `Space`, Nitro `Shift`) from edge-triggered actions (`C` camera cycle, `R` reset car to nearest road spline, `M` mute audio, `N` next radio station, `H` hide/show bottom HUD, `Esc` pause), clearing held keys automatically on window blur.
- **Music & Radio Controls**: Clicking station buttons or pressing `N` crossfades the Web Audio sequencer between Carnatic Nadaswaram, Racing Synthwave, and Nilgiri Flute stations, while adjusting master/music/SFX volume or muting updates Web Audio `GainNode` targets smoothly.
