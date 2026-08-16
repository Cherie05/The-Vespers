# 🍃 VesperAero — Federated Environmental Forensics & Cross-Border Plume Platform
> **Build with AI: Code for Communities — Second Edition | Track: Sustainability**
> **BRICS 2026 Pillar: Building for Resilience, Innovation, Cooperation and Sustainability**
> **Team:** Arun & Co (Arun · Sairam · Persis)

---

## 🌟 Executive Summary

Major BRICS cities monitor macro-level air quality but consistently miss **hyper-local and cross-border pollution events** — industrial emissions, large-scale agricultural burning, and trans-boundary smog. The absence of real-time, granular data prevents coordinated climate action and directly threatens public health.

**VesperAero** turns citizens into hyper-local pollution sensors. A citizen photographs a localized pollution event; **Google Gemini Vision** classifies the source and estimates opacity/density, **Open-Meteo** supplies live meteorological wind vectors, an atmospheric **Gaussian Plume Dispersion Model** projects the hazardous drift footprint across state and international borders, and a **NASA FIRMS satellite overlay** provides satellite thermal anomaly ground truthing.

---

## 🚀 Key Architecture & Flow

```
[ Citizen Capture PWA ]
          │ (Photo + GPS Coordinates + Voice Note)
          ▼
[ Express API Gateway ] ───► [ Open-Meteo Live API ] (Wind Speed / Direction)
          │
          ▼
[ Google Gemini Vision AI ] ──► Classifies Source, Density (1-10), Health Hazard, Pollutants
          │
          ▼
[ Gaussian Plume Dispersion Model ] ──► Calculates 2D Spatial Polygon Drift & Trans-boundary Risk
          │
          ▼
[ NASA FIRMS Satellite Layer ] ──► Correlates MODIS/VIIRS Thermal Anomalies
          │
          ▼
[ Gov & Policy Command Center ] ──► Real-Time Map + Multi-Report Heatmap + Inter-Agency Dispatch
```

---

## 🏆 Hackathon Tracks & Evaluation Compliance

| Evaluation Parameter | Weight | How VesperAero Solves It |
|---|---|---|
| **AI / Technical Execution** | **25%** | **Google Gemini 1.5/2.5 Flash Vision** multimodal model extracts source classification, opacity index (1–10), hazardous pollutants (PM2.5, SO2, CO, etc.), and generates targeted dispatch advice coupled with a scientific Gaussian dispersion physics model. |
| **Cross-Border Applicability** | **20%** | Dedicated atmospheric plume dispersion calculation projecting trans-boundary drift (India/Pakistan, Brazil/Bolivia, South Africa/Mozambique), multi-region presets, and `BRICS-AERO-FED-v1.0` JSON telemetry export schema. |
| **Problem-Solution Fit** | **20%** | Solves macro-monitoring blind spots by combining citizen sensing with satellite ground truthing and live wind forecasting. |
| **Deployability & Scalability** | **20%** | 100% free-tier stack (Node.js/Express on Render, React/Vite on Netlify, Open-Meteo keyless, NASA FIRMS, Firestore/local hybrid store) ready for pilot deployment in hours. |
| **Impact Potential** | **10%** | Rapid public health intervention, enforcement dispatch prioritization, and cross-border environmental diplomacy. |
| **Multilingual & Voice Support** | **Bonus/Req** | Full i18n support across 5 BRICS languages (English, हिन्दी, Português, Русский, 中文) + Web Speech API live voice note recording. |

---

## 📦 Repo Structure

```
vespers/
├── package.json                         # Root workspace scripts (concurrent execution)
├── apps/
│   ├── capture-client/                  # Citizen Mobile PWA (Port 5173)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── CameraCapture.jsx    # Photo upload & preset scenarios
│   │   │   │   ├── GeoLocationBadge.jsx # GPS lock & live wind preview
│   │   │   │   ├── VoiceRecorder.jsx    # Speech-to-text voice note
│   │   │   │   ├── SubmissionStatus.jsx # Gemini Vision forensic result card
│   │   │   │   └── LanguageSwitcher.jsx # BRICS language selector
│   │   │   └── i18n/translations.js
│   │   └── vite.config.js
│   │
│   └── gov-dashboard/                   # Policy Command Center (Port 5174)
│       ├── src/
│       │   ├── components/
│       │   │   ├── MapView.jsx          # Dark Leaflet GIS map
│       │   │   ├── PlumeLayer.jsx       # Gaussian dispersion polygon fan
│       │   │   ├── FIRMSLayer.jsx       # NASA satellite thermal hotspot overlay
│       │   │   ├── HeatmapLayer.jsx     # Multi-report cluster heatmap
│       │   │   ├── IncidentFeed.jsx     # Live triage sidebar with filters
│       │   │   ├── IncidentModal.jsx    # Deep forensic modal
│       │   │   ├── DispatchModal.jsx    # Inter-agency alert broadcast
│       │   │   └── AnalyticsPanel.jsx   # BRICS Federation & pollutant spectrum
│       │   └── lib/
│       │       ├── plumeModel.js        # Gaussian dispersion mathematical physics
│       │       └── geoUtils.js          # Geodesic bearing and destination math
│       └── vite.config.js
│
├── server/                              # Node.js + Express Backend (Port 5000)
│   ├── routes/
│   │   ├── reports.js                   # POST /api/reports/pollution (Gemini + Weather)
│   │   ├── weather.js                   # GET /api/weather (Open-Meteo)
│   │   ├── satellite.js                 # GET /api/satellite/firms (NASA FIRMS)
│   │   └── federation.js                # GET/POST /api/federation (BRICS Interoperability)
│   ├── services/
│   │   ├── geminiService.js             # Google Gemini Vision prompt execution
│   │   ├── openMeteoService.js          # Live meteorological wind vector fetcher
│   │   ├── firmsService.js              # NASA FIRMS satellite anomaly fetcher
│   │   └── dataStore.js                 # Event streaming & data persistence
│   └── index.js
│
├── data/
│   └── demo-seed.json                   # Pre-seeded cross-border incidents
└── README.md
```

---

## ⚡ Quick Start & Running Locally

### 1. Install Dependencies
```bash
# In the root directory:
npm run install:all
```

### 2. Configure Environment (Optional)
Create `server/.env`:
```env
PORT=5000
GEMINI_API_KEY=your_google_ai_studio_api_key   # Optional: intelligent simulation engages if omitted
FIRMS_MAP_KEY=your_free_nasa_firms_key        # Optional: calibrated anomalies engage if omitted
```

### 3. Run Everything Concurrently
```bash
npm run dev
```

- **Citizen Capture PWA**: [http://localhost:5173](http://localhost:5173)
- **Gov Command Center**: [http://localhost:5174](http://localhost:5174)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## 🔬 Mathematical Modeling: Gaussian Plume Dispersion

The dispersion footprint is modeled via steady-state atmospheric advection and turbulent diffusion:
$$C(x,y,z) = \frac{Q}{2\pi u \sigma_y \sigma_z} \exp\left( -\frac{y^2}{2\sigma_y^2} \right) \left[ \exp\left( -\frac{(z-H)^2}{2\sigma_z^2} \right) + \exp\left( -\frac{(z+H)^2}{2\sigma_z^2} \right) \right]$$

- **Emission Rate $Q$**: Derived from Gemini Vision's `visual_density_score` ($1-10$).
- **Advection Velocity $u$**: Real-time 10m wind velocity from Open-Meteo.
- **Lateral Spread $\sigma_y(x) = c x^d$**: Computed using Pasquill-Gifford dispersion parameters.
- **Trans-Boundary Risk**: Evaluated whenever the projected plume endpoint crosses designated state/international borders.

---

## 📜 Demo Script (for 3–5 min Video Presentation)

1. **Context & Problem**: Open `GovDashboard` ([http://localhost:5174](http://localhost:5174)) and show a clear border sector (e.g. Punjab corridor or Amazon Arc).
2. **Citizen Capture**: Open `CaptureClient` ([http://localhost:5173](http://localhost:5173)) on mobile / split screen. Select "Crop Residue Stubble Burn" scenario or upload a photo.
3. **Voice Note & Language**: Speak a note in Hindi / English using voice recognition. Tap "Analyze with Gemini & Dispatch".
4. **Real-time Vectorization**: Gemini Vision classifies the event, retrieves Open-Meteo wind data, and logs the incident.
5. **Command Center Alert**: Watch the node instantly pop up on `GovDashboard` in real time with the **Gaussian Plume Dispersion Polygon** stretching across the border.
6. **Satellite Correlation**: Toggle the **NASA FIRMS layer** to demonstrate exact spatial correlation with MODIS/VIIRS thermal hotspots.
7. **Hotspot Clustering**: Toggle the **Heatmap layer** to reveal multi-report density clusters.
8. **Cross-Border Interoperability**: Open the **Dispatch Center** to demonstrate automated inter-agency alert transmission in standard `BRICS-AERO-FED` format.
