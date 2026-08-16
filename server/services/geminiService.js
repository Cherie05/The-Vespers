const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');

/**
 * Gemini AI Vision Environmental Forensic Service
 * Leverages Google Gemini multimodal capabilities to classify pollution sources,
 * evaluate visual density (1-10), detect immediate health hazards, and model plume drift.
 */
class GeminiService {
  constructor() {
    this.apiKey = config.geminiApiKey;
    this.genAI = this.apiKey ? new GoogleGenerativeAI(this.apiKey) : null;
  }

  /**
   * Classify pollution image using Gemini Vision with weather context
   * @param {Object} params
   * @param {string} params.imageBase64 - Base64 encoded image string (or data URL)
   * @param {string} params.mimeType - Image mime type (e.g. 'image/jpeg')
   * @param {Object} params.weather - Weather object { windSpeed, windDirection, temperature, humidity }
   * @param {string} params.userNote - User description or voice note transcription
   * @param {Object} params.location - { lat, lng }
   * @returns {Promise<Object>} Analyzed AI forensic report
   */
  async analyzePollutionIncident({ imageBase64, mimeType = 'image/jpeg', weather, userNote = '', location = {} }) {
    const axios = require('axios');

    // Clean base64 string or download image if URL
    let cleanBase64 = imageBase64;
    if (imageBase64.startsWith('http://') || imageBase64.startsWith('https://')) {
      try {
        const imgRes = await axios.get(imageBase64, { responseType: 'arraybuffer', timeout: 7000 });
        cleanBase64 = Buffer.from(imgRes.data, 'binary').toString('base64');
        const contentType = imgRes.headers['content-type'];
        if (contentType) mimeType = contentType.split(';')[0];
      } catch (err) {
        console.warn('[GeminiService] Could not fetch remote image for Gemini vision:', err.message);
      }
    } else if (imageBase64.includes('base64,')) {
      const parts = imageBase64.split('base64,');
      cleanBase64 = parts[1];
      if (parts[0].includes('image/')) {
        mimeType = parts[0].split(':')[1].split(';')[0];
      }
    }

    const windSpeed = weather?.windSpeed || 15.0;
    const windDir = weather?.windDirection || 270;
    const temp = weather?.temperature || 26.0;

    // Calculate downstream plume drift angle (wind blows FROM windDir TOWARDS (windDir + 180) % 360)
    const downstreamAngle = (windDir + 180) % 360;

    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

        const prompt = `
System: You are an environmental forensic AI scientist inspecting a localized pollution or emission event.
Meteorological Readings at Site:
- Wind Speed: ${windSpeed} km/h
- Wind Direction (Blowing From): ${windDir}° (Plume drifts towards approx ${downstreamAngle}°)
- Ambient Temperature: ${temp}°C
- Citizen Observation Note: "${userNote || 'None provided'}"
- GPS Coordinates: Lat ${location.lat || 'Unknown'}, Lng ${location.lng || 'Unknown'}

Analyze this image and return ONLY a valid JSON object matching EXACTLY this structure (no markdown formatting, no code fences):
{
  "source_classification": "string (e.g. Agricultural Biomass / Stubble Burning, Heavy Industrial Smelter, Coal Fired Brick Kiln, Petrochemical Flare Stack, Vehicular Smog Cluster, Waste Inversion Burn)",
  "visual_density_score": 8.5,
  "immediate_health_hazard": true,
  "pollutants_detected": ["PM2.5", "PM10", "SO2", "CO", "VOCs"],
  "plume_vector": {
    "direction_degrees": ${downstreamAngle},
    "estimated_drift_km_per_hr": ${Math.round(windSpeed * 1.15 * 10) / 10},
    "cross_border_risk": ${windSpeed > 10.0},
    "estimated_plume_length_km": ${Math.round(windSpeed * 0.7 * 10) / 10},
    "confidence_score": 0.92
  },
  "dispatch_recommendation": "string with specific actionable recommendation for environmental protection authorities and local public health alert"
}
`;

        const imagePart = {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType || 'image/jpeg'
          }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        const parsed = this.cleanAndParseJson(responseText);

        if (parsed && parsed.source_classification) {
          return {
            ...parsed,
            ai_model: 'Google Gemini 3.5 Flash Vision',
            processed_at: new Date().toISOString()
          };
        } else {
          throw new Error('Gemini API did not return structured forensic data.');
        }
      } catch (err) {
        console.error(`[GeminiService] Live Gemini API error:`, err.message);
        throw new Error(`Google Gemini Vision API analysis failed: ${err.message}`);
      }
    }

    throw new Error('GEMINI_API_KEY is not configured on server.');
  }

  /**
   * Safely strip markdown code blocks and parse JSON
   */
  cleanAndParseJson(text) {
    try {
      let cleaned = text.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```/, '').replace(/```$/, '');
      }
      cleaned = cleaned.trim();
      return JSON.parse(cleaned);
    } catch (e) {
      console.error('[GeminiService] Failed to parse JSON from AI response:', text);
      return null;
    }
  }
}

module.exports = new GeminiService();
