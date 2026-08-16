const express = require('express');
const router = express.Router();
const openMeteoService = require('../services/openMeteoService');
const geminiService = require('../services/geminiService');
const dataStore = require('../services/dataStore');

// GET /api/reports - Fetch all reports
router.get('/', (req, res) => {
  try {
    const { region, status, country, hazardOnly } = req.query;
    const reports = dataStore.getAllReports({ region, status, country, hazardOnly });
    res.json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/reports/stats - Summary statistics for dashboard metrics
router.get('/stats', (req, res) => {
  try {
    const stats = dataStore.getSummaryStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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

// GET /api/reports/:id - Fetch single report
router.get('/:id', (req, res) => {
  try {
    const report = dataStore.getReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/reports/pollution - Core Citizen Capture Submission Flow
router.post('/pollution', async (req, res) => {
  try {
    const {
      image, // base64 string or data URL
      lat = 31.634,
      lng = 74.872,
      note = '',
      voiceNote = '',
      region = 'Punjab Border Corridor',
      country = 'India',
      reporter = 'Citizen Sensor'
    } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, error: 'Pollution event image is required' });
    }

    const numericLat = parseFloat(lat);
    const numericLng = parseFloat(lng);

    // 1. Fetch live meteorological context from Open-Meteo
    const weather = await openMeteoService.getCurrentWeather(numericLat, numericLng);

    // 2. Multimodal AI Analysis with Google Gemini Vision
    const aiResult = await geminiService.analyzePollutionIncident({
      imageBase64: image,
      weather,
      userNote: `${note} ${voiceNote}`.trim(),
      location: { lat: numericLat, lng: numericLng }
    });

    // 3. Construct and store verified incident record
    const reportPayload = {
      title: `${aiResult.source_classification} Detected`,
      description: note || `Citizen observation with automated Gemini forensic classification.`,
      lat: numericLat,
      lng: numericLng,
      region,
      country,
      imageUrl: image.startsWith('http') ? image : (image.length > 50000 ? image : image),
      weather,
      aiResult,
      voiceNote: voiceNote || undefined,
      reporter: reporter || 'Citizen Mobile Sensor',
      status: aiResult.immediate_health_hazard ? 'verified' : 'pending'
    };

    const savedReport = dataStore.createReport(reportPayload);

    res.status(201).json({
      success: true,
      message: 'Pollution report processed by Gemini Vision and logged to federated grid.',
      data: savedReport
    });
  } catch (error) {
    console.error('[Reports Route] Error processing pollution report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/reports/:id/status - Update dispatch / verification status
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'verified', 'dispatched', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const updated = dataStore.updateReportStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/reports/:id/upvote
router.post('/:id/upvote', (req, res) => {
  try {
    const updated = dataStore.upvoteReport(req.params.id);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
