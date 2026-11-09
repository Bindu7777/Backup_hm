import { Vendor } from '@/lib/supabase';

export interface AdminCatAction {
  label: string;
  tab?: string;
  actionType?: 'switch_tab' | 'filter_real' | 'filter_sample' | 'view_pending' | 'open_url' | 'custom';
  payload?: any;
}

export interface AdminCatResponse {
  content: string;
  actions?: AdminCatAction[];
}

export interface OnboardedVendorRecord {
  vendorId: number;
  brandName: string;
  spocName: string;
  phone: string;
  whatsappUrl: string;
  email?: string;
  city: string;
  category: string;
  categoryKey: 'photography' | 'planner' | 'decor' | 'makeup' | 'gifting';
  username: string;
  password: string;
  experience: string;
  pricingDisplay: string;
  whyReliable: string;
  applicationId: string;
  applicationStatus: 'Approved';
  isSample: false;
  isOnboarded: true;
  verified: true;
  currentlyAvailable: true;
  profileStatus: string;
  tutorialUrl: string;
  loginUrl: string;
  serviceDescription: string;
}

/**
 * 🌟 Official Onboarded & Verified Vendors Database in Happy Moments
 * Live approved vendors who registered through the self-serve onboarding portal,
 * received active login credentials, and were dispatched the video tutorial guide.
 */
export const ONBOARDED_VENDORS_DB: OnboardedVendorRecord[] = [
  {
    vendorId: 1073,
    brandName: 'The Film Frames',
    spocName: 'Shubham Tiwari',
    phone: '9505726010',
    whatsappUrl: 'https://wa.me/919505726010?text=Hello%20Shubham%2C%20Happy%20Moments%20admin%20here%20with%20a%20new%20client%20inquiry.',
    email: 'shubhut63@gmail.com',
    city: 'Hyderabad, Telangana (Pan-India & South India Outstations Available)',
    category: 'Photography & Cinematic Films',
    categoryKey: 'photography',
    username: '9505726010',
    password: 'HM@6010#',
    experience: '5 - 10 years',
    pricingDisplay: 'Available upon discussion (Packages tailored to event scale)',
    whyReliable: 'Specializes in cinematic wedding storytelling, candid moments, and traditional ceremonies. 5+ portfolio albums uploaded with zero negative remarks.',
    applicationId: 'HM-VND-MW7KM52N-3801',
    applicationStatus: 'Approved',
    isSample: false,
    isOnboarded: true,
    verified: true,
    currentlyAvailable: true,
    profileStatus: 'Tutorial Sent ➔ Awaiting Vendor Profile Completion',
    tutorialUrl: 'https://www.happymomentsindia.com/vendor-tutorial',
    loginUrl: 'https://www.happymomentsindia.com/vendor-login',
    serviceDescription: 'Cinematic wedding photography, traditional & candid storytelling, outstation shoots.'
  },
  {
    vendorId: 1060,
    brandName: 'Reels of Memories',
    spocName: 'Shivani Darak',
    phone: '9100700707',
    whatsappUrl: 'https://wa.me/919100700707?text=Hello%20Shivani%2C%20Happy%20Moments%20admin%20here%20with%20a%20new%20photography%20lead.',
    email: 'reelsofmemories@gmail.com',
    city: 'Hyderabad, Telangana (Shoots in Hyderabad, Vizag, Goa & Destination Weddings)',
    category: 'Premium Wedding Photography & Cinematic Wedding Films',
    categoryKey: 'photography',
    username: '9100700707',
    password: 'HM@0707#',
    experience: '3 - 5 years',
    pricingDisplay: 'Starting at ₹3,00,000 per wedding package',
    whyReliable: 'Premium wedding films brand covering Haldi to Vidaai with cinematic 4K highlight reels, drone coverage, and archival photo albums.',
    applicationId: 'HM-VND-MW5V7FR9-1112',
    applicationStatus: 'Approved',
    isSample: false,
    isOnboarded: true,
    verified: true,
    currentlyAvailable: true,
    profileStatus: 'Tutorial Sent ➔ Awaiting Vendor Profile Completion',
    tutorialUrl: 'https://www.happymomentsindia.com/vendor-tutorial',
    loginUrl: 'https://www.happymomentsindia.com/vendor-login',
    serviceDescription: 'Premium wedding films, candid storytelling, pre-wedding shoots across Hyderabad, Vizag, Goa, and destination weddings.'
  },
  {
    vendorId: 1064,
    brandName: 'Eventaura productions',
    spocName: 'Vipin',
    phone: '8686003289',
    whatsappUrl: 'https://wa.me/918686003289?text=Hello%20Vipin%2C%20Happy%20Moments%20admin%20here%20with%20a%20new%20event%20inquiry.',
    email: 'Infoeventaura@gmail.com',
    city: 'Hyderabad, Telangana (Coverage: Telangana & AP)',
    category: 'Luxury Event Management & Destination Weddings',
    categoryKey: 'planner',
    username: '8686003289',
    password: 'HM@3289#',
    experience: '10+ years',
    pricingDisplay: 'Starting at ₹30,000 per event',
    whyReliable: 'A decade of industry standing in luxury event planning, bespoke destination weddings, creative concept design, and end-to-end execution.',
    applicationId: 'HM-VND-MW5WGA48-2542',
    applicationStatus: 'Approved',
    isSample: false,
    isOnboarded: true,
    verified: true,
    currentlyAvailable: true,
    profileStatus: 'Tutorial Sent ➔ Awaiting Vendor Profile Completion',
    tutorialUrl: 'https://www.happymomentsindia.com/vendor-tutorial',
    loginUrl: 'https://www.happymomentsindia.com/vendor-login',
    serviceDescription: '10+ years experience in luxury event management, bespoke destination weddings, flawless execution.'
  },
  {
    vendorId: 1067,
    brandName: 'Spyl Events',
    spocName: 'Yeshwitha',
    phone: '8197957226',
    whatsappUrl: 'https://wa.me/918197957226?text=Hello%20Yeshwitha%2C%20Happy%20Moments%20admin%20here%20with%20a%20new%20Bangalore%20event%20inquiry.',
    email: '',
    city: 'Bangalore, Karnataka',
    category: 'Event Planning, Decor & Bridal Coordination',
    categoryKey: 'planner',
    username: '8197957226',
    password: 'HM@7226#',
    experience: '3 - 5 years',
    pricingDisplay: 'Available upon discussion',
    whyReliable: 'Full-service event management across Bangalore handling theme decor, photography coordination, and styling with prompt client communication.',
    applicationId: 'HM-VND-MW625R0H-2135',
    applicationStatus: 'Approved',
    isSample: false,
    isOnboarded: true,
    verified: true,
    currentlyAvailable: true,
    profileStatus: 'Tutorial Sent ➔ Awaiting Vendor Profile Completion',
    tutorialUrl: 'https://www.happymomentsindia.com/vendor-tutorial',
    loginUrl: 'https://www.happymomentsindia.com/vendor-login',
    serviceDescription: 'Full-service event management, theme decorations, photography and styling across Bangalore.'
  },
  {
    vendorId: 1069,
    brandName: 'Isha Events',
    spocName: 'Shivasai',
    phone: '6300985968',
    whatsappUrl: 'https://wa.me/916300985968?text=Hello%20Shivasai%2C%20Happy%20Moments%20admin%20here%20with%20a%20new%20decor%20lead.',
    email: 'shivasailovely007@gmail.com',
    city: 'Hyderabad, Telangana (Telangana & AP)',
    category: 'Luxury Balloon & Floral Setups, Entertainment & DJ',
    categoryKey: 'planner',
    username: '6300985968',
    password: 'HM@5968#',
    experience: '5 - 10 years',
    pricingDisplay: 'Available upon discussion (Packages tailored to budget)',
    whyReliable: 'Proven expertise in premium balloon installations, luxury floral arrangements, DJ & entertainment setups from intimate to grand celebrations.',
    applicationId: 'HM-VND-MW636Q3N-8808',
    applicationStatus: 'Approved',
    isSample: false,
    isOnboarded: true,
    verified: true,
    currentlyAvailable: true,
    profileStatus: 'Tutorial Sent ➔ Awaiting Vendor Profile Completion',
    tutorialUrl: 'https://www.happymomentsindia.com/vendor-tutorial',
    loginUrl: 'https://www.happymomentsindia.com/vendor-login',
    serviceDescription: 'Balloon decorations, premium luxurious setups, stunning floral arrangements, DJ, lighting & nail artists.'
  },
  {
    vendorId: 1071,
    brandName: 'SRI SAI EVENTS',
    spocName: 'BADDAM TARUN REDDY',
    phone: '9618332832',
    whatsappUrl: 'https://wa.me/919618332832?text=Hello%20Tarun%20Reddy%2C%20Happy%20Moments%20admin%20here%20with%20a%20production%20lead.',
    email: 'srisaievents6@gmail.com',
    city: 'Hyderabad, Telangana (TS, AP, Karnataka)',
    category: 'DJ, Intelligent Lighting, Aluminum Truss, LED Screens & Decor',
    categoryKey: 'decor',
    username: '9618332832',
    password: 'HM@2832#',
    experience: '3 - 5 years (5 years with zero remarks)',
    pricingDisplay: 'Available upon discussion',
    whyReliable: 'Heavy event infrastructure specialist with in-house sound, DJ, intelligent moving heads, heavy trussing, LED walls, and silent power backup generators.',
    applicationId: 'HM-VND-MW669U0J-7952',
    applicationStatus: 'Approved',
    isSample: false,
    isOnboarded: true,
    verified: true,
    currentlyAvailable: true,
    profileStatus: 'Tutorial Sent ➔ Awaiting Vendor Profile Completion',
    tutorialUrl: 'https://www.happymomentsindia.com/vendor-tutorial',
    loginUrl: 'https://www.happymomentsindia.com/vendor-login',
    serviceDescription: 'Complete sound, DJ, intelligent lighting, truss, LED screening, special effects & full decor production.'
  },
  {
    vendorId: 1070,
    brandName: 'Meenakshi Events Hyderabad',
    spocName: 'Puli Srinivas',
    phone: '7730036267',
    whatsappUrl: 'https://wa.me/917730036267?text=Hello%20Srinivas%2C%20Happy%20Moments%20admin%20here%20with%20a%20wedding%20decor%20lead.',
    email: 'pulisrinivas100@gmail.com',
    city: 'Hyderabad, Telangana',
    category: 'Traditional Mandap Decorations, Stage & Venue Styling',
    categoryKey: 'decor',
    username: '7730036267',
    password: 'HM@6267#',
    experience: '5 - 10 years (7+ years direct industry standing)',
    pricingDisplay: 'Available upon discussion',
    whyReliable: 'Reliable South Indian and traditional Telugu mandap setups, marigold and exotic flower styling, and convention hall decor coordination.',
    applicationId: 'HM-VND-MW63FQKC-7748',
    applicationStatus: 'Approved',
    isSample: false,
    isOnboarded: true,
    verified: true,
    currentlyAvailable: true,
    profileStatus: 'Tutorial Sent ➔ Awaiting Vendor Profile Completion',
    tutorialUrl: 'https://www.happymomentsindia.com/vendor-tutorial',
    loginUrl: 'https://www.happymomentsindia.com/vendor-login',
    serviceDescription: '7+ years experience in event planning, stage decorations, mandap designs, and venue coordination.'
  },
  {
    vendorId: 1068,
    brandName: 'Tz.makeoversbymk',
    spocName: 'Mona Khan',
    phone: '9985555159',
    whatsappUrl: 'https://wa.me/919985555159?text=Hello%20Mona%20Khan%2C%20Happy%20Moments%20admin%20here%20with%20a%20bridal%20makeup%20lead.',
    email: 'tz.makeoversbymk@gmail.com',
    city: 'Hyderabad, Telangana (Travels across Telangana & AP)',
    category: 'Advance Bridal Makeup, HD/Airbrush & Contemporary Hairstyling',
    categoryKey: 'makeup',
    username: '9985555159',
    password: 'HM@5159#',
    experience: '5 - 10 years',
    pricingDisplay: 'Starting at ₹25,000 per event',
    whyReliable: 'Professional bridal makeover artist experienced in high-definition bridal glam, saree draping, and contemporary hairstyles for sangeet & reception.',
    applicationId: 'HM-VND-MW62MZH2-4721',
    applicationStatus: 'Approved',
    isSample: false,
    isOnboarded: true,
    verified: true,
    currentlyAvailable: true,
    profileStatus: 'Tutorial Sent ➔ Awaiting Vendor Profile Completion',
    tutorialUrl: 'https://www.happymomentsindia.com/vendor-tutorial',
    loginUrl: 'https://www.happymomentsindia.com/vendor-login',
    serviceDescription: 'Advance bridal makeover, contemporary hair styling, reception & sangeet glam.'
  },
  {
    vendorId: 1072,
    brandName: 'Resin me up',
    spocName: 'Batul',
    phone: '9019536661',
    whatsappUrl: 'https://wa.me/919019536661?text=Hello%20Batul%2C%20Happy%20Moments%20admin%20here%20with%20a%20return%20favours%20order%20lead.',
    email: 'nassurbatool@gmail.com',
    city: 'Bangalore, Karnataka (Pan-India Courier Delivery)',
    category: 'Handcrafted Resin Gifts, Wedding Favours & Custom Hampers',
    categoryKey: 'gifting',
    username: '9019536661',
    password: 'HM@6661#',
    experience: '1 - 2 years',
    pricingDisplay: 'Starting at ₹100 per piece',
    whyReliable: '100% handcrafted personalized resin keepsakes, wedding return gifts, and custom hampers tailored to the client’s guest count and budget.',
    applicationId: 'HM-VND-MW7AKL90-3847',
    applicationStatus: 'Approved',
    isSample: false,
    isOnboarded: true,
    verified: true,
    currentlyAvailable: true,
    profileStatus: 'Tutorial Sent ➔ Awaiting Vendor Profile Completion',
    tutorialUrl: 'https://www.happymomentsindia.com/vendor-tutorial',
    loginUrl: 'https://www.happymomentsindia.com/vendor-login',
    serviceDescription: 'Custom handmade resin gifts, personalized return favours & keepsakes for memorable occasions.'
  }
];

/**
 * Platform Knowledge Base for Momo Admin Cat
 */
export const PLATFORM_STATS = {
  totalVendors: 994,
  sampleVendors: 983,
  realOnboardedVendorsCount: 11,
  approvedActiveOnboardedCount: 9,
  verifiedVendors: 913,
  verifiedSample: 904,
  verifiedReal: 9,
  onboardedVendors: ONBOARDED_VENDORS_DB,
  adminSpoc: {
    name: 'Bindu',
    phone: '+91 79934 32999',
    role: 'Platform Owner & Lead Dispatcher'
  }
};

/**
 * Helper to format a single vendor card in markdown
 */
function formatVendorCard(v: OnboardedVendorRecord): string {
  return `#### 🌟 **${v.brandName}** (ID: \`#${v.vendorId}\`)
- 👤 **Contact Person:** **${v.spocName}**
- 📞 **Phone / WhatsApp:** [\`${v.phone}\`](${v.whatsappUrl})
- 📍 **City / Coverage:** ${v.city}
- 💼 **Category:** ${v.category}
- ⏳ **Experience:** ${v.experience}
- 💰 **Pricing:** ${v.pricingDisplay}
- 🛡️ **Why Reliable:** ${v.whyReliable}
- 🔐 **Credentials:** User: \`${v.username}\` | Pass: \`${v.password}\``;
}

/**
 * Deep platform intelligence engine for Momo Admin Cat
 */
export async function getAdminCatResponse(
  query: string,
  liveVendors: Vendor[] = []
): Promise<AdminCatResponse> {
  const q = query.trim().toLowerCase();
  const totalVendors = liveVendors.length || PLATFORM_STATS.totalVendors;
  const approved = ONBOARDED_VENDORS_DB;

  // 1. Specific Category Queries for Reliable Vendors
  const isPhotography = q.includes('photo') || q.includes('film') || q.includes('camera') || q.includes('video') || q.includes('shoot');
  const isPlanner = q.includes('planner') || q.includes('planning') || q.includes('event management') || q.includes('destination');
  const isDecor = q.includes('decor') || q.includes('mandap') || q.includes('lighting') || q.includes('sound') || q.includes('dj') || q.includes('truss') || q.includes('screen');
  const isMakeup = q.includes('makeup') || q.includes('hair') || q.includes('bridal') || q.includes('makeover') || q.includes('beauty');
  const isGifting = q.includes('gift') || q.includes('favour') || q.includes('return favour') || q.includes('resin') || q.includes('hamper');

  // 1A. Photography Specific
  if (isPhotography && !isPlanner && !isDecor && !isMakeup && !isGifting) {
    const list = approved.filter(v => v.categoryKey === 'photography');
    return {
      content: `### 📸 Reliable Photography & Film Vendors

Here are your verified, highly-reliable photography partners on Happy Moments:

${list.map(formatVendorCard).join('\n\n---\n\n')}

> **Admin Dispatch Recommendation:**
> - For **grand wedding ceremonies & outstations**: Assign **The Film Frames** (#1073).
> - For **high-end 4K cinematic films & destination shoots**: Assign **Reels of Memories** (#1060).`,
      actions: [
        { label: '💬 WhatsApp Shubham (Film Frames)', actionType: 'open_url', payload: list[0].whatsappUrl },
        { label: '💬 WhatsApp Shivani (Reels of Memories)', actionType: 'open_url', payload: list[1].whatsappUrl },
        { label: '🔍 Filter in Vendor Directory', tab: 'vendors', actionType: 'filter_real' }
      ]
    };
  }

  // 1B. Event Planning Specific
  if (isPlanner && !isPhotography && !isDecor && !isMakeup && !isGifting) {
    const list = approved.filter(v => v.categoryKey === 'planner');
    return {
      content: `### 🎪 Reliable Event Planners & Destination Wedding Organizers

Here are your verified, highly-reliable event management partners:

${list.map(formatVendorCard).join('\n\n---\n\n')}

> **Admin Dispatch Recommendation:**
> - For **luxury destination weddings & large corporate events**: Assign **Eventaura productions** (#1064).
> - For **Bangalore full-service events & theme styling**: Assign **Spyl Events** (#1067).
> - For **luxury balloon, floral installations & entertainment**: Assign **Isha Events** (#1069).`,
      actions: [
        { label: '💬 WhatsApp Vipin (Eventaura)', actionType: 'open_url', payload: list[0].whatsappUrl },
        { label: '💬 WhatsApp Yeshwitha (Spyl)', actionType: 'open_url', payload: list[1].whatsappUrl },
        { label: '💬 WhatsApp Shivasai (Isha)', actionType: 'open_url', payload: list[2].whatsappUrl },
        { label: '🔍 Filter in Vendor Directory', tab: 'vendors', actionType: 'filter_real' }
      ]
    };
  }

  // 1C. Decor & DJ / Sound Specific
  if (isDecor && !isPhotography && !isPlanner && !isMakeup && !isGifting) {
    const list = approved.filter(v => v.categoryKey === 'decor');
    return {
      content: `### 🌸 Reliable Stage Decorators, DJ, Lighting & Production Setups

Here are your verified decor and heavy production specialists:

${list.map(formatVendorCard).join('\n\n---\n\n')}

> **Admin Dispatch Recommendation:**
> - For **heavy sound, DJ, intelligent lighting, aluminum trussing & LED walls**: Assign **SRI SAI EVENTS** (#1071).
> - For **traditional Telugu mandaps, floral stage decor & convention halls**: Assign **Meenakshi Events** (#1070).`,
      actions: [
        { label: '💬 WhatsApp Tarun (SRI SAI)', actionType: 'open_url', payload: list[0].whatsappUrl },
        { label: '💬 WhatsApp Srinivas (Meenakshi)', actionType: 'open_url', payload: list[1].whatsappUrl },
        { label: '🔍 Filter in Vendor Directory', tab: 'vendors', actionType: 'filter_real' }
      ]
    };
  }

  // 1D. Makeup & Hair Specific
  if (isMakeup && !isPhotography && !isPlanner && !isDecor && !isGifting) {
    const list = approved.filter(v => v.categoryKey === 'makeup');
    return {
      content: `### 💄 Reliable Bridal Makeup & Hairstyling Artists

Here is your verified, top-rated bridal beauty partner:

${list.map(formatVendorCard).join('\n\n---\n\n')}

> **Admin Dispatch Recommendation:**
> - Assign **Tz.makeoversbymk** (#1068) for HD/Airbrush bridal glam, engagement styling, and reception hair draping across Hyderabad and Andhra Pradesh.`,
      actions: [
        { label: '💬 WhatsApp Mona Khan (Tz Makeovers)', actionType: 'open_url', payload: list[0].whatsappUrl },
        { label: '🔍 Filter in Vendor Directory', tab: 'vendors', actionType: 'filter_real' }
      ]
    };
  }

  // 1E. Gifting & Return Favours Specific
  if (isGifting && !isPhotography && !isPlanner && !isDecor && !isMakeup) {
    const list = approved.filter(v => v.categoryKey === 'gifting');
    return {
      content: `### 🎁 Reliable Customized Gifting & Return Favours

Here is your verified handcrafted gifting specialist:

${list.map(formatVendorCard).join('\n\n---\n\n')}

> **Admin Dispatch Recommendation:**
> - Assign **Resin me up** (#1072) for 100% handcrafted personalized resin return favours, corporate hampers, and wedding souvenirs with pan-India courier delivery.`,
      actions: [
        { label: '💬 WhatsApp Batul (Resin me up)', actionType: 'open_url', payload: list[0].whatsappUrl },
        { label: '🔍 Filter in Vendor Directory', tab: 'vendors', actionType: 'filter_real' }
      ]
    };
  }

  // 2. City Specific Inquiries (e.g. "vendors in bangalore" or "vendors in hyderabad")
  if (q.includes('bangalore') || q.includes('bengaluru')) {
    const list = approved.filter(v => v.city.toLowerCase().includes('bangalore'));
    return {
      content: `### 📍 Reliable Onboarded Vendors in Bangalore (${list.length})

Here are our verified onboarded partners serving Bangalore, Karnataka:

${list.map(formatVendorCard).join('\n\n---\n\n')}`,
      actions: [
        { label: '💬 WhatsApp Batul (Resin me up)', actionType: 'open_url', payload: list[0].whatsappUrl },
        { label: '💬 WhatsApp Yeshwitha (Spyl Events)', actionType: 'open_url', payload: list[1].whatsappUrl },
        { label: '🔍 Filter in Vendor Directory', tab: 'vendors', actionType: 'filter_real' }
      ]
    };
  }

  // 3. General "Reliable Vendors" / "Category Wise" / "Who just onboarded"
  if (
    q.includes('reliabl') ||
    q.includes('trust') ||
    q.includes('recommend') ||
    q.includes('who just onboarded') ||
    q.includes('category') ||
    q.includes('the 9') ||
    q.includes('nine vendor') ||
    q.includes('list')
  ) {
    return {
      content: `### 🌟 Category-Wise Reliable Onboarded Vendors Suite (9 Partners)

Here is your complete curated directory of reliable, active, and verified vendors on Happy Moments:

---

### 📷 1. Photography & Cinematic Films
${approved.filter(v => v.categoryKey === 'photography').map(formatVendorCard).join('\n\n')}

---

### 🎪 2. Luxury Event Planners & Destination Weddings
${approved.filter(v => v.categoryKey === 'planner').map(formatVendorCard).join('\n\n')}

---

### 🌸 3. Stage Decorators, DJ, Lighting & Production Setups
${approved.filter(v => v.categoryKey === 'decor').map(formatVendorCard).join('\n\n')}

---

### 💄 4. Bridal Makeup & Hair Styling
${approved.filter(v => v.categoryKey === 'makeup').map(formatVendorCard).join('\n\n')}

---

### 🎁 5. Customized Gifting & Return Favours
${approved.filter(v => v.categoryKey === 'gifting').map(formatVendorCard).join('\n\n')}

---

### 🛡️ Onboarding & Verification Status:
* ✅ **Database Registered:** All 9 have \`is_onboarded: true\`, \`is_sample: false\`, and \`verified: true\`.
* 🔑 **Active Credentials:** Passwords configured; username = registered phone number.
* 📺 **Tutorial Dispatched:** Vendors sent \`https://www.happymomentsindia.com/vendor-tutorial\` and are updating their packages.`,
      actions: [
        { label: '📸 Photographers', actionType: 'custom', payload: 'photography' },
        { label: '🎪 Event Planners', actionType: 'custom', payload: 'planner' },
        { label: '🌸 Decor & DJ', actionType: 'custom', payload: 'decor' },
        { label: '💄 Bridal Makeup', actionType: 'custom', payload: 'makeup' },
        { label: '🎁 Return Favours', actionType: 'custom', payload: 'gifting' },
        { label: '📊 View in Directory', tab: 'vendors', actionType: 'filter_real' }
      ]
    };
  }

  // 4. Specific Vendor Name Lookup
  const matchedVendor = approved.find(v => 
    q.includes(v.brandName.toLowerCase()) || 
    q.includes(v.spocName.toLowerCase()) || 
    q.includes(String(v.vendorId)) ||
    q.includes(v.phone)
  );

  if (matchedVendor) {
    return {
      content: `### 🏢 Reliable Vendor Profile: ${matchedVendor.brandName} (ID: #${matchedVendor.vendorId})

${formatVendorCard(matchedVendor)}

**📺 Tutorial & Onboarding Status:**
- **Video Tutorial URL:** [\`${matchedVendor.tutorialUrl}\`](${matchedVendor.tutorialUrl})
- **Vendor Login URL:** [\`${matchedVendor.loginUrl}\`](${matchedVendor.loginUrl})
- **Current Status:** *${matchedVendor.profileStatus}*
- **Next Action:** When ${matchedVendor.spocName} replies with "Profile Updated", confirm packages and feature on customer homepage!`,
      actions: [
        { label: `💬 WhatsApp ${matchedVendor.spocName}`, actionType: 'open_url', payload: matchedVendor.whatsappUrl },
        { label: `🔑 Manage #${matchedVendor.vendorId} Credentials`, tab: 'credentials', actionType: 'switch_tab' },
        { label: '🔍 View in Vendor Directory', tab: 'vendors', actionType: 'filter_real' }
      ]
    };
  }

  // 5. Default / Executive Assistance
  return {
    content: `### 🐱 Momo Admin Cat at your service!

I have complete, verified intelligence on all **9 reliable onboarded vendors**:
- 📷 **Photography & Films:** The Film Frames (#1073), Reels of Memories (#1060)
- 🎪 **Event Planners:** Eventaura (#1064), Spyl Events (#1067), Isha Events (#1069)
- 🌸 **Decor & Production:** SRI SAI EVENTS (#1071), Meenakshi Events (#1070)
- 💄 **Bridal Makeup:** Tz.makeoversbymk (#1068)
- 🎁 **Custom Gifting:** Resin me up (#1072)

Ask me for any category, city, or specific vendor and I'll share direct WhatsApp links, SPOC details, pricing, and login credentials!`,
    actions: [
      { label: '⭐ All Reliable Vendors', actionType: 'custom', payload: 'all_reliable' },
      { label: '📸 Photographers', actionType: 'custom', payload: 'photography' },
      { label: '🎪 Event Planners', actionType: 'custom', payload: 'planner' },
      { label: '🌸 Decor & DJ', actionType: 'custom', payload: 'decor' },
      { label: '💄 Bridal Makeup', actionType: 'custom', payload: 'makeup' },
      { label: '🎁 Return Favours', actionType: 'custom', payload: 'gifting' }
    ]
  };
}
