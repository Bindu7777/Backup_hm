import { Vendor } from '@/lib/supabase';

export interface AdminCatAction {
  label: string;
  tab?: string;
  actionType?: 'switch_tab' | 'filter_real' | 'filter_sample' | 'view_pending' | 'custom';
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
  email?: string;
  city: string;
  category: string;
  username: string;
  password: string;
  applicationId: string;
  applicationStatus: 'Approved' | 'Pending review' | 'Rejected';
  isSample: false;
  isOnboarded: boolean;
  verified: boolean;
  currentlyAvailable: boolean;
  profileStatus: string;
  tutorialUrl: string;
  loginUrl: string;
  serviceDescription: string;
}

/**
 * 🌟 Official Onboarded Vendors Database in Happy Moments
 * Live approved vendors who registered through the self-serve onboarding portal,
 * received active login credentials, and were dispatched the video tutorial guide.
 */
export const ONBOARDED_VENDORS_DB: OnboardedVendorRecord[] = [
  {
    vendorId: 1073,
    brandName: 'The Film Frames',
    spocName: 'Shubham tiwari',
    phone: '9505726010',
    email: 'shubhut63@gmail.com',
    city: 'Hyderabad, Telangana',
    category: 'Photography and videography',
    username: '9505726010',
    password: 'HM@6010#',
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
    vendorId: 1072,
    brandName: 'Resin me up',
    spocName: 'Batul',
    phone: '9019536661',
    email: 'nassurbatool@gmail.com',
    city: 'Bangalore, Karnataka',
    category: 'Return favours, gifting (Handcrafted custom articles)',
    username: '9019536661',
    password: 'HM@6661#',
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
  },
  {
    vendorId: 1071,
    brandName: 'SRI SAI EVENTS',
    spocName: 'BADDAM TARUN REDDY',
    phone: '9618332832',
    email: 'srisaievents6@gmail.com',
    city: 'Hyderabad, Telangana',
    category: 'DJ, Lightings, Truss, Screening, Special Effects, Decor, Event Management',
    username: '9618332832',
    password: 'HM@2832#',
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
    email: 'pulisrinivas100@gmail.com',
    city: 'Hyderabad, Telangana',
    category: 'Decorations, Venue, Event Management',
    username: '7730036267',
    password: 'HM@6267#',
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
    vendorId: 1069,
    brandName: 'Isha Events',
    spocName: 'Shivasai',
    phone: '6300985968',
    email: 'shivasailovely007@gmail.com',
    city: 'Hyderabad, Telangana',
    category: 'Event Management, Photography, Decorations, Entertainment, Floral & Balloon setups',
    username: '6300985968',
    password: 'HM@5968#',
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
    vendorId: 1068,
    brandName: 'Tz.makeoversbymk',
    spocName: 'Mona Khan',
    phone: '9985555159',
    email: 'tz.makeoversbymk@gmail.com',
    city: 'Hyderabad, Telangana',
    category: 'Makeup and hair (Bridal & Advance Hairstyles)',
    username: '9985555159',
    password: 'HM@5159#',
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
    vendorId: 1067,
    brandName: 'Spyl Events',
    spocName: 'Yeshwitha',
    phone: '8197957226',
    email: '',
    city: 'Bangalore, Karnataka',
    category: 'Event Management, Photography, Decor, Makeup & Hair',
    username: '8197957226',
    password: 'HM@7226#',
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
    vendorId: 1064,
    brandName: 'Eventaura productions',
    spocName: 'Vipin',
    phone: '8686003289',
    email: 'Infoeventaura@gmail.com',
    city: 'Hyderabad, Telangana',
    category: 'Luxury Event Management, Destination Weddings, Photography, Decor, Catering',
    username: '8686003289',
    password: 'HM@3289#',
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
    vendorId: 1060,
    brandName: 'Reels of Memories',
    spocName: 'Shivani Darak',
    phone: '9100700707',
    email: 'reelsofmemories@gmail.com',
    city: 'Hyderabad, Telangana',
    category: 'Premium Wedding Photography & Cinematic Wedding Films',
    username: '9100700707',
    password: 'HM@0707#',
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
 * Deep platform intelligence engine for Momo Admin Cat
 */
export async function getAdminCatResponse(
  query: string,
  liveVendors: Vendor[] = []
): Promise<AdminCatResponse> {
  const q = query.trim().toLowerCase();

  const totalVendors = liveVendors.length || PLATFORM_STATS.totalVendors;
  const approvedOnboarded = ONBOARDED_VENDORS_DB;

  // 1. Onboarded Vendors Inquiry / Database Inspection
  if (
    q.includes('onboard') ||
    q.includes('approved vendor') ||
    q.includes('the 9') ||
    q.includes('nine vendor') ||
    q.includes('new vendor') ||
    q.includes('tutorial') ||
    q.includes('credential') ||
    q.includes('database') ||
    q.includes('reply')
  ) {
    return {
      content: `### 🌟 Official Onboarded Vendors Database (9 Active Partners)

Here is the complete registry of all **9 newly onboarded & approved vendors** on Happy Moments:

| # | ID | Brand Name | SPOC | Phone | Category | City | Status |
| :---: | :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **#1073** | **The Film Frames** | Shubham tiwari | \`9505726010\` | Photography & Films | Hyderabad | 🟢 Approved |
| 2 | **#1072** | **Resin me up** | Batul | \`9019536661\` | Return Favours & Gifting | Bangalore | 🟢 Approved |
| 3 | **#1071** | **SRI SAI EVENTS** | B. Tarun Reddy | \`9618332832\` | DJ, Sound, Lighting & Decor | Hyderabad | 🟢 Approved |
| 4 | **#1070** | **Meenakshi Events** | Puli Srinivas | \`7730036267\` | Venue & Stage Decor | Hyderabad | 🟢 Approved |
| 5 | **#1069** | **Isha Events** | Shivasai | \`6300985968\` | Luxury Balloon & Floral Setup | Hyderabad | 🟢 Approved |
| 6 | **#1068** | **Tz.makeoversbymk** | Mona Khan | \`9985555159\` | Bridal Makeup & Hair | Hyderabad | 🟢 Approved |
| 7 | **#1067** | **Spyl Events** | Yeshwitha | \`8197957226\` | Event Planning & Styling | Bangalore | 🟢 Approved |
| 8 | **#1064** | **Eventaura productions** | Vipin | \`8686003289\` | Luxury Destination Weddings | Hyderabad | 🟢 Approved |
| 9 | **#1060** | **Reels of Memories** | Shivani Darak | \`9100700707\` | Candid & Cinematic Films | Hyderabad | 🟢 Approved |

---

### 🛡️ Onboarding Workflow & Current Phase:
1. **Credentials Active in Database:** All 9 accounts have verified logins in the \`vendor_credentials\` table (\`Username: Phone Number\`).
2. **Tutorial & Portal Dispatched:** Vendors have received the link to the video tutorial:
   👉 \`https://www.happymomentsindia.com/vendor-tutorial\`
3. **Awaiting Vendor Completion:** Each vendor is reviewing the tutorial and updating their starting prices, packages, and portfolio photos in their dashboard.
4. **Final Launch Protocol:** Once a vendor replies *"Profile Updated"*, our team reviews their published showcase and pushes them live to prospective clients!`,
      actions: [
        { label: '📊 Filter Real Vendors in Directory', tab: 'vendors', actionType: 'filter_real' },
        { label: '🔑 Open Credentials Manager', tab: 'credentials', actionType: 'switch_tab' },
        { label: '📋 View Applications Tab', tab: 'applications', actionType: 'switch_tab' },
        { label: '📑 Open Excel Spreadsheet', tab: 'excel', actionType: 'switch_tab' }
      ]
    };
  }

  // 2. Specific Onboarded Vendor Lookups
  const matchedVendor = approvedOnboarded.find(v => 
    q.includes(v.brandName.toLowerCase()) || 
    q.includes(v.spocName.toLowerCase()) || 
    q.includes(String(v.vendorId)) ||
    q.includes(v.phone)
  );

  if (matchedVendor) {
    return {
      content: `### 🏢 Onboarded Vendor Profile: ${matchedVendor.brandName} (ID: #${matchedVendor.vendorId})

- **Brand Name:** ${matchedVendor.brandName}
- **Contact Person (SPOC):** ${matchedVendor.spocName}
- **Phone / WhatsApp:** \`${matchedVendor.phone}\`
- **Email:** ${matchedVendor.email || 'N/A'}
- **Location:** ${matchedVendor.city}
- **Category:** ${matchedVendor.category}
- **Application ID:** \`${matchedVendor.applicationId}\`

**🔐 Login & Portal Access:**
- **Portal URL:** \`https://www.happymomentsindia.com/vendor-login\`
- **Username:** \`${matchedVendor.username}\`
- **Password:** \`${matchedVendor.password}\`
- **Database Status:** 🟢 \`is_onboarded: true\` • \`is_sample: false\` • \`verified: true\`

**📺 Tutorial & Onboarding Stage:**
- **Video Tutorial Sent:** \`https://www.happymomentsindia.com/vendor-tutorial\`
- **Current Status:** *${matchedVendor.profileStatus}*
- **Next Action:** When ${matchedVendor.spocName} replies with "Profile Updated", confirm packages and showcase them on the homepage.`,
      actions: [
        { label: `🔑 Manage #${matchedVendor.vendorId} Credentials`, tab: 'credentials', actionType: 'switch_tab' },
        { label: '🔍 View in Vendor Directory', tab: 'vendors', actionType: 'filter_real' }
      ]
    };
  }

  // 3. Real vs Sample Vendors Breakdown
  if (
    q.includes('sample') ||
    q.includes('real') ||
    q.includes('breakdown') ||
    q.includes('how many vendor') ||
    q.includes('total vendor') ||
    q.includes('stats')
  ) {
    return {
      content: `### 📊 Real vs Sample Vendors Breakdown

Here is the live distribution of vendors across Happy Moments:

| Metric | Count | Details |
| :--- | :--- | :--- |
| **Total Vendors** | **${totalVendors}** | Complete marketplace directory |
| **Sample Seed Vendors** | **983** | Labeled with orange \`Sample\` badge |
| **Real Onboarded Vendors** | **11** | **9 Approved Active Partners** + 2 legacy reviews |
| **Verified Vendors** | **913** | 904 Sample + 9 Real Verified Partners |
| **Active Cities** | **15+** | Hyderabad (primary), Bangalore, Chennai, etc. |

**Important Rules Enforced:**
1. 🏷️ **Sample Tag Guarantee:** The \`Sample\` badge is strictly restricted to the initial 983 seed vendors.
2. 🚫 **No Sample Tag on Onboarded Vendors:** All 9 newly approved onboarded vendors are saved with \`is_sample: false\` and \`is_onboarded: true\`.
3. 📁 **Excel & Filter Separation:** Admin can filter or export Real Vendors Only with 1-click.`,
      actions: [
        { label: '📊 View Real Vendors Only', tab: 'vendors', actionType: 'filter_real' },
        { label: '📑 Open Excel Spreadsheet', tab: 'excel', actionType: 'switch_tab' },
        { label: '📋 View Vendor Applications', tab: 'applications', actionType: 'switch_tab' }
      ]
    };
  }

  // 4. Default / General Executive Assistance
  return {
    content: `### 🐱 Momo Admin Cat at your service!

I have updated my platform intelligence with all **9 newly onboarded vendors**:
1. 📷 **The Film Frames** (#1073) – Hyderabad
2. 🎁 **Resin me up** (#1072) – Bangalore
3. 🎵 **SRI SAI EVENTS** (#1071) – Hyderabad
4. 🎪 **Meenakshi Events** (#1070) – Hyderabad
5. 🎈 **Isha Events** (#1069) – Hyderabad
6. 💄 **Tz.makeoversbymk** (#1068) – Hyderabad
7. 🌸 **Spyl Events** (#1067) – Bangalore
8. 🏰 **Eventaura productions** (#1064) – Hyderabad
9. 🎬 **Reels of Memories** (#1060) – Hyderabad

All 9 accounts have active database credentials and tutorial links dispatched. Once they reply *"Profile Updated"*, we are ready to feature their packages!

How else can I assist you?`,
    actions: [
      { label: '🌟 View 9 Onboarded Vendors', tab: 'vendors', actionType: 'filter_real' },
      { label: '🔑 Open Credentials Manager', tab: 'credentials', actionType: 'switch_tab' },
      { label: '📑 Export Onboarded Vendors to Excel', tab: 'excel', actionType: 'switch_tab' },
      { label: '📋 View Applications Tab', tab: 'applications', actionType: 'switch_tab' }
    ]
  };
}
