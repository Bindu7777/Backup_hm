// Category constants to ensure consistency across the application
export const CATEGORY_CODES = {
  EVENT_PLANNERS: '01',
  VENUES: '02', 
  PHOTOGRAPHERS: '03',
  DECORATORS: '04',
  CATERERS: '05',
  MAKEUP_ARTISTS: '06',
  DJS_LIGHTING_ENTERTAINMENT: '07',
  ANCHORS: '08',
  TRANSPORTATION_SERVICES: '09',
  FASHION_COSTUME_DESIGNERS: '10',
  TENT_EQUIPMENT_RENTALS: '11',
  EVENT_SPACES: '12'
} as const;

export const CATEGORY_NAMES = {
  [CATEGORY_CODES.EVENT_PLANNERS]: 'Event Planners',
  [CATEGORY_CODES.VENUES]: 'Venues',
  [CATEGORY_CODES.PHOTOGRAPHERS]: 'Photography/Videography',
  [CATEGORY_CODES.DECORATORS]: 'Decorators',
  [CATEGORY_CODES.CATERERS]: 'Caterers',
  [CATEGORY_CODES.MAKEUP_ARTISTS]: 'Makeup Artists',
  [CATEGORY_CODES.DJS_LIGHTING_ENTERTAINMENT]: 'DJs, Lighting, and Entertainment',
  [CATEGORY_CODES.ANCHORS]: 'Anchors',
  [CATEGORY_CODES.TRANSPORTATION_SERVICES]: 'Transportation Services',
  [CATEGORY_CODES.FASHION_COSTUME_DESIGNERS]: 'Fashion/Costume Designers',
  [CATEGORY_CODES.TENT_EQUIPMENT_RENTALS]: 'Tent & Equipment Rentals',
  [CATEGORY_CODES.EVENT_SPACES]: 'Event Spaces'
} as const;

export type CategoryName = typeof CATEGORY_NAMES[keyof typeof CATEGORY_NAMES];


// Reverse mapping for easy lookup
export const CATEGORY_NAME_TO_CODE: Record<string, string> = {
  'Event Planners': CATEGORY_CODES.EVENT_PLANNERS,
  'Venues': CATEGORY_CODES.VENUES,
  'Photography/Videography': CATEGORY_CODES.PHOTOGRAPHERS,
  'Decorators': CATEGORY_CODES.DECORATORS,
  'Caterers': CATEGORY_CODES.CATERERS,
  'Makeup Artists': CATEGORY_CODES.MAKEUP_ARTISTS,
  'DJs, Lighting, and Entertainment': CATEGORY_CODES.DJS_LIGHTING_ENTERTAINMENT,
  'Anchors': CATEGORY_CODES.ANCHORS,
  'Transportation Services': CATEGORY_CODES.TRANSPORTATION_SERVICES,
  'Fashion/Costume Designers': CATEGORY_CODES.FASHION_COSTUME_DESIGNERS,
  'Tent & Equipment Rentals': CATEGORY_CODES.TENT_EQUIPMENT_RENTALS,
  'Event Spaces': CATEGORY_CODES.EVENT_SPACES
};

// Helper functions
export const getCategoryCode = (categoryName: string): string => {
  return CATEGORY_NAME_TO_CODE[categoryName] || '';
};

export const getCategoryName = (categoryCode: string): string => {
  return CATEGORY_NAMES[categoryCode as keyof typeof CATEGORY_NAMES] || '';
};

// Category list for dropdowns and selections
export const CATEGORY_LIST = [
  { code: CATEGORY_CODES.EVENT_PLANNERS, name: CATEGORY_NAMES[CATEGORY_CODES.EVENT_PLANNERS] },
  { code: CATEGORY_CODES.VENUES, name: CATEGORY_NAMES[CATEGORY_CODES.VENUES] },
  { code: CATEGORY_CODES.PHOTOGRAPHERS, name: CATEGORY_NAMES[CATEGORY_CODES.PHOTOGRAPHERS] },
  { code: CATEGORY_CODES.DECORATORS, name: CATEGORY_NAMES[CATEGORY_CODES.DECORATORS] },
  { code: CATEGORY_CODES.CATERERS, name: CATEGORY_NAMES[CATEGORY_CODES.CATERERS] },
  { code: CATEGORY_CODES.MAKEUP_ARTISTS, name: CATEGORY_NAMES[CATEGORY_CODES.MAKEUP_ARTISTS] },
  { code: CATEGORY_CODES.DJS_LIGHTING_ENTERTAINMENT, name: CATEGORY_NAMES[CATEGORY_CODES.DJS_LIGHTING_ENTERTAINMENT] },
  { code: CATEGORY_CODES.ANCHORS, name: CATEGORY_NAMES[CATEGORY_CODES.ANCHORS] },
  { code: CATEGORY_CODES.TRANSPORTATION_SERVICES, name: CATEGORY_NAMES[CATEGORY_CODES.TRANSPORTATION_SERVICES] },
  { code: CATEGORY_CODES.FASHION_COSTUME_DESIGNERS, name: CATEGORY_NAMES[CATEGORY_CODES.FASHION_COSTUME_DESIGNERS] },
  { code: CATEGORY_CODES.TENT_EQUIPMENT_RENTALS, name: CATEGORY_NAMES[CATEGORY_CODES.TENT_EQUIPMENT_RENTALS] },
  { code: CATEGORY_CODES.EVENT_SPACES, name: CATEGORY_NAMES[CATEGORY_CODES.EVENT_SPACES] }
];

// Mapping between onboarding form category labels and standard Happy Moments category names
export const ONBOARDING_TO_STANDARD_CATEGORY_MAP: Record<string, string> = {
  'Event management': 'Event Planners',
  'Photography and videography': 'Photography/Videography',
  'Decorations': 'Decorators',
  'Catering': 'Caterers',
  'Makeup and styling': 'Makeup Artists',
  'Music and DJ': 'DJs, Lighting, and Entertainment',
  'Anchoring and hosting': 'Anchors',
  'Transportation': 'Transportation Services',
  'Fashion and costume': 'Fashion/Costume Designers',
  'Equipment rentals': 'Tent & Equipment Rentals',
  'Venue': 'Venues',
};

// Normalize any category (onboarding label, alias, or standard) to standard Happy Moments category name
export const normalizeCategoryToStandard = (rawCat: string): string => {
  if (!rawCat || typeof rawCat !== 'string') return '';
  const trimmed = rawCat.trim();
  if (ONBOARDING_TO_STANDARD_CATEGORY_MAP[trimmed]) {
    return ONBOARDING_TO_STANDARD_CATEGORY_MAP[trimmed];
  }
  const lower = trimmed.toLowerCase();
  for (const [onboardCat, standardCat] of Object.entries(ONBOARDING_TO_STANDARD_CATEGORY_MAP)) {
    if (onboardCat.toLowerCase() === lower) return standardCat;
  }
  for (const standardCat of Object.values(CATEGORY_NAMES)) {
    if (standardCat.toLowerCase() === lower) return standardCat;
  }
  // Keyword-based fallback
  if (lower.includes('photo') || lower.includes('video')) return 'Photography/Videography';
  if (lower.includes('decor')) return 'Decorators';
  if (lower.includes('plan') || lower.includes('event manage')) return 'Event Planners';
  if (lower.includes('cater') || lower.includes('food')) return 'Caterers';
  if (lower.includes('makeup') || lower.includes('beauty')) return 'Makeup Artists';
  if (lower.includes('dj') || lower.includes('music')) return 'DJs, Lighting, and Entertainment';
  if (lower.includes('anchor') || lower.includes('host')) return 'Anchors';
  if (lower.includes('transport')) return 'Transportation Services';
  if (lower.includes('fashion') || lower.includes('costume')) return 'Fashion/Costume Designers';
  if (lower.includes('tent') || lower.includes('rental') || lower.includes('equipment')) return 'Tent & Equipment Rentals';
  if (lower.includes('venue') || lower.includes('hall')) return 'Venues';
  return trimmed;
};

// Check if two categories match (cross-checking aliases & standard names)
export const isCategoryMatch = (catA: string, catB: string): boolean => {
  if (!catA || !catB) return false;
  const normA = normalizeCategoryToStandard(catA).toLowerCase();
  const normB = normalizeCategoryToStandard(catB).toLowerCase();
  if (normA && normB && normA === normB) return true;
  return catA.trim().toLowerCase() === catB.trim().toLowerCase();
};
