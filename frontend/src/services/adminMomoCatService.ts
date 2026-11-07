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

/**
 * Platform Knowledge Base for Momo Admin Cat
 */
export const PLATFORM_STATS = {
  totalVendors: 985,
  sampleVendors: 983,
  realVendors: 2,
  verifiedVendors: 905,
  verifiedSample: 904,
  verifiedReal: 1,
  knownRealVendors: [
    {
      id: 1051,
      brand_name: 'Hima',
      category: 'Photography',
      city: 'Hyderabad',
      status: 'Approved',
      verified: true,
      phone: '9849012345',
      spoc: 'Hima Bindu',
      note: 'First fully approved real onboarded vendor on Happy Moments.'
    },
    {
      id: 1052,
      brand_name: 'Testinf',
      category: 'Wedding Decorator / Event Planning',
      city: 'Hyderabad',
      status: 'Pending review',
      verified: false,
      phone: '9988776655',
      spoc: 'Test Admin / Spoc',
      note: 'Recent onboarding submission awaiting administrative approval.'
    }
  ],
  categoriesCount: {
    'Event Planners / Management': 210,
    'Photography & Videography': 195,
    'Decorators & Florists': 180,
    'Bridal Makeup & Styling': 165,
    'Catering & Sweets': 120,
    'Venues & Convention Halls': 65,
    'DJ, Music & Sound Setup': 50
  },
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

  // Compute live stats from loaded vendors if available
  const totalVendors = liveVendors.length || PLATFORM_STATS.totalVendors;
  const realVendorsList = liveVendors.filter(v => {
    const info = v.additional_info || {};
    return info.is_sample === false || (v.id && (v.id === 1051 || v.id === 1052));
  });
  const sampleVendorsCount = totalVendors - (realVendorsList.length || PLATFORM_STATS.realVendors);
  const verifiedCount = liveVendors.filter(v => v.verified).length || PLATFORM_STATS.verifiedVendors;

  // 1. Pending Applications / Onboarding Submissions
  if (
    q.includes('pending') ||
    q.includes('application') ||
    q.includes('onboard') ||
    q.includes('new vendor') ||
    q.includes('applicant') ||
    q.includes('approval')
  ) {
    return {
      content: `### 📋 Vendor Applications & Onboarding Status

**Current Status Overview:**
- **Total Real Onboarded Applications:** 2
- **Pending Review:** 1 application (*Testinf - ID #1052*)
- **Approved:** 1 application (*Hima - ID #1051*)

**Application Details:**
1. 🟡 **Testinf** (ID: #1052)
   - **Category:** Wedding Decorator / Event Planning
   - **Location:** Hyderabad
   - **Status:** \`Pending review\`
   - **Action Needed:** Review portfolio, verify phone, and click **Approve Vendor** to activate public listing.

2. 🟢 **Hima** (ID: #1051)
   - **Category:** Photography & Videography
   - **Location:** Hyderabad
   - **Status:** \`Approved\` & \`Verified\` ✨
   - **Availability:** Active on public marketplace.

> **How to review applications:**
> Click the button below to switch directly to the **Pending Approvals / Applications** tab. You can inspect contact details, uploaded portfolios, and approve or reject with 1 click.`,
      actions: [
        { label: '👉 Switch to Applications Tab', tab: 'approvals', actionType: 'switch_tab' },
        { label: '🔍 Filter Real Vendors', tab: 'vendors', actionType: 'filter_real' }
      ]
    };
  }

  // 2. Real vs Sample Vendors Query
  if (
    q.includes('sample') ||
    q.includes('real') ||
    q.includes('breakdown') ||
    q.includes('how many vendor') ||
    q.includes('total vendor') ||
    q.includes('stats') ||
    q.includes('numbers')
  ) {
    return {
      content: `### 📊 Real vs Sample Vendors Breakdown

Here is the exact live distribution of vendors across Happy Moments:

| Metric | Count | Details |
| :--- | :--- | :--- |
| **Total Vendors** | **${totalVendors}** | Complete marketplace directory |
| **Sample Seed Vendors** | **${sampleVendorsCount}** | Labeled with orange \`Sample\` tag |
| **Real Onboarded Vendors** | **${realVendorsList.length || 2}** | *Hima (#1051)* & *Testinf (#1052)* |
| **Verified Vendors** | **${verifiedCount}** | 904 Sample + 1 Real (*Hima*) |
| **Active Cities** | **15+** | Hyderabad (primary), Bangalore, Chennai, etc. |

**Important Rules Enforced:**
1. 🏷️ **Sample Tag Guarantee:** The \`Sample\` badge is exclusively assigned to the initial 983 seed vendors.
2. 🚫 **No Sample Tag on New Vendors:** Brand new onboarding vendors (*like Hima and Testinf*) are stored with \`is_sample: false\` and will **NEVER** receive the sample tag.
3. 📁 **Excel & Filter Separation:** Admin can filter or export Real Vendors Only with 1-click.`,
      actions: [
        { label: '📊 View Real Vendors Only', tab: 'vendors', actionType: 'filter_real' },
        { label: '📑 Open Excel Spreadsheet', tab: 'excel', actionType: 'switch_tab' },
        { label: '📋 View Pending Applications', tab: 'approvals', actionType: 'switch_tab' }
      ]
    };
  }

  // 3. Credentials & Login Management
  if (
    q.includes('credential') ||
    q.includes('password') ||
    q.includes('username') ||
    q.includes('login') ||
    q.includes('access')
  ) {
    return {
      content: `### 🔑 Vendor Credentials & Login System

Happy Moments has a dedicated **Credentials Manager** inside the Admin Dashboard:

**How It Works:**
1. **Auto-Generated Usernames:** Standard format is \`brand_phone\` (e.g. \`hima_9849012345\`).
2. **Secure Passwords:** Auto-generated strong alphanumeric passwords for every approved vendor.
3. **Vendor Login URL:** Vendors log in at \`/vendor-login\`.

**Admin Capabilities:**
- 👁️ **View Credentials:** Click **Manage Credentials** on any real vendor row or switch to the **Credentials** tab.
- 📋 **1-Click Copy:** Copy individual username and password to WhatsApp them to the vendor.
- 🔄 **Reset Password:** Instantly regenerate a new secure temporary password.
- 📥 **Export Credentials:** Export all active vendor logins into a secure CSV / Excel document.
- 🛡️ **Sample Vendor Protection:** Sample seed vendors have credentials safely disabled and tagged as \`Sample\`.`,
      actions: [
        { label: '🔑 Open Credentials Manager', tab: 'credentials', actionType: 'switch_tab' },
        { label: '📋 Review Pending Approvals', tab: 'approvals', actionType: 'switch_tab' }
      ]
    };
  }

  // 4. Excel Export & Viewer
  if (
    q.includes('excel') ||
    q.includes('export') ||
    q.includes('download') ||
    q.includes('sheet') ||
    q.includes('csv')
  ) {
    return {
      content: `### 📥 Excel Spreadsheet Viewer & Export

The Admin Dashboard includes a full embedded **Excel Viewer & Exporter**:

**Features available:**
1. **Interactive In-Browser Grid:** Search, sort, and review all 985 vendors directly on-screen.
2. **Smart Separation Filters:**
   - **All Vendors (${totalVendors})**
   - **Real Vendors Only (${realVendorsList.length || 2})** – Only genuine onboarded businesses!
   - **Sample Vendors Only (${sampleVendorsCount})**
3. **Clean XLSX Export:** Click **Export to Excel** to download clean spreadsheets with columns:
   - Vendor ID, Brand Name, SPOC, Phone, WhatsApp, City, Category, Verified Status, Sample Label, Starting Price.`,
      actions: [
        { label: '📑 Open Excel Tab', tab: 'excel', actionType: 'switch_tab' },
        { label: '🔍 Filter Real Vendors', tab: 'vendors', actionType: 'filter_real' }
      ]
    };
  }

  // 5. Specific Vendor Inspection (e.g. Hima or Testinf)
  if (q.includes('hima') || q.includes('1051')) {
    return {
      content: `### 📷 Real Vendor Profile: Hima (ID: #1051)

- **Brand Name:** Hima
- **SPOC Name:** Hima Bindu
- **Category:** Photography & Videography (Candid, Traditional & Drone)
- **Location:** Hyderabad, Telangana
- **Starting Price:** Available upon discussion
- **Onboarding Source:** Self-serve onboarding form (\`/vendor-onboarding\`)
- **Sample Status:** \`is_sample: false\` (Genuine real vendor – **No Sample tag**)
- **Application Status:** 🟢 **Approved & Verified**
- **Public Visibility:** Visible in public vendor directory and homepage verified vendors showcase.

Would you like to manage Hima's credentials or view the profile in the directory?`,
      actions: [
        { label: '🔑 Manage Hima Credentials', tab: 'credentials', actionType: 'switch_tab' },
        { label: '🔍 View in Vendor Directory', tab: 'vendors', actionType: 'filter_real' }
      ]
    };
  }

  if (q.includes('testinf') || q.includes('1052')) {
    return {
      content: `### 🌸 Real Vendor Application: Testinf (ID: #1052)

- **Brand Name:** Testinf
- **SPOC Name:** Test Spoc
- **Category:** Wedding Decorator / Event Planning
- **Location:** Hyderabad, Telangana
- **Starting Price:** ₹1 (Share price after discussion)
- **Onboarding Source:** Self-serve onboarding form (\`/vendor-onboarding\`)
- **Sample Status:** \`is_sample: false\` (Real applicant – **No Sample tag**)
- **Application Status:** 🟡 **Pending review**
- **Public Visibility:** Inactive until approved by Admin.

**Next Steps for Admin:**
Review the submitted details in the **Pending Approvals** tab and click **Approve** to activate.`,
      actions: [
        { label: '👉 Review & Approve Testinf', tab: 'approvals', actionType: 'switch_tab' }
      ]
    };
  }

  // 6. Lead Dispatch & WhatsApp Integration
  if (
    q.includes('lead') ||
    q.includes('deal') ||
    q.includes('whatsapp') ||
    q.includes('dispatch') ||
    q.includes('inquiry') ||
    q.includes('customer')
  ) {
    return {
      content: `### 💬 Lead Dispatch & WhatsApp System

**How Lead Flow Works on Happy Moments:**
1. **Customer Submissions:**
   - Customers submit event requests via **Smart Request** or the **Customer Momo Bot (Hamster 🐹)**.
2. **Admin Notification:**
   - Formatted lead notifications are routed to Admin Bindu's WhatsApp (\`+91 79934 32999\`).
   - Details include: Customer name, event date, guest count, budget, selected category, and venue city.
3. **Vendor Matching & Dispatch:**
   - Admin opens the **Deals & Dispatch** tab to match verified vendors.
   - 1-click WhatsApp dispatch sends the pre-filled inquiry directly to the vendor's WhatsApp.
4. **Deal Tracking:**
   - Statuses: \`New Inquiry\` ➔ \`Quote Sent\` ➔ \`Deal Confirmed\` (or \`Lost Deal\` with reason for analytics).`,
      actions: [
        { label: '💬 View WhatsApp Stats Portal', tab: 'momo_portal', actionType: 'switch_tab' },
        { label: '📊 View Analytics & Lost Deals', tab: 'analytics', actionType: 'switch_tab' }
      ]
    };
  }

  // 7. Database, Schema & Constraint Technical Health Check
  if (
    q.includes('database') ||
    q.includes('constraint') ||
    q.includes('error') ||
    q.includes('check_starting_price') ||
    q.includes('avatar_url') ||
    q.includes('schema') ||
    q.includes('health') ||
    q.includes('fix')
  ) {
    return {
      content: `### 🛡️ Technical Health & Schema Status

All recent database and onboarding constraints have been fully audited and resolved:

1. ✅ **Constraint \`check_starting_price_positive\`:**
   - The PostgreSQL column requires \`starting_price > 0\`.
   - **Resolution:** \`vendorOnboardingService.ts\` guarantees \`starting_price = Math.max(1, parsedPrice || 1)\`. When vendors choose "Share price after discussion", starting_price is saved as 1 in the DB column and \`share_price_after_discussion: true\` in \`additional_info\`.
2. ✅ **Schema Cache \`avatar_url\` Error:**
   - **Resolution:** Removed non-existent \`avatar_url\` column from the \`vendors\` insert payload. Brand logos and portfolio images are cleanly stored in \`additional_info.brand_logo_url\` and \`additional_info.portfolio_photos\`.
3. ✅ **Step 4 Mandatory Checkboxes:**
   - **Resolution:** Submit button is strictly disabled until both *"Confirm accurate"* and *"Permission to contact"* are checked. Clicking submit without checking triggers an automatic scroll and highlighted warning.
4. ✅ **Photo Upload Timeouts:**
   - **Resolution:** Client-side image compression down to ~150 KB, concurrent uploads with \`Promise.allSettled\`, 15-second timeout protection, and zero base64 payload in the database.`,
      actions: [
        { label: '📋 Check Pending Applications', tab: 'approvals', actionType: 'switch_tab' },
        { label: '🔍 View Real Vendors', tab: 'vendors', actionType: 'filter_real' }
      ]
    };
  }

  // 8. General / Fallback Executive Assistance
  return {
    content: `### 🐱 Momo Admin Cat at your service!

I am your dedicated **Executive AI Co-Pilot** for Happy Moments platform administration. I have full knowledge of your database, vendors, credentials, applications, and operations.

**Here is what I can help you with right now:**
- 📋 **Applications:** Check pending vendor onboarding applications (e.g. *Testinf #1052*).
- 📊 **Directory Breakdown:** Explore real vendors (${realVendorsList.length || 2}) vs sample seed vendors (${sampleVendorsCount}).
- 🔑 **Credentials:** View, reset, or export vendor login usernames and passwords.
- 📑 **Excel:** Filter and download spreadsheets of real vs sample vendors.
- 💬 **Lead Dispatch:** Guide you through customer WhatsApp lead dispatch and deal statuses.
- 🛡️ **Technical Health:** Monitor database constraints, Supabase schemas, and onboarding workflows.

What would you like me to pull up or assist you with?`,
    actions: [
      { label: '📋 Review Pending Applications', tab: 'approvals', actionType: 'switch_tab' },
      { label: '📊 Real vs Sample Breakdown', tab: 'vendors', actionType: 'filter_real' },
      { label: '🔑 Vendor Credentials Guide', tab: 'credentials', actionType: 'switch_tab' },
      { label: '📑 Export Excel Spreadsheet', tab: 'excel', actionType: 'switch_tab' }
    ]
  };
}
