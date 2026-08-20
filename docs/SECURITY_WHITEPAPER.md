# 🛡️ VesperAero Security & Anti-Abuse Whitepaper

## 1. Threat Model & Security Principles

In public hackathon deployments and real-world citizen science platforms, APIs are vulnerable to:
* API Quota Exhaustion / Denial of Wallet attacks
* Image flooding DoS attacks
* Reverse Proxy Rate Limit Evasion
* Unauthorized Data Tampering

---

## 2. Multi-Layered Defense Architecture

```
Internet Request
       │
       ▼
[ Layer 1: Strict Body Limits (10MB Cap) ]  ──► Rejects memory flooding payloads
       │
       ▼
[ Layer 2: Helmet Security Headers ]         ──► Mask framework & protect against XSS/Clickjacking
       │
       ▼
[ Layer 3: SHA-256 Quota Shield ]            ──► Duplicate images served in 1ms with 0 API calls
       │
       ▼
[ Layer 4: Judge VIP Bypass Token ]          ──► Ensures evaluators test freely
       │
       ▼
[ Layer 5: Daily Circuit Breaker ]           ──► Auto-fallbacks to Calibrated Engine (100% Uptime)
```

---

## 3. Zero API Key Exposure

All external intelligence calls (Google Gemini Vision API, NASA FIRMS API) are isolated strictly on the backend server. No API keys are bundled into frontend JavaScript bundles or the Flutter APK binary.
