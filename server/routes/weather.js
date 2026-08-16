const express = require('express');
const router = express.Router();
const openMeteoService = require('../services/openMeteoService');

// GET /api/weather - Get live weather readings for coordinates
router.get('/', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || 31.6340;
    const lng = parseFloat(req.query.lng) || 74.8723;

    const weather = await openMeteoService.getCurrentWeather(lat, lng);
    res.json({ success: true, data: weather });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
