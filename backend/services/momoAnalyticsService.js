const { supabase } = require('../config/supabase');
const { MomoStorage } = require('./momoStorage');

// Short in-memory cache for metrics to keep dashboard loads instantaneous
const metricsCache = new Map();
const METRICS_CACHE_TTL = 20 * 1000; // 20 seconds

const MomoAnalyticsService = {
  /**
   * Get GA4 status and setup requirements
   */
  async getGA4Status() {
    const integrations = await MomoStorage.getIntegrations();
    const ga = integrations.google_analytics || {};

    const propertyId = process.env.GA4_PROPERTY_ID || ga.property_id;
    const isConnected = Boolean(propertyId && (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GA4_SERVICE_ACCOUNT_JSON));

    const checklist = [
      {
        id: 'ga4_property',
        title: 'Google Analytics 4 Property ID',
        description: 'Set GA4_PROPERTY_ID (e.g. 123456789) in environment variables',
        status: propertyId ? 'ready' : 'missing'
      },
      {
        id: 'service_account',
        title: 'Google Cloud Service Account with Viewer Role',
        description: 'Provide JSON key via GOOGLE_APPLICATION_CREDENTIALS or GA4_SERVICE_ACCOUNT_JSON',
        status: process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GA4_SERVICE_ACCOUNT_JSON ? 'ready' : 'missing'
      },
      {
        id: 'website_tag',
        title: 'Global Site Tag (gtag.js) on Website',
        description: 'Ensure Google tag is placed on happymomentsindia.com',
        status: process.env.GA4_MEASUREMENT_ID ? 'ready' : 'pending'
      }
    ];

    return {
      provider: 'google_analytics',
      status: isConnected ? 'connected' : 'disconnected',
      propertyId: propertyId || null,
      lastSyncAt: ga.last_sync_at || null,
      checklist,
      documentationUrl: 'https://developers.google.com/analytics/devguides/reporting/data/v1'
    };
  },

  /**
   * Fetch internal database business metrics from Supabase
   */
  async fetchInternalMetrics(periodType = '30d', customStart = null, customEnd = null) {
    const cacheKey = `${periodType}_${customStart || ''}_${customEnd || ''}`;
    const cached = metricsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < METRICS_CACHE_TTL)) {
      return cached.data;
    }
    let now = new Date();
    let startDate = new Date();
    let prevStartDate = new Date();
    let prevEndDate = new Date();

    if (periodType === '7d') {
      startDate.setDate(now.getDate() - 7);
      prevEndDate = new Date(startDate.getTime());
      prevStartDate.setDate(prevEndDate.getDate() - 7);
    } else if (periodType === '30d') {
      startDate.setDate(now.getDate() - 30);
      prevEndDate = new Date(startDate.getTime());
      prevStartDate.setDate(prevEndDate.getDate() - 30);
    } else if (periodType === 'custom' && customStart && customEnd) {
      startDate = new Date(customStart);
      now = new Date(customEnd);
      const diffMs = now.getTime() - startDate.getTime();
      prevEndDate = new Date(startDate.getTime());
      prevStartDate = new Date(prevEndDate.getTime() - diffMs);
    } else {
      startDate.setDate(now.getDate() - 30);
      prevEndDate = new Date(startDate.getTime());
      prevStartDate.setDate(prevEndDate.getDate() - 30);
    }

    // 1. Fetch inquiries from contacted_vendors
    let contacts = [];
    let prevContacts = [];
    try {
      const { data, error } = await supabase
        .from('contacted_vendors')
        .select('*')
        .order('contacted_at', { ascending: false });

      if (!error && data) {
        contacts = data.filter(c => {
          const t = new Date(c.contacted_at || c.created_at).getTime();
          return t >= startDate.getTime() && t <= now.getTime();
        });
        prevContacts = data.filter(c => {
          const t = new Date(c.contacted_at || c.created_at).getTime();
          return t >= prevStartDate.getTime() && t < startDate.getTime();
        });
      }
    } catch (e) {
      console.error('Error querying contacted_vendors in MomoAnalyticsService:', e);
    }

    // 2. Fetch total verified vendors
    let vendorCount = 0;
    let categoriesBreakdown = {};
    try {
      const { data: vendorsData, error: vErr } = await supabase
        .from('vendors')
        .select('vendor_id, brand_name, category, categories, verified');

      if (!vErr && vendorsData) {
        vendorCount = vendorsData.length;
        vendorsData.forEach(v => {
          const cats = Array.isArray(v.category) ? v.category : [v.category || 'General'];
          cats.forEach(cat => {
            categoriesBreakdown[cat] = (categoriesBreakdown[cat] || 0) + 1;
          });
        });
      }
    } catch (ve) {
      console.error('Error querying vendors count:', ve);
    }

    // 3. Compute business inquiry metrics
    const totalEnquiries = contacts.length;
    const prevTotalEnquiries = prevContacts.length;
    const enquiryGrowthPct = prevTotalEnquiries > 0
      ? Math.round(((totalEnquiries - prevTotalEnquiries) / prevTotalEnquiries) * 100)
      : null;

    const wonStatuses = ['Deal Confirmed', 'Deal Made', 'Advance Received', 'Service Completed', 'Payment Settled', 'Approved'];
    const wonDeals = contacts.filter(c => wonStatuses.includes(c.vendor_status)).length;
    const prevWonDeals = prevContacts.filter(c => wonStatuses.includes(c.vendor_status)).length;
    const winRate = totalEnquiries > 0 ? Math.round((wonDeals / totalEnquiries) * 100) : 0;

    const lostStatuses = ['Lost', 'Cancelled', 'Closed', 'Declined', 'Not Interested'];
    const lostDeals = contacts.filter(c => lostStatuses.includes(c.vendor_status)).length;

    const pendingReplies = contacts.filter(c => c.vendor_status === 'Contacted' || !c.vendor_status).length;
    const highIntentLeads = contacts.filter(c => 
      c.notes && (c.notes.toLowerCase().includes('urgent') || c.notes.toLowerCase().includes('budget') || c.notes.toLowerCase().includes('wedding'))
    ).length;

    // Daily breakdown for charts
    const dailyMap = {};
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dayKey = d.toISOString().split('T')[0];
      dailyMap[dayKey] = { date: dayKey, inquiries: 0, won: 0, lost: 0 };
    }
    contacts.forEach(c => {
      const day = (c.contacted_at || c.created_at || '').split('T')[0];
      if (dailyMap[day]) {
        dailyMap[day].inquiries += 1;
        if (wonStatuses.includes(c.vendor_status)) dailyMap[day].won += 1;
        if (lostStatuses.includes(c.vendor_status)) dailyMap[day].lost += 1;
      }
    });

    return {
      period: {
        type: periodType,
        start: startDate.toISOString(),
        end: now.toISOString(),
        previousStart: prevStartDate.toISOString(),
        previousEnd: prevEndDate.toISOString()
      },
      business: {
        totalEnquiries,
        enquiryGrowthPct,
        wonDeals,
        lostDeals,
        winRate,
        pendingReplies,
        highIntentLeads,
        activeVendors: vendorCount,
        categoriesBreakdown,
        dailyTrend: Object.values(dailyMap)
      },
      website: {
        connected: false,
        source: 'Google Analytics 4',
        message: 'Google Analytics 4 is not connected. Configure GA4_PROPERTY_ID to see web visitors and session acquisition sources.',
        users: null,
        sessions: null,
        pageViews: null,
        trafficSources: [],
        topLandingPages: []
      }
    };

    metricsCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  }
};

module.exports = { MomoAnalyticsService };
