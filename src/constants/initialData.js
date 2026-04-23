export const INITIAL_GLOBAL_SETTINGS = {
  distances: [18, 30, 50, 70],
  targetSizes: [40, 60, 80, 122],
  rulesets: [
    { id: 'r1', name: 'Turnier Halle (3 Pfeile)', arrowsPerPass: 3, totalPasses: 10 },
    { id: 'r2', name: 'Turnier WA 720 (6 Pfeile)', arrowsPerPass: 6, totalPasses: 12 },
    { id: 'r3', name: 'Freies Training (Endlos)', arrowsPerPass: 3, totalPasses: 999 }
  ],
  bows: [
    { id: 'b1', name: 'Turnier-Recurve', type: 'Recurve', handedness: 'RH', riserBrand: 'WNS Motive', riserSystem: 'ILF (Metall)', limbBrand: 'WNS', drawWeight: 30 },
    { id: 'b2', name: 'Blankbogen Setup', type: 'Blankbogen', handedness: 'RH', riserBrand: 'Spigarelli', riserSystem: 'ILF (Metall)', limbBrand: 'Uukha', drawWeight: 35 }
  ],
  arrows: [
    { id: 'a1', name: 'Outdoor Carbon', brand: 'Carbon Express', spine: 800, length: 29.5, nock: 'Pin-Nock', pointWeight: 90, pointType: 'Klebespitze' },
    { id: 'a2', name: 'Halle Alu', brand: 'Easton X7', spine: 2014, length: 30, nock: 'In-Nock', pointWeight: 100, pointType: 'Schraubspitze' }
  ]
};

export const DEFAULT_WEATHER = {
  isOutdoor: true,
  condition: 'sonnig',
  temperature: 20,
  windSpeed: 0,
  windDirection: 'N',
  location: ''
};

export const DEFAULT_USER_SETTINGS = {
  rulesetId: 'r1',
  distance: 18,
  targetSize: 40,
  bowId: 'b1',
  arrowId: 'a1',
  weather: DEFAULT_WEATHER
};

export const INITIAL_BOW_FORM = { name: '', type: 'Recurve', handedness: 'RH', riserBrand: '', riserSystem: 'ILF (Metall)', limbBrand: '', drawWeight: 30 };
export const INITIAL_ARROW_FORM = { name: '', brand: '', spine: 500, length: 29, nock: '', pointWeight: 100, pointType: '' };
