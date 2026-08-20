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
    const country = typeof req.query.country === 'string' ? req.query.country.replace(/<[^>]*>?/gm, '').trim().slice(0, 50) : 'ALL';

    if (minLat !== undefined && (isNaN(minLat) || minLat < -90 || minLat > 90)) {
      return res.status(400).json({ success: false, error: 'Invalid minLat parameter.' });
    }
    if (maxLat !== undefined && (isNaN(maxLat) || maxLat < -90 || maxLat > 90)) {
      return res.status(400).json({ success: false, error: 'Invalid maxLat parameter.' });
    }
    if (minLng !== undefined && (isNaN(minLng) || minLng < -180 || minLng > 180)) {
      return res.status(400).json({ success: false, error: 'Invalid minLng parameter.' });
    }
    if (maxLng !== undefined && (isNaN(maxLng) || maxLng < -180 || maxLng > 180)) {
      return res.status(400).json({ success: false, error: 'Invalid maxLng parameter.' });
    }

    const hotspots = await firmsService.getHotspots({ minLat, maxLat, minLng, maxLng, country });
    res.json({
      success: true,
      count: hotspots.length,
      provider: 'NASA Earthdata FIRMS (MODIS/VIIRS Active Fire Anomaly)',
      data: hotspots
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve satellite thermal data.' });
  }
});

module.exports = router;
