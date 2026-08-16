require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
  firmsMapKey: process.env.FIRMS_MAP_KEY || '',
  isProduction: process.env.NODE_ENV === 'production',
  defaultRegion: {
    lat: 31.6340,
    lng: 74.8723,
    name: 'Punjab Border Corridor'
  }
};
