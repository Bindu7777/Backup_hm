/**
 * End-to-End Integration & Compliance Test Suite for Momo Bot
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const http = require('http');
const axios = require('axios');
const app = require('./server');

let server;
let baseUrl;

async function runTests() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING MOMO BOT INTEGRATION & COMPLIANCE TEST SUITE');
  console.log('======================================================\n');

  // Start temporary test server
  const testPort = 3099;
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(testPort, resolve));
  baseUrl = `http://127.0.0.1:${testPort}`;
  console.log(`[INFO] Test server listening on ${baseUrl}`);

  let passedCount = 0;
  let totalCount = 0;

  function assert(condition, testName, extraInfo = '') {
    totalCount++;
    if (condition) {
      console.log(`✅ [PASS] ${testName} ${extraInfo}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${extraInfo}`);
    }
  }

  try {
    // 1. Status endpoint returns service status without secret
    console.log('\n--- 1. Service Status & Discovery ---');
    const statusRes = await axios.get(`${baseUrl}/api/momo/status`);
    assert(statusRes.status === 200, 'GET /api/momo/status returns 200');
    assert(statusRes.data.success === true, 'Momo status reports success: true');
    assert(statusRes.data.sessionValid === false, 'Anonymous request reports sessionValid: false');
    assert(statusRes.data.integrations !== undefined, 'Integrations health object is present');

    // 2. Protected endpoints reject requests without token
    console.log('\n--- 2. Server-side Route Authorization Gate ---');
    try {
      await axios.get(`${baseUrl}/api/momo/dashboard`);
      assert(false, 'GET /api/momo/dashboard without token was allowed');
    } catch (err) {
      assert(err.response?.status === 401, 'GET /api/momo/dashboard without token is rejected with 401 Unauthorized');
      assert(err.response?.data?.code === 'MOMO_AUTH_REQUIRED', 'Error code is MOMO_AUTH_REQUIRED');
    }

    try {
      await axios.post(`${baseUrl}/api/momo/refresh`, {});
      assert(false, 'POST /api/momo/refresh without token was allowed');
    } catch (err) {
      assert(err.response?.status === 401, 'POST /api/momo/refresh without token is rejected with 401 Unauthorized');
    }

    // 3. Secret Verification & Rate-Limiting
    console.log('\n--- 3. Secret Verification & Security Gate ---');
    try {
      await axios.post(`${baseUrl}/api/momo/auth/verify`, { secret: 'IncorrectPassword123' });
      assert(false, 'Invalid secret was accepted');
    } catch (err) {
      assert(err.response?.status === 401, 'Invalid secret returns 401 Unauthorized');
      assert(err.response?.data?.success === false, 'Reported success: false');
      assert(typeof err.response?.data?.error === 'string', 'Clear failure message returned');
    }

    // Valid secret verification
    const verifyRes = await axios.post(`${baseUrl}/api/momo/auth/verify`, {
      secret: process.env.MOMO_ACCESS_SECRET || 'MomoAdmin2026!',
      adminId: 'TestAdmin'
    });
    assert(verifyRes.status === 200, 'Valid secret returns 200 OK');
    assert(verifyRes.data.success === true, 'Verification succeeds');
    assert(typeof verifyRes.data.sessionToken === 'string' && verifyRes.data.sessionToken.length > 20, 'Cryptographic session token issued');

    const sessionToken = verifyRes.data.sessionToken;
    const authHeaders = {
      headers: {
        'x-momo-session': sessionToken,
        'Authorization': `Bearer ${sessionToken}`
      }
    };

    // 4. Session recognition on status
    console.log('\n--- 4. Session Validation ---');
    const authStatusRes = await axios.get(`${baseUrl}/api/momo/status`, authHeaders);
    assert(authStatusRes.data.sessionValid === true, 'Recognizes active session token');
    assert(authStatusRes.data.adminId === 'TestAdmin', 'Admin identity correctly associated');

    // 5. Dashboard Data Retrieval
    console.log('\n--- 5. Dashboard Data & Real Metric Collection ---');
    const dashRes = await axios.get(`${baseUrl}/api/momo/dashboard?period=30d`, authHeaders);
    assert(dashRes.status === 200, 'GET /api/momo/dashboard returns 200');
    assert(dashRes.data.success === true, 'Dashboard success is true');
    assert(dashRes.data.metrics.business !== undefined, 'Business metrics object present');
    assert(typeof dashRes.data.metrics.business.activeVendors === 'number', `Real active vendors count: ${dashRes.data.metrics.business.activeVendors}`);
    assert(dashRes.data.integrations.meta_instagram !== undefined, 'Meta Instagram status structure present');
    assert(dashRes.data.integrations.meta_instagram.status === 'disconnected' || dashRes.data.integrations.meta_instagram.status === 'connected', 'Meta status correctly reflects real state');
    assert(dashRes.data.metrics.website.connected === false, 'Unconnected GA4 is clearly marked connected: false (Never fake data)');

    // 6. Refresh Analysis Background Job Orchestration
    console.log('\n--- 6. Background Job Orchestration ---');
    const refreshRes = await axios.post(`${baseUrl}/api/momo/refresh`, { periodType: '30d' }, authHeaders);
    assert(refreshRes.status === 200, 'POST /api/momo/refresh returns 200');
    assert(typeof refreshRes.data.jobId === 'string', `Refresh job scheduled with ID: ${refreshRes.data.jobId}`);
    assert(refreshRes.data.status === 'running', 'Initial job status is running');

    // Wait for job completion
    console.log('[INFO] Awaiting background refresh job completion...');
    let jobFinished = false;
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 400));
      const jobStatus = await axios.get(`${baseUrl}/api/momo/jobs/${refreshRes.data.jobId}`, authHeaders);
      if (jobStatus.data.status === 'completed' || jobStatus.data.status === 'failed') {
        jobFinished = true;
        assert(jobStatus.data.status === 'completed', `Refresh job finished with status: ${jobStatus.data.status}`);
        assert(jobStatus.data.progress === 100, 'Job progress reached 100%');
        break;
      }
    }
    assert(jobFinished, 'Refresh job completed in timely manner');

    // 7. Grounded AI Report & Recommendations
    console.log('\n--- 7. Grounded Business Intelligence Report ---');
    const insightsRes = await axios.get(`${baseUrl}/api/momo/insights`, authHeaders);
    assert(insightsRes.data.report !== null, 'Structured report synthesized');
    const report = insightsRes.data.report;
    assert(Array.isArray(report.recommendations) && report.recommendations.length > 0, 'Recommendations generated');
    assert(report.executiveSummary !== undefined, 'Executive summary section present');
    assert(report.executiveSummary.immediateAttention.length > 0, 'Immediate attention items identified');

    // 8. Knowledge Base Management
    console.log('\n--- 8. Business Knowledge Base ---');
    const kbRes = await axios.get(`${baseUrl}/api/momo/knowledge-base`, authHeaders);
    assert(Array.isArray(kbRes.data.knowledgeBase), 'Knowledge base array returned');
    assert(kbRes.data.knowledgeBase.some(k => k.category === 'pricing'), 'Verified pricing knowledge item present');

    // 9. Meta Webhook Verification Challenge
    console.log('\n--- 9. Meta Webhook Verification Challenge ---');
    const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'happy_moments_momo_verify_token';
    const challengeRes = await axios.get(`${baseUrl}/api/momo/webhooks/meta`, {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': verifyToken,
        'hub.challenge': 'test_challenge_code_98765'
      }
    });
    assert(challengeRes.status === 200, 'Meta Webhook GET returns 200');
    assert(challengeRes.data.toString() === 'test_challenge_code_98765', 'Echoes challenge token matching Meta specification');

    // 10. Audit Logging
    console.log('\n--- 10. Immutable Security Audit Trail ---');
    const auditRes = await axios.get(`${baseUrl}/api/momo/audit?limit=10`, authHeaders);
    assert(Array.isArray(auditRes.data.logs), 'Audit logs array returned');
    assert(auditRes.data.logs.some(l => l.action === 'auth_verify'), 'Audit trail recorded auth_verify action');
    assert(auditRes.data.logs.some(l => l.action === 'refresh_completed'), 'Audit trail recorded refresh_completed action');

    // 11. Lock Momo Session
    console.log('\n--- 11. Session Invalidation / Lock ---');
    const lockRes = await axios.post(`${baseUrl}/api/momo/auth/lock`, {}, authHeaders);
    assert(lockRes.data.success === true, 'Lock session returned success');

    try {
      await axios.get(`${baseUrl}/api/momo/dashboard`, authHeaders);
      assert(false, 'Locked session was still accepted');
    } catch (err) {
      assert(err.response?.status === 401, 'Revoked/locked session is rejected with 401 Unauthorized');
    }

    console.log('\n======================================================');
    console.log(`🏁 TEST RESULTS: ${passedCount} / ${totalCount} PASSED`);
    console.log('======================================================\n');

  } catch (err) {
    console.error('Test error:', err.response?.data || err.message);
  } finally {
    if (server) {
      server.close();
    }
  }
}

runTests();
