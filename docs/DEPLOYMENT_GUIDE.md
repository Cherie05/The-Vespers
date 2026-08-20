# 🚀 VesperAero Complete Deployment Guide

This guide covers deploying the full VesperAero stack across Cloud & Mobile platforms.

---

## 1. Backend Server Deployment (Railway)

1. Connect GitHub repository to **[Railway.app](https://railway.app)**.
2. Set Root Directory to **`server`** (or use root with `server/Dockerfile`).
3. Add Environment Variables:
   * `PORT`: `8080` (or Railway default)
   * `NODE_ENV`: `production`
   * `GEMINI_API_KEY`: `your_gemini_api_key`
   * `JUDGE_SECRET_TOKEN`: `vesper-eval-2026`
   * `DAILY_GEMINI_CAP`: `1000`
4. Deploy! Your backend health endpoint will be active at: `https://<your-domain>.up.railway.app/api/health`.

---

## 2. Frontend Web Apps Deployment (Netlify)

### Site A: Citizen Capture PWA (`apps/capture-client`)
* **Base directory**: `apps/capture-client`
* **Build command**: `npm run build`
* **Publish directory**: `apps/capture-client/dist`
* **Environment variable**: `VITE_API_URL=https://<your-backend>.up.railway.app`

### Site B: Government Command Center (`apps/gov-dashboard`)
* **Base directory**: `apps/gov-dashboard`
* **Build command**: `npm run build`
* **Publish directory**: `apps/gov-dashboard/dist`
* **Environment variable**: `VITE_API_URL=https://<your-backend>.up.railway.app`

---

## 3. Native Android Mobile App (Flutter)

To build the universal release APK locally:

```bash
cd apps/mobile_app
flutter build apk --release
```

* **Output Binary**: `apps/mobile_app/build/app/outputs/flutter-apk/app-release.apk`
* **Target OS**: Android 5.0+ to Android 16 (API 21 through 36).
