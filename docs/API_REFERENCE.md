# ⚡ VesperAero REST API Reference

Base Cloud URL: `https://web-production-9805d.up.railway.app`

---

## Authentication & Headers

| Header | Type | Description |
| :--- | :--- | :--- |
| `Content-Type` | `string` | `application/json` or `multipart/form-data` |
| `X-Judge-Token` | `string` | **`vesper-eval-2026`** (Bypasses rate limiting for evaluations) |

---

## Endpoints

### 1. System Health & Diagnostics
* **Endpoint**: `GET /api/health`
* **Response**:
```json
{
  "status": "online",
  "service": "VesperAero Federated Environmental Forensic Backend",
  "version": "1.0.0",
  "timestamp": "2026-08-20T15:31:27.575Z",
  "gemini_ai_ready": true,
  "firms_satellite_ready": true,
  "open_meteo_ready": true,
  "security_shield_active": true
}
```

---

### 2. Submit Pollution Incident (Multimodal Vision & Physics)
* **Endpoint**: `POST /api/reports/pollution`
* **Request Body**:
```json
{
  "category": "Stubble Burning",
  "latitude": 31.634,
  "longitude": 74.872,
  "description": "Dense smoke rising from agricultural fields near the border",
  "image": "data:image/jpeg;base64,...",
  "voiceNote": "Visible thick dark smoke blowing east"
}
```
* **Response**:
```json
{
  "success": true,
  "report": {
    "id": "rep_1787213573255_zjov",
    "category": "Stubble Burning",
    "latitude": 31.634,
    "longitude": 74.872,
    "status": "Pending",
    "ai_forensics": {
      "source_classification": "Agricultural Biomass / Stubble Burning",
      "visual_density_score": 8.5,
      "immediate_health_hazard": true,
      "pollutants_detected": ["PM2.5", "PM10", "CO", "VOCs"],
      "plume_vector": {
        "direction_degrees": 191,
        "estimated_drift_km_per_hr": 3.2,
        "cross_border_risk": true,
        "estimated_plume_length_km": 2.0
      }
    }
  }
}
```

---

### 3. Fetch Active Reports
* **Endpoint**: `GET /api/reports`
* **Query Parameters**:
  - `status`: Filter by `Pending`, `Investigating`, `Dispatched`, `Resolved`
  - `limit`: Integer (Default: 50)

---

### 4. Fetch Meteorological Telemetry
* **Endpoint**: `GET /api/weather?lat=31.634&lng=74.872`
* **Response**:
```json
{
  "temperature": 28.4,
  "humidity": 65,
  "windSpeed": 2.8,
  "windDirection": 11,
  "surfacePressure": 1012.5,
  "source": "Open-Meteo API (WMO Standard)"
}
```

---

### 5. NASA FIRMS Satellite Thermal Hotspots
* **Endpoint**: `GET /api/satellite/firms?lat=31.634&lng=74.872`
* **Response**:
```json
{
  "count": 4,
  "hotspots": [
    {
      "latitude": 31.642,
      "longitude": 74.881,
      "brightness": 328.5,
      "confidence": "high",
      "satellite": "VIIRS NOAA-20"
    }
  ]
}
```

---

### 6. Export Federated Telemetry (`BRICS-AERO-FED-v1.0`)
* **Endpoint**: `GET /api/federation/export`
* **Response**: Standardized cross-border environmental forensic interchange data.
