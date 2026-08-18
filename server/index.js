const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');

const reportsRouter = require('./routes/reports');
const weatherRouter = require('./routes/weather');
const satelliteRouter = require('./routes/satellite');
const federationRouter = require('./routes/federation');

const app = express();

// Security HTTP Headers
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));

// CORS Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing with safe size bounds
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Global API Rate Limiter: 120 requests per minute
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests from this IP, please try again after 1 minute.' }
});
app.use('/api', globalLimiter);

// AI Submission Limiter: 20 AI analyses per 5 minutes per IP (protects Gemini API quota)
const submissionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'AI analysis quota limit reached. Please wait 5 minutes before submitting new forensic evidence.' }
});
app.use('/api/reports/pollution', submissionLimiter);

// Request logger
app.use((req, res, next) => {
  if (req.path !== '/api/reports/stream') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// API Routes
app.use('/api/reports', reportsRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/satellite', satelliteRouter);
app.use('/api/federation', federationRouter);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'VesperAero Federated Environmental Forensic Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    gemini_ai_ready: !!config.geminiApiKey,
    firms_satellite_ready: true,
    open_meteo_ready: true
  });
});

// Root welcome
app.get('/', (req, res) => {
  res.send(`
    <html>
      <body style="background:#0b0f19;color:#e2e8f0;font-family:sans-serif;padding:40px;">
        <h1 style="color:#38bdf8;">🍃 VesperAero Environmental Forensic API</h1>
        <p>Federated AI Climate Action & Cross-Border Plume Modeling Platform</p>
        <ul>
          <li><a style="color:#a78bfa;" href="/api/health">/api/health</a> - Health & AI Status</li>
          <li><a style="color:#a78bfa;" href="/api/reports">/api/reports</a> - Incident Feed</li>
          <li><a style="color:#a78bfa;" href="/api/reports/stats">/api/reports/stats</a> - Analytics</li>
          <li><a style="color:#a78bfa;" href="/api/weather?lat=31.634&lng=74.872">/api/weather</a> - Open-Meteo Wind & Weather</li>
          <li><a style="color:#a78bfa;" href="/api/satellite/firms">/api/satellite/firms</a> - NASA FIRMS Thermal Anomalies</li>
          <li><a style="color:#a78bfa;" href="/api/federation/export">/api/federation/export</a> - BRICS Interoperability Export</li>
        </ul>
      </body>
    </html>
  `);
});

const PORT = config.port;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 VesperAero Backend API running on port ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🍃 Google Gemini AI Integration: ${config.geminiApiKey ? 'API KEY ACTIVE' : 'CALIBRATED SIMULATION ACTIVE'}`);
    console.log(`🛰️  NASA FIRMS & Open-Meteo Services: ACTIVE`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
