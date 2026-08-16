const express = require('express');
const router = express.Router();
const dataStore = require('../services/dataStore');

// GET /api/federation/export - BRICS Interoperability standardized telemetry export
router.get('/export', (req, res) => {
  try {
    const exportData = dataStore.getFederationExport();
    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/federation/sync - Ingest cross-border event from partner BRICS member node
router.post('/sync', (req, res) => {
  try {
    const { origin_node, federated_incidents } = req.body;
    if (!federated_incidents || !Array.isArray(federated_incidents)) {
      return res.status(400).json({ success: false, error: 'Invalid federation payload structure' });
    }

    let ingestedCount = 0;
    for (const incident of federated_incidents) {
      if (incident.coordinates && incident.classification) {
        dataStore.createReport({
          title: `[FEDERATED - ${origin_node || 'BRICS Node'}] ${incident.classification}`,
          description: `Trans-boundary federated incident notification from ${origin_node || 'Partner Nation'}.`,
          lat: incident.coordinates.lat,
          lng: incident.coordinates.lng,
          region: incident.region || 'Cross-Border Economic Corridor',
          country: 'BRICS Partner',
          imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80',
          weather: incident.meteorology || { windSpeed: 15.0, windDirection: 270, temperature: 25.0, humidity: 50 },
          aiResult: {
            source_classification: incident.classification,
            visual_density_score: incident.density_index || 7.5,
            immediate_health_hazard: true,
            pollutants_detected: ["PM2.5", "Trans-boundary Particulates"],
            plume_vector: incident.plume_vector || {
              direction_degrees: 90,
              estimated_drift_km_per_hr: 18.0,
              cross_border_risk: true
            },
            dispatch_recommendation: `FEDERATED ALERT: Ingested from ${origin_node}. Initiate joint monitoring protocol.`
          },
          status: 'verified',
          reporter: `Federated Node (${origin_node || 'External'})`
        });
        ingestedCount++;
      }
    }

    res.json({
      success: true,
      message: `Successfully synchronized ${ingestedCount} trans-boundary incidents into national grid.`,
      ingestedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
