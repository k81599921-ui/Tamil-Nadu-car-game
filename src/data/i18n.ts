import {
  CarAccessory,
  CarCustomization,
  CarModelId,
  LandmarkId,
  LandmarkInfo,
  PaintFinish,
  RadioStationId,
  WheelStyle,
} from '../types/game';

export const DEFAULT_CUSTOMIZATION: CarCustomization = {
  modelId: 'kaveri_gt',
  bodyColor: '#D97706',
  finish: 'metallic',
  wheelStyle: 'sport',
  wheelColor: '#FBBF24',
  accessory: 'spoiler',
  underglowColor: '#F59E0B',
  plateDistrict: 'TN 01',
  plateNumber: 'VA 2026',
  tuning: {
    topSpeed: 4,
    handling: 4,
    nitroPower: 4,
  },
};

export interface CarModelSpec {
  id: CarModelId;
  name: { ta: string; en: string };
  tagline: { ta: string; en: string };
  baseSpeedKmh: number;
  baseAccel: number;
  baseGrip: number;
  offroadBonus: number;
}

export const CAR_MODELS: Record<CarModelId, CarModelSpec> = {
  kaveri_gt: {
    id: 'kaveri_gt',
    name: { ta: 'காவிரி ஜி.டி கூபே', en: 'Kaveri GT Coupe' },
    tagline: {
      ta: 'அதிவேக ஏரோடைனமிக் தமிழ்நாடு ஸ்போர்ட்ஸ் கார்',
      en: 'High-velocity aerodynamic grand tourer built for coastal highways',
    },
    baseSpeedKmh: 215,
    baseAccel: 42,
    baseGrip: 0.92,
    offroadBonus: 0.78,
  },
  nilgiri_4x4: {
    id: 'nilgiri_4x4',
    name: { ta: 'நீலகிரி 4x4 தார் ஜீப்', en: 'Nilgiri 4x4 Off-Roader' },
    tagline: {
      ta: 'ஊட்டி மலைப்பாதை மற்றும் கரடுமுரடான சாலைகளுக்கான வலிமையான ஜீப்',
      en: 'Rugged mountain 4x4 engineered for steep Ooty hairpin climbs',
    },
    baseSpeedKmh: 178,
    baseAccel: 36,
    baseGrip: 0.88,
    offroadBonus: 1.0,
  },
  madras_classic: {
    id: 'madras_classic',
    name: { ta: 'மெட்ராஸ் கிளாசிக் அம்பாசிடர்', en: 'Madras Classic Heritage' },
    tagline: {
      ta: 'பாரம்பரிய கம்பீரம் கொண்ட வின்டேஜ் குரோம் செடான்',
      en: 'Iconic curved-fender vintage tourer with timeless chrome prestige',
    },
    baseSpeedKmh: 188,
    baseAccel: 34,
    baseGrip: 0.86,
    offroadBonus: 0.86,
  },
};

export const PAINT_SWATCHES: Array<{
  hex: string;
  name: { ta: string; en: string };
}> = [
  { hex: '#D97706', name: { ta: 'சோழர் தங்கம்', en: 'Chola Gold' } },
  { hex: '#DC2626', name: { ta: 'மதுரை செந்நிறம்', en: 'Madurai Crimson' } },
  { hex: '#0284C7', name: { ta: 'மெரினா நீலம்', en: 'Marina Azure' } },
  { hex: '#15803D', name: { ta: 'நீலகிரி பச்சை', en: 'Nilgiri Emerald' } },
  { hex: '#EA580C', name: { ta: 'குமரி உதயம்', en: 'Kumari Sunrise' } },
  { hex: '#7C3AED', name: { ta: 'காஞ்சி பட்டு ஊதா', en: 'Kanchi Silk Violet' } },
  { hex: '#F1F5F9', name: { ta: 'முத்து வெள்ளை', en: 'Tuticorin Pearl' } },
  { hex: '#1E293B', name: { ta: 'கருங்கல் கருப்பு', en: 'Granite Obsidian' } },
];

export const WHEEL_COLOR_SWATCHES: Array<{
  hex: string;
  name: { ta: string; en: string };
}> = [
  { hex: '#E2E8F0', name: { ta: 'வெள்ளி குரோம்', en: 'Chrome Silver' } },
  { hex: '#FBBF24', name: { ta: 'கோவில் தங்கம்', en: 'Temple Gold' } },
  { hex: '#1E293B', name: { ta: 'மேட் கருப்பு', en: 'Stealth Black' } },
  { hex: '#B45309', name: { ta: 'வெண்கலம்', en: 'Chola Bronze' } },
];

export const UNDERGLOW_SWATCHES: Array<{
  hex: string;
  name: { ta: string; en: string };
}> = [
  { hex: 'none', name: { ta: 'இல்லை', en: 'Off' } },
  { hex: '#F59E0B', name: { ta: 'தங்க ஒளி', en: 'Amber Glow' } },
  { hex: '#06B6D4', name: { ta: 'கடல் சியான்', en: 'Marina Cyan' } },
  { hex: '#EC4899', name: { ta: 'தாமரை பிங்க்', en: 'Lotus Pink' } },
  { hex: '#22C55E', name: { ta: 'மலை பச்சை', en: 'Tea Emerald' } },
];

export const TN_DISTRICTS: Array<{
  code: string;
  city: { ta: string; en: string };
}> = [
  { code: 'TN 01', city: { ta: 'சென்னை', en: 'Chennai' } },
  { code: 'TN 49', city: { ta: 'தஞ்சாவூர்', en: 'Thanjavur' } },
  { code: 'TN 58', city: { ta: 'மதுரை', en: 'Madurai' } },
  { code: 'TN 43', city: { ta: 'ஊட்டி (நீலகிரி)', en: 'Ooty (Nilgiris)' } },
  { code: 'TN 74', city: { ta: 'கன்னியாகுமரி', en: 'Kanyakumari' } },
  { code: 'TN 45', city: { ta: 'திருச்சி', en: 'Tiruchirappalli' } },
  { code: 'TN 37', city: { ta: 'கோயம்புத்தூர்', en: 'Coimbatore' } },
];

export const RADIO_STATIONS: Array<{
  id: RadioStationId;
  name: { ta: string; en: string };
  genre: { ta: string; en: string };
}> = [
  {
    id: 'marabu',
    name: { ta: 'இசை மரபு FM 98.4', en: 'Isai Marabu FM 98.4' },
    genre: {
      ta: 'நாதஸ்வரம் · தவில் · கர்நாடக ராகம்',
      en: 'Nadaswaram · Thavil · Carnatic Raga',
    },
  },
  {
    id: 'turbo',
    name: { ta: 'சென்னை டர்போ FM 104.2', en: 'Chennai Turbo FM 104.2' },
    genre: {
      ta: 'நவீன குத்து பீட்ஸ் & ரேசிங் சிந்த்',
      en: 'Kuthu Rhythm & Electronic Racing Synth',
    },
  },
  {
    id: 'nilgiri',
    name: { ta: 'நீலகிரி தென்றல் FM 91.6', en: 'Nilgiri Breeze FM 91.6' },
    genre: {
      ta: 'புல்லாங்குழல் · வீணை · மலைத்தென்றல்',
      en: 'Bamboo Flute · Veena Plucks · Hill Ambient',
    },
  },
  {
    id: 'off',
    name: { ta: 'வானொலி நிறுத்தம்', en: 'Radio Off' },
    genre: {
      ta: 'கார் என்ஜின் ஒலி மட்டும்',
      en: 'Pure Engine & World Ambience',
    },
  },
];

export const LANDMARKS: Record<LandmarkId, LandmarkInfo> = {
  chennai: {
    id: 'chennai',
    worldX: 168,
    worldZ: -310,
    radius: 58,
    elevation: 2.4,
    accentColor: '#38BDF8',
    ambientType: 'coastal',
    name: {
      ta: 'சென்னை மெரினா & நேப்பியர் பாலம்',
      en: 'Chennai Marina & Napier Bridge',
    },
    subtitle: {
      ta: 'வடக்கு கடற்கரை தலைநகரம் · வங்காள விரிகுடா',
      en: 'Capital Gateway · Bay of Bengal Coast',
    },
    description: {
      ta: 'உலகின் மிக நீளமான நகர்ப்புற கடற்கரைகளில் ஒன்றான மெரினா கடற்கரை, வண்ணமயமான நேப்பியர் வளைவுப் பாலம் மற்றும் கலங்கரை விளக்கம்.',
      en: 'Home to the iconic bowstring arches of Napier Bridge, the striped Marina Lighthouse, and sweeping Bay of Bengal sea breezes.',
    },
  },
  thanjavur: {
    id: 'thanjavur',
    worldX: 105,
    worldZ: -35,
    radius: 62,
    elevation: 4.0,
    accentColor: '#F59E0B',
    ambientType: 'temple',
    name: {
      ta: 'தஞ்சை பெரிய கோவில் (பிரகதீஸ்வரர் ஆலயம்)',
      en: 'Thanjavur Brihadeeswarar Temple',
    },
    subtitle: {
      ta: 'மாமன்னன் ராஜராஜ சோழன் எழுப்பிய உலகப் பாரம்பரிய சின்னம்',
      en: 'UNESCO Chola Masterpiece · Cauvery Delta',
    },
    description: {
      ta: '1010-ஆம் ஆண்டில் ராஜராஜ சோழனால் கட்டப்பட்ட 216 அடி உயர ஸ்ரீ விமானம், 80 டன் எடையுள்ள ஒரே கல் சிகரம் மற்றும் நந்தி மண்டபம்.',
      en: 'Built by Emperor Raja Raja Chola I, featuring a soaring 13-tiered granite Vimana, monolithic dome, and sacred Nandi Mandapam.',
    },
  },
  madurai: {
    id: 'madurai',
    worldX: -20,
    worldZ: 155,
    radius: 64,
    elevation: 5.5,
    accentColor: '#EF4444',
    ambientType: 'temple',
    name: {
      ta: 'மதுரை மீனாட்சி அம்மன் திருக்கோவில்',
      en: 'Madurai Meenakshi Amman Temple',
    },
    subtitle: {
      ta: 'தூங்கா நகரம் · வண்ணமயமான இராஜகோபுரங்கள்',
      en: 'Temple City · Multi-Tiered Stucco Gopurams',
    },
    description: {
      ta: 'வைகை கரையில் அமைந்த பழமையான தமிழ் பண்பாட்டுத் தலம்; வானளாவிய வண்ண இராஜகோபுரங்கள் மற்றும் பொற்றாமரைக் குளம்.',
      en: 'Ancient cultural heart of Tamil Nadu, crowned by towering rainbow-tiered Dravidian Gopurams and the Golden Lotus Tank.',
    },
  },
  kanyakumari: {
    id: 'kanyakumari',
    worldX: -32,
    worldZ: 360,
    radius: 68,
    elevation: 2.6,
    accentColor: '#FBBF24',
    ambientType: 'coastal',
    name: {
      ta: 'கன்னியாகுமரி திருவள்ளுவர் சிலை & விவேகானந்தர் பாறை',
      en: 'Kanyakumari Thiruvalluvar Statue',
    },
    subtitle: {
      ta: 'முக்கடல் சங்கமம் · 133 அடி அய்யன் திருவள்ளுவர் சிலை',
      en: 'Confluence of Three Seas · 133-ft Poet Monument',
    },
    description: {
      ta: 'திருக்குறளின் 133 அதிகாரங்களைக் குறிக்கும் வகையில் கடல் நடுவே கம்பீரமாக உயர்ந்து நிற்கும் திருவள்ளுவர் சிலை மற்றும் விவேகானந்தர் நினைவு மண்டபம்.',
      en: 'Standing 133 feet above the Indian Ocean waves to honor the 133 chapters of the Tirukkural alongside Vivekananda Rock Memorial.',
    },
  },
  ooty: {
    id: 'ooty',
    worldX: -210,
    worldZ: -135,
    radius: 68,
    elevation: 38.0,
    accentColor: '#22C55E',
    ambientType: 'hill',
    name: {
      ta: 'ஊட்டி நீலகிரி மலைப்பாதை & தேயிலைத் தோட்டம்',
      en: 'Ooty Nilgiri Hills & Tea Estates',
    },
    subtitle: {
      ta: 'மலைகளின் அரசி · கொண்டைஊசி வளைவுகள்',
      en: 'Queen of Hill Stations · Western Ghats Hairpins',
    },
    description: {
      ta: 'பசுமையான தேயிலைத் தோட்டங்கள், குளிர்ந்த மேகமூட்டம், யூகலிப்டஸ் மரங்கள் மற்றும் விறுவிறுப்பான மலைப்பாதை வளைவுகள்.',
      en: 'Lush emerald tea terraces, misty eucalyptus groves, heritage mountain railway arches, and thrilling elevation climbs.',
    },
  },
};

export const RACE_ORDER: LandmarkId[] = [
  'chennai',
  'thanjavur',
  'madurai',
  'kanyakumari',
  'ooty',
];

export const UI_TEXT = {
  ta: {
    gameTitle: 'தமிழகம் டிரைவ் 3D',
    gameSubtitle: 'தமிழ்நாடு பாரம்பரிய நெடுஞ்சாலை & கார் பந்தயம்',
    freeRoamTitle: 'சுற்றுலா ஓட்டம்',
    freeRoamDesc: 'சுதந்திரமாக தமிழ்நாடு முழுக்க ஓட்டி கோவில்கள் & திருவள்ளுவர் சிலையை தரிசியுங்கள்',
    raceModeTitle: 'நெடுஞ்சாலை நேர பந்தயம்',
    raceModeDesc: 'சென்னை முதல் குமரி மற்றும் ஊட்டி வரை 5 முக்கிய இடங்களை கடக்கும் வேக சவால்',
    startDrive: 'பயணத்தைத் தொடங்கு',
    openGarage: 'கார் கஸ்டமைசேஷன் கூடம்',
    backToTitle: 'முகப்புத் திரை',
    driveFromGarage: 'இந்த காரை ஓட்டுக',
    controlsHint: 'WASD / அம்புக்குறிகள்: ஓட்டுக · Space: டிரிஃப்ட் · Shift: நைட்ரோ · C: கேமரா · N: இசை மாற்று · Esc: இடைநிறுத்தம்',
    langSwitchLabel: 'English',
    speedUnit: 'கி.மீ/மணி',
    nitroLabel: 'நைட்ரோ சக்தி',
    altitudeLabel: 'உயரம்',
    nearestPlace: 'அருகிலுள்ள இடம்',
    discoveredCount: 'கண்டறிந்த இடங்கள்',
    fastTravel: 'விரைவுப் பயணம்',
    checkpoint: 'செக்பாயிண்ட்',
    raceTime: 'பந்தய நேரம்',
    bestTime: 'சிறந்த சாதனை',
    newRecord: 'புதிய சாதனை நேரம்!',
    pauseTitle: 'விளையாட்டு இடைநிறுத்தம்',
    resumeGame: 'தொடர்ந்து விளையாடு',
    restartRace: 'மீண்டும் தொடங்கு',
    customizeCar: 'கார் மாற்றம் (கேரேஜ்)',
    musicSettings: 'இசை & ஒலி அமைப்பு',
    musicVolume: 'இசை அளவு (Music)',
    sfxVolume: 'என்ஜின் ஒலி (SFX)',
    radioStation: 'பண்பலை வானொலி (FM Radio)',
    teleportSection: 'முக்கிய இடங்களுக்கு உடனடி பயணம்',
    exportHtmlBtn: 'HTML கேம் தகவல் கோப்பு பதிவிறக்கம்',
    victoryTitle: 'தமிழ்நாடு சுற்றுப்பயண பந்தயம் வெற்றி!',
    victorySubtitle: 'ஐந்து வரலாற்றுச் சிறப்புமிக்க இடங்களையும் வெற்றிகரமாகக் கடந்தீர்கள்',
    playAgain: 'மீண்டும் பந்தயம்',
    switchToFreeRoam: 'சுற்றுலா ஓட்டத்திற்கு மாறு',
    hideHud: 'கட்டுப்பாடுகளை மறை (H)',
    showHud: 'கட்டுப்பாடுகளைக் காட்டு (H)',
    resetCar: 'சாலைக்கு மீட்டமை (R)',
    cameraBtn: 'கேமரா (C)',
    touchControls: 'தொடு கட்டுப்பாடு',
    // Garage tabs
    tabModel: 'கார் மாடல்',
    tabPaint: 'வண்ணம் & பூச்சு',
    tabParts: 'சக்கரம் & அலங்காரம்',
    tabPlate: 'TN நம்பர் பிளேட்',
    tabTuning: 'வேக ட்யூனிங்',
    finishLabel: 'வண்ணப் பூச்சு வகை',
    finishChoices: {
      metallic: 'மெட்டாலிக் பளபளப்பு',
      matte: 'மேட் சாட்டின்',
      pearl: 'முத்து ஒளி (Pearl)',
    } as Record<PaintFinish, string>,
    wheelStyleLabel: 'சக்கர டிசைன்',
    wheelChoices: {
      sport: 'ஸ்போர்ட்ஸ் அலாய்',
      offroad: 'ஆஃப்-ரோடு சக்கரம்',
      classic: 'பாரம்பரிய குரோம்',
    } as Record<WheelStyle, string>,
    wheelColorLabel: 'சக்கர வண்ணம்',
    accessoryLabel: 'மேல் & முகப்பு அலங்காரம்',
    accessoryChoices: {
      none: 'எதுவுமில்லை',
      spoiler: 'ஜி.டி ஏரோ ஸ்பாய்லர்',
      roofrack: 'மலைப்பயண ரூஃப் கேரியர்',
      garland: 'திருவிழா பூ மாலை (மல்லிகை & சாமந்தி)',
    } as Record<CarAccessory, string>,
    underglowLabel: 'அடிப்பகுதி நியான் ஒளி',
    districtLabel: 'மாவட்டப் பதிவு (RTO)',
    plateCodeLabel: 'பதிவு எண்',
    statSpeed: 'அதிகபட்ச வேகம்',
    statHandling: 'வளைவு கட்டுப்பாடு',
    statNitro: 'நைட்ரோ உந்துதல்',
    landmarkReached: 'புதிய இடம் வந்தடைந்தீர்கள்',
    goSignal: 'புறப்படு!',
  },
  en: {
    gameTitle: 'THAMIZHAGAM DRIVE 3D',
    gameSubtitle: 'Tamil Nadu Heritage Highway & Motorsport Tour',
    freeRoamTitle: 'Free Roam Tour',
    freeRoamDesc: 'Explore Tamil Nadu freely at your own pace—visit sacred temples, Ooty hills & Thiruvalluvar Statue',
    raceModeTitle: 'Grand Highway Time Trial',
    raceModeDesc: 'Race against the clock across all 5 iconic Tamil Nadu regions from Chennai to Kanyakumari & Ooty',
    startDrive: 'Start Driving',
    openGarage: '3D Car Garage & Customize',
    backToTitle: 'Title Screen',
    driveFromGarage: 'Drive This Build',
    controlsHint: 'WASD / Arrows: Drive · Space: Drift · Shift: Nitro · C: Camera · N: Station · Esc: Pause',
    langSwitchLabel: 'தமிழ்',
    speedUnit: 'KM/H',
    nitroLabel: 'Nitro Boost',
    altitudeLabel: 'Elevation',
    nearestPlace: 'Nearest Landmark',
    discoveredCount: 'Landmarks Visited',
    fastTravel: 'Fast Travel',
    checkpoint: 'Checkpoint',
    raceTime: 'Race Time',
    bestTime: 'Best Record',
    newRecord: 'New Personal Best!',
    pauseTitle: 'Game Paused',
    resumeGame: 'Resume Drive',
    restartRace: 'Restart Run',
    customizeCar: 'Customize Car (Garage)',
    musicSettings: 'Music & Sound Mixer',
    musicVolume: 'Music Volume',
    sfxVolume: 'Engine & World SFX',
    radioStation: 'In-Car FM Radio Station',
    teleportSection: 'Instant Landmark Fast Travel',
    exportHtmlBtn: 'Download Standalone Car & Tour Card (.html)',
    victoryTitle: 'Tamil Nadu Grand Rally Complete!',
    victorySubtitle: 'You conquered every coastal bridge, temple boulevard, and mountain hairpin',
    playAgain: 'Race Again',
    switchToFreeRoam: 'Switch to Free Roam',
    hideHud: 'Hide Dock (H)',
    showHud: 'Show Dock (H)',
    resetCar: 'Reset to Road (R)',
    cameraBtn: 'Camera (C)',
    touchControls: 'Touch Pads',
    // Garage tabs
    tabModel: 'Car Model',
    tabPaint: 'Paint & Finish',
    tabParts: 'Wheels & Trim',
    tabPlate: 'TN Number Plate',
    tabTuning: 'Performance Tune',
    finishLabel: 'Paint Finish',
    finishChoices: {
      metallic: 'Metallic Clearcoat',
      matte: 'Matte Satin',
      pearl: 'Iridescent Pearl',
    } as Record<PaintFinish, string>,
    wheelStyleLabel: 'Alloy Rim Design',
    wheelChoices: {
      sport: 'Sport Multi-Spoke',
      offroad: 'Off-Road Beadlock',
      classic: 'Heritage Chrome Cap',
    } as Record<WheelStyle, string>,
    wheelColorLabel: 'Wheel Rim Accent',
    accessoryLabel: 'Aero & Cultural Trim',
    accessoryChoices: {
      none: 'Clean Stock',
      spoiler: 'GT Carbon Wing',
      roofrack: 'Nilgiri Roof Carrier',
      garland: 'Festive Temple Garland (Marigold)',
    } as Record<CarAccessory, string>,
    underglowLabel: 'Chassis Underglow',
    districtLabel: 'Tamil Nadu RTO District',
    plateCodeLabel: 'Custom Number',
    statSpeed: 'Top Speed',
    statHandling: 'Cornering & Hill Grip',
    statNitro: 'Nitro Boost Power',
    landmarkReached: 'Landmark Discovered',
    goSignal: 'GO!',
  },
};
