const express = require('express');
const router = express.Router();
const firmsService = require('../services/firmsService');

// GET /api/satellite/firms - Get NASA FIRMS satellite thermal anomalies
router.get('/firms', async (req, res) => {
  try {
    const minLat = req.query.minLat ? parseFloat(req.query.minLat) : undefined;
    const maxLat = req.query.maxLat ? parseFloat(req.query.maxLat) : undefined;
    const minLng = req.query.minLng ? parseFloat(req.query.minLng) : undefined;
    const maxLng = req.query.maxLng ? parseFloat(req.query.maxLng) : undefined;
    const country = req.query.country || 'ALL';

    const hotspots = await firmsService.getHotspots({ minLat, maxLat, minLng, maxLng, country });
    res.json({
      success: true,
      count: hotspots.length,
      provider: 'NASA Earthdata FIRMS (MODIS/VIIRS Active Fire Anomaly)',
      data: hotspots
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
