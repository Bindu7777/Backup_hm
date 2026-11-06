const crypto = require('crypto');
const { MomoStorage } = require('./momoStorage');
const { MomoMetaService } = require('./momoMetaService');
const { MomoAnalyticsService } = require('./momoAnalyticsService');
const { MomoIntelligenceService } = require('./momoIntelligenceService');
const { MomoReplyService } = require('./momoReplyService');

let activeJobId = null;

const MomoJobService = {
  /**
   * Start a refresh analysis background job
   */
  async startRefreshJob(adminId, ip, options = {}) {
    // Prevent duplicate concurrent runs
    if (activeJobId) {
      const existing = MomoStorage.getJob(activeJobId);
      if (existing && existing.status === 'running') {
        return {
          jobId: activeJobId,
          isAlreadyRunning: true,
          status: 'running',
          progress: existing.progress,
          currentStep: existing.currentStep
        };
      }
    }

    const jobId = `job_refresh_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    activeJobId = jobId;

    const initialJob = {
      id: jobId,
      status: 'running',
      progress: 5,
      currentStep: 'Initializing refresh job...',
      startedAt: new Date().toISOString(),
      adminId,
      error: null,
      result: null
    };

    MomoStorage.saveJob(jobId, initialJob);

    await MomoStorage.logAudit({
      actor: adminId || 'admin',
      action: 'refresh_started',
      resource_type: 'refresh_job',
      resource_id: jobId,
      outcome: 'success',
      ip_address: ip,
      metadata: { options }
    });

    // Execute asynchronously
    setImmediate(async () => {
      try {
        // Step 1: Instagram Sync
        MomoStorage.saveJob(jobId, { progress: 20, currentStep: 'Connecting to Meta Instagram API...' });
        const instagramResult = await MomoMetaService.fetchLiveMetrics();

        // Step 2: Website / Internal CRM Analytics
        MomoStorage.saveJob(jobId, { progress: 45, currentStep: 'Analyzing website & business inquiries...' });
        const periodType = options.periodType || '30d';
        const analyticsResult = await MomoAnalyticsService.fetchInternalMetrics(
          periodType,
          options.customStart,
          options.customEnd
        );

        // Step 3: Knowledge Base retrieval
        MomoStorage.saveJob(jobId, { progress: 65, currentStep: 'Loading verified business knowledge base...' });
        const knowledgeBase = await MomoStorage.getKnowledgeBase();

        // Step 4: Conversations & Customer Inquiries
        MomoStorage.saveJob(jobId, { progress: 75, currentStep: 'Processing customer conversations & checking policy...' });
        const existingConversations = await MomoStorage.getConversations();

        // Step 5: AI Intelligence Report Generation
        MomoStorage.saveJob(jobId, { progress: 85, currentStep: 'Synthesizing AI Business Intelligence Report...' });
        const report = await MomoIntelligenceService.generateBusinessReport({
          period: analyticsResult.period,
          businessMetrics: analyticsResult.business,
          instagramData: instagramResult,
          conversations: existingConversations,
          knowledgeBase
        });

        // Step 6: Finalize
        MomoStorage.saveJob(jobId, {
          progress: 100,
          status: 'completed',
          currentStep: 'Refresh complete! Data and insights updated.',
          completedAt: new Date().toISOString(),
          result: {
            reportId: report.id,
            timestamp: new Date().toISOString(),
            instagramStatus: instagramResult.connected ? 'connected' : 'disconnected',
            totalEnquiries: analyticsResult.business.totalEnquiries,
            wonDeals: analyticsResult.business.wonDeals,
            pendingReplies: analyticsResult.business.pendingReplies
          }
        });

        await MomoStorage.logAudit({
          actor: adminId || 'admin',
          action: 'refresh_completed',
          resource_type: 'refresh_job',
          resource_id: jobId,
          outcome: 'success',
          ip_address: ip,
          metadata: { reportId: report.id }
        });
      } catch (err) {
        console.error('Refresh job failed:', err);
        MomoStorage.saveJob(jobId, {
          status: 'failed',
          currentStep: 'Job encountered an error',
          error: err.message,
          failedAt: new Date().toISOString()
        });

        await MomoStorage.logAudit({
          actor: adminId || 'admin',
          action: 'refresh_failed',
          resource_type: 'refresh_job',
          resource_id: jobId,
          outcome: 'failure',
          ip_address: ip,
          metadata: { error: err.message }
        });
      } finally {
        if (activeJobId === jobId) {
          activeJobId = null;
        }
      }
    });

    return {
      jobId,
      status: 'running',
      progress: 5,
      currentStep: 'Initializing refresh job...'
    };
  },

  /**
   * Check status of a job
   */
  getJobStatus(jobId) {
    const job = MomoStorage.getJob(jobId);
    if (!job) {
      return { found: false, error: 'Job not found' };
    }
    return { found: true, ...job };
  }
};

module.exports = { MomoJobService };
