const express = require('express');
const router = express.Router();
const openMeteoService = require('../services/openMeteoService');
const geminiService = require('../services/geminiService');
const dataStore = require('../services/dataStore');

// Security helper: sanitize plain string inputs
function sanitizeString(str, maxLen = 500) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .trim()
    .slice(0, maxLen);
}

// GET /api/reports - Fetch all reports
router.get('/', (req, res) => {
  try {
    const region = req.query.region ? sanitizeString(req.query.region, 100) : undefined;
    const status = req.query.status ? sanitizeString(req.query.status, 50) : undefined;
    const country = req.query.country ? sanitizeString(req.query.country, 50) : undefined;
    const hazardOnly = req.query.hazardOnly === 'true';

    const reports = dataStore.getAllReports({ region, status, country, hazardOnly });
    res.json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve incident reports.' });
  }
});

// GET /api/reports/stats - Summary statistics for dashboard metrics
router.get('/stats', (req, res) => {
  try {
    const stats = dataStore.getSummaryStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve analytics stats.' });
  }
});

// GET /api/reports/stream - Real-time SSE stream for GovDashboard
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  dataStore.subscribe(res);

  // Send initial ping
  res.write(`data: ${JSON.stringify({ event: 'connected', time: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    dataStore.unsubscribe(res);
  });
});

// GET /api/reports/history - Fetch citizen history by device UUID
router.get('/history', (req, res) => {
  try {
    const deviceId = sanitizeString(req.query.deviceId, 120);
    if (!deviceId) {
      return res.status(400).json({ success: false, error: 'deviceId query parameter is required' });
    }
    const history = dataStore.getReportsByDeviceId(deviceId);
    res.json({ success: true, count: history.length, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve citizen history.' });
  }
});

// GET /api/reports/audit-logs - Fetch inter-agency dispatch audit trail
router.get('/audit-logs', (req, res) => {
  try {
    const auditLogs = dataStore.getAuditLogs();
    res.json({ success: true, count: auditLogs.length, data: auditLogs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve audit logs.' });
  }
});

// GET /api/reports/:id - Fetch single report
router.get('/:id', (req, res) => {
  try {
    const reportId = sanitizeString(req.params.id, 100);
    const report = dataStore.getReportById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch report details.' });
  }
});

// POST /api/reports/pollution - Core Citizen Capture Submission Flow
router.post('/pollution', async (req, res) => {
  try {
    const {
      image,
      lat = 31.634,
      lng = 74.872,
      note = '',
      voiceNote = '',
      region = 'Punjab Border Corridor',
      country = 'India',
      reporter = 'Citizen Sensor',
      deviceId,
      source_platform,
      category = 'stubble'
    } = req.body;

    // Strict Image validation
    if (!image || typeof image !== 'string' || image.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Pollution event image is required' });
    }
    if (image.length > 15000000) {
      return res.status(413).json({ success: false, error: 'Image size exceeds the maximum 10MB limit.' });
    }

    // Strict GPS Coordinate validation (bounds check)
    const numericLat = parseFloat(lat);
    const numericLng = parseFloat(lng);

    if (isNaN(numericLat) || numericLat < -90 || numericLat > 90) {
      return res.status(400).json({
        success: false,
        error: 'Invalid latitude. Must be a valid decimal number between -90 and 90.'
      });
    }

    if (isNaN(numericLng) || numericLng < -180 || numericLng > 180) {
      return res.status(400).json({
        success: false,
        error: 'Invalid longitude. Must be a valid decimal number between -180 and 180.'
      });
    }

    // Sanitize user text inputs against XSS and injection
    const cleanNote = sanitizeString(note, 1000);
    const cleanVoiceNote = sanitizeString(voiceNote, 1000);
    const cleanCategory = sanitizeString(category, 50) || 'stubble';
    const cleanRegion = sanitizeString(region, 100) || 'Physical GPS Sensor Region';
    const cleanCountry = sanitizeString(country, 60) || 'India';
    const cleanReporter = sanitizeString(reporter, 80) || 'Citizen Sensor';
    const cleanDeviceId = deviceId ? sanitizeString(deviceId, 120) : undefined;
    const cleanPlatform = sanitizeString(source_platform, 40) || 'pwa_web';

    // 1. Fetch live meteorological context from Open-Meteo
    const weather = await openMeteoService.getCurrentWeather(numericLat, numericLng);

    // 2. Multimodal AI Analysis with Google Gemini Vision
    const aiResult = await geminiService.analyzePollutionIncident({
      imageBase64: image,
      weather,
      userNote: `${cleanNote} ${cleanVoiceNote}`.trim(),
      location: { lat: numericLat, lng: numericLng },
      category: cleanCategory
    });

    // 3. Construct and store verified incident record
    const reportPayload = {
      title: `${aiResult.source_classification} Detected`,
      description: cleanNote || `Citizen observation with automated Gemini forensic classification.`,
      lat: numericLat,
      lng: numericLng,
      region: cleanRegion,
      country: cleanCountry,
      imageUrl: image.startsWith('http') ? image : image,
      weather,
      aiResult,
      voiceNote: cleanVoiceNote || undefined,
      reporter: cleanReporter,
      deviceId: cleanDeviceId,
      source_platform: cleanPlatform,
      status: aiResult.immediate_health_hazard ? 'verified' : 'pending'
    };

    const savedReport = dataStore.createReport(reportPayload);

    res.status(201).json({
      success: true,
      message: 'Pollution report processed by Gemini Vision and logged to federated grid.',
      data: savedReport
    });
  } catch (error) {
    console.error('[Reports Route] Error processing pollution report:', error.message);
    res.status(500).json({ success: false, error: 'An error occurred while processing forensic analysis.' });
  }
});

// PATCH /api/reports/:id/status - Update dispatch / verification status
router.patch('/:id/status', (req, res) => {
  try {
    const reportId = sanitizeString(req.params.id, 100);
    const { status, targetAgency, authorizedBy } = req.body;

    if (!status || !['pending', 'verified', 'dispatched', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status. Must be pending, verified, dispatched, or resolved.' });
    }

    const cleanTargetAgency = targetAgency ? sanitizeString(targetAgency, 150) : undefined;
    const cleanAuthorizedBy = authorizedBy ? sanitizeString(authorizedBy, 150) : undefined;

    const updated = dataStore.updateReportStatus(reportId, status, {
      targetAgency: cleanTargetAgency,
      authorizedBy: cleanAuthorizedBy
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update report status.' });
  }
});

// POST /api/reports/:id/upvote
router.post('/:id/upvote', (req, res) => {
  try {
    const reportId = sanitizeString(req.params.id, 100);
    const updated = dataStore.upvoteReport(reportId);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to register citizen verification.' });
  }
});

module.exports = router;
