require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
  firmsMapKey: process.env.FIRMS_MAP_KEY || '',
  isProduction: process.env.NODE_ENV === 'production',
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  judgeSecretToken: process.env.JUDGE_SECRET_TOKEN || 'vesper-eval-2026',
  dailyGeminiCap: parseInt(process.env.DAILY_GEMINI_CAP || '1000', 10),
  defaultRegion: {
    lat: 31.6340,
    lng: 74.8723,
    name: 'Punjab Border Corridor'
  }
};
