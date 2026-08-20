const express = require('express');
const router = express.Router();
const openMeteoService = require('../services/openMeteoService');

// GET /api/weather - Get live weather readings for coordinates
router.get('/', async (req, res) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat) : 31.6340;
    const lng = req.query.lng ? parseFloat(req.query.lng) : 74.8723;

    if (isNaN(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({ success: false, error: 'Invalid latitude parameter (-90 to 90).' });
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, error: 'Invalid longitude parameter (-180 to 180).' });
    }

    const weather = await openMeteoService.getCurrentWeather(lat, lng);
    res.json({ success: true, data: weather });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch meteorological data.' });
  }
});

// GET /api/weather/forecast - Get 24-hour predictive wind forecast
router.get('/forecast', async (req, res) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat) : 31.6340;
    const lng = req.query.lng ? parseFloat(req.query.lng) : 74.8723;

    if (isNaN(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({ success: false, error: 'Invalid latitude parameter (-90 to 90).' });
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, error: 'Invalid longitude parameter (-180 to 180).' });
    }

    const forecast = await openMeteoService.getHourlyForecast(lat, lng);
    res.json({ success: true, count: forecast.length, data: forecast });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch meteorological forecast.' });
  }
});

module.exports = router;
