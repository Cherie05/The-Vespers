const express = require('express');
const router = express.Router();
const dataStore = require('../services/dataStore');

function sanitizeString(str, maxLen = 200) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>?/gm, '').trim().slice(0, maxLen);
}

// GET /api/federation/export - BRICS Interoperability standardized telemetry export
router.get('/export', (req, res) => {
  try {
    const exportData = dataStore.getFederationExport();
    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate federation export.' });
  }
});

// POST /api/federation/sync - Ingest cross-border event from partner BRICS member node
router.post('/sync', (req, res) => {
  try {
    const { origin_node, federated_incidents } = req.body;
    if (!federated_incidents || !Array.isArray(federated_incidents)) {
      return res.status(400).json({ success: false, error: 'Invalid federation payload structure. Array required.' });
    }

    // DoS / Memory protection: limit batch ingestion size
    if (federated_incidents.length > 50) {
      return res.status(400).json({ success: false, error: 'Batch limit exceeded. Maximum 50 incidents allowed per sync.' });
    }

    const cleanOrigin = sanitizeString(origin_node, 80) || 'BRICS Node';
    let ingestedCount = 0;

    for (const incident of federated_incidents) {
      if (incident && incident.coordinates && incident.classification) {
        const lat = parseFloat(incident.coordinates.lat);
        const lng = parseFloat(incident.coordinates.lng);

        if (!isNaN(lat) && lat >= -90 && lat <= 90 && !isNaN(lng) && lng >= -180 && lng <= 180) {
          const cleanClassification = sanitizeString(incident.classification, 100);
          dataStore.createReport({
            title: `[FEDERATED - ${cleanOrigin}] ${cleanClassification}`,
            description: `Trans-boundary federated incident notification from ${cleanOrigin}.`,
            lat,
            lng,
            region: sanitizeString(incident.region, 100) || 'Cross-Border Economic Corridor',
            country: 'BRICS Partner',
            imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80',
            weather: incident.meteorology || { windSpeed: 15.0, windDirection: 270, temperature: 25.0, humidity: 50 },
            aiResult: {
              source_classification: cleanClassification,
              visual_density_score: typeof incident.density_index === 'number' ? Math.min(10, Math.max(1, incident.density_index)) : 7.5,
              immediate_health_hazard: true,
              pollutants_detected: ["PM2.5", "Trans-boundary Particulates"],
              plume_vector: incident.plume_vector || {
                direction_degrees: 90,
                estimated_drift_km_per_hr: 18.0,
                cross_border_risk: true
              },
              dispatch_recommendation: `FEDERATED ALERT: Ingested from ${cleanOrigin}. Initiate joint monitoring protocol.`
            },
            status: 'verified',
            reporter: `Federated Node (${cleanOrigin})`
          });
          ingestedCount++;
        }
      }
    }

    res.json({
      success: true,
      message: `Successfully synchronized ${ingestedCount} trans-boundary incidents into national grid.`,
      ingestedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'An error occurred during federation synchronization.' });
  }
});

module.exports = router;
