import React, { useState, useEffect, useCallback } from 'react';
import { Leaf, Send, ExternalLink, Sparkles, History, Navigation, MapPin, Factory, Flame, Car, AlertTriangle } from 'lucide-react';
import { translations } from './i18n/translations';
import LanguageSwitcher from './components/LanguageSwitcher';
import GeoLocationBadge from './components/GeoLocationBadge';
import CameraCapture from './components/CameraCapture';
import VoiceRecorder from './components/VoiceRecorder';
import SubmissionStatus from './components/SubmissionStatus';
import UserHistoryDrawer from './components/UserHistoryDrawer';
import { saveReport, getReports, getDeviceUUID } from './lib/historyStorage';

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 'https://web-production-9805d.up.railway.app' : '');

export default function App() {
  const [lang, setLang] = useState('en');
  const [selectedCategory, setSelectedCategory] = useState('stubble');
  const [location, setLocation] = useState({
    lat: 31.634,
    lng: 74.872,
    accuracy: 10,
    isLiveGPS: false,
    status: 'locked'
  });
  const [weather, setWeather] = useState({
    windSpeed: 14.5,
    windDirection: 285,
    temperature: 28.0,
    humidity: 48
  });
  const [image, setImage] = useState(null);
  const [note, setNote] = useState('');
  const [voiceNote, setVoiceNote] = useState('');
  const [submitStatus, setSubmitStatus] = useState('idle'); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);

  const t = translations[lang] || translations.en;

  // Initialize history count from local storage
  useEffect(() => {
    setHistoryCount(getReports().length);
  }, []);

  // Fetch real-time live weather for current coordinates from Open-Meteo
  const fetchLiveWeather = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/weather?lat=${location.lat}&lng=${location.lng}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) setWeather(json.data);
      }
    } catch (e) {
      console.warn('[Weather] Fetch error:', e);
    }
  }, [location.lat, location.lng]);

  // Trigger weather fetch on location change and every 60 seconds
  useEffect(() => {
    fetchLiveWeather();
    const interval = setInterval(fetchLiveWeather, 60000);
    return () => clearInterval(interval);
  }, [fetchLiveWeather]);

  // Request browser geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: Math.round(pos.coords.latitude * 10000) / 10000,
            lng: Math.round(pos.coords.longitude * 10000) / 10000,
            accuracy: Math.round(pos.coords.accuracy),
            isLiveGPS: true,
            status: 'locked'
          });
        },
        (err) => {
          console.log('[Geolocation] Initial GPS note:', err.message);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, []);

  // Category selection ONLY updates the observation category, NEVER changes GPS coordinates
  const handleSelectCategory = (catKey) => {
    setSelectedCategory(catKey);
  };

  const handleUseMyGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: Math.round(pos.coords.latitude * 10000) / 10000,
          lng: Math.round(pos.coords.longitude * 10000) / 10000,
          accuracy: Math.round(pos.coords.accuracy),
          isLiveGPS: true,
          status: 'locked'
        });
      },
      (err) => {
        alert(`Location permission note: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      alert('Please take or upload a photo first.');
      return;
    }

    setSubmitStatus('loading');
    setErrorMessage('');
    setAnalysisResult(null);

    try {
      const deviceId = getDeviceUUID();
      const payload = {
        image,
        lat: location.lat,
        lng: location.lng,
        note,
        voiceNote,
        category: selectedCategory,
        region: location.isLiveGPS ? 'Physical GPS Sensor Region' : 'Punjab Border Corridor',
        country: 'India',
        reporter: 'Citizen Web Sensor',
        deviceId,
        source_platform: 'pwa_web'
      };

      const res = await fetch(`${API_BASE}/api/reports/pollution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Judge-Token': 'vesper-eval-2026'
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setAnalysisResult(json.data);
        setSubmitStatus('success');
        // Save forensic report receipt to browser storage immediately
        saveReport(json.data);
        setHistoryCount(getReports().length);
      } else {
        throw new Error(json.error || 'Failed to submit report to Gemini AI engine.');
      }
    } catch (err) {
      console.error('Submission failed:', err);
      setErrorMessage(err.message || 'Submission failed. Please check network connection.');
      setSubmitStatus('error');
    }
  };

  return (
    <>
      <header className="app-header">
        <div className="logo-group">
          <div className="logo-icon" style={{ background: 'transparent', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/favicon.svg" alt="VesperAero Logo" style={{ width: 30, height: 30, filter: 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.5))' }} />
          </div>
          <div className="logo-text">
            <h1>{t.title}</h1>
            <span className="brics-pill">{location.isLiveGPS ? 'LIVE GPS ACTIVE' : t.bricsBadge}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* My Submissions History Trigger */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              transition: 'border-color 0.2s, background 0.2s'
            }}
            title="Review My Past Submissions"
          >
            <History size={15} color="var(--accent-cyan)" />
            <span>{t.historyTitle || 'History'}</span>
            {historyCount > 0 && (
              <span
                className="mono"
                style={{
                  background: 'rgba(56, 189, 248, 0.2)',
                  color: 'var(--accent-cyan)',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: 10
                }}
              >
                {historyCount}
              </span>
            )}
          </button>

          <LanguageSwitcher currentLang={lang} onLanguageChange={setLang} />
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <div style={{ marginBottom: 16 }}>
          <h2 className="section-title">{t.captureTitle}</h2>
          <p className="section-desc">{t.captureSubtitle}</p>
        </div>

        {/* Live Real-time GPS & Wind Telemetry Card */}
        <GeoLocationBadge 
          location={location} 
          setLocation={setLocation} 
          weather={weather} 
          refreshWeather={fetchLiveWeather}
          t={t} 
        />

        {/* Emission Category Selection (Does NOT alter GPS coordinates) */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Observation Emission Category</span>
            <span style={{ fontSize: '0.7rem', color: '#38bdf8', cursor: 'pointer' }} onClick={handleUseMyGPS}>
              📍 {location.isLiveGPS ? 'GPS Live Locked' : 'Acquire My GPS'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
            <button
              type="button"
              onClick={() => handleSelectCategory('stubble')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 20,
                fontSize: '0.8rem',
                fontWeight: selectedCategory === 'stubble' ? 800 : 500,
                background: selectedCategory === 'stubble' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.7)',
                border: selectedCategory === 'stubble' ? '1.5px solid #38bdf8' : '1px solid var(--border-color)',
                color: selectedCategory === 'stubble' ? '#7dd3fc' : 'var(--text-muted)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              <Flame size={14} color={selectedCategory === 'stubble' ? '#38bdf8' : undefined} />
              <span>{t.stubblePreset || '🌾 Stubble Burning'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectCategory('industrial')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 20,
                fontSize: '0.8rem',
                fontWeight: selectedCategory === 'industrial' ? 800 : 500,
                background: selectedCategory === 'industrial' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.7)',
                border: selectedCategory === 'industrial' ? '1.5px solid #38bdf8' : '1px solid var(--border-color)',
                color: selectedCategory === 'industrial' ? '#7dd3fc' : 'var(--text-muted)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              <Factory size={14} color={selectedCategory === 'industrial' ? '#38bdf8' : undefined} />
              <span>{t.industrialPreset || '🏭 Industrial Stack'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectCategory('kiln')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 20,
                fontSize: '0.8rem',
                fontWeight: selectedCategory === 'kiln' ? 800 : 500,
                background: selectedCategory === 'kiln' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.7)',
                border: selectedCategory === 'kiln' ? '1.5px solid #38bdf8' : '1px solid var(--border-color)',
                color: selectedCategory === 'kiln' ? '#7dd3fc' : 'var(--text-muted)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              <Leaf size={14} color={selectedCategory === 'kiln' ? '#38bdf8' : undefined} />
              <span>{t.kilnPreset || '🧱 Brick Kiln'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectCategory('chemical')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 20,
                fontSize: '0.8rem',
                fontWeight: selectedCategory === 'chemical' ? 800 : 500,
                background: selectedCategory === 'chemical' ? 'rgba(251, 113, 133, 0.2)' : 'rgba(15, 23, 42, 0.7)',
                border: selectedCategory === 'chemical' ? '1.5px solid #fb7185' : '1px solid var(--border-color)',
                color: selectedCategory === 'chemical' ? '#fda4af' : 'var(--text-muted)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              <AlertTriangle size={14} color={selectedCategory === 'chemical' ? '#fb7185' : undefined} />
              <span>☣️ Chemical Flare</span>
            </button>
          </div>
        </div>

        {/* Camera / Image picker */}
        <CameraCapture
          image={image}
          setImage={setImage}
          t={t}
        />

        {/* Voice Note & Observation */}
        <VoiceRecorder
          note={note}
          setNote={setNote}
          voiceNote={voiceNote}
          setVoiceNote={setVoiceNote}
          currentLang={lang}
          t={t}
        />

        {/* Submit to Gemini AI */}
        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={submitStatus === 'loading' || !image}
        >
          {submitStatus === 'loading' ? (
            <>
              <Sparkles size={20} className="spin" />
              <span>{t.analyzing}</span>
            </>
          ) : (
            <>
              <Send size={18} />
              <span>{t.submitReport}</span>
            </>
          )}
        </button>

        {/* Forensic Analysis Result */}
        <SubmissionStatus status={submitStatus} result={analysisResult} errorMessage={errorMessage} t={t} />
      </main>

      {/* Citizen Local History Drawer */}
      <UserHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          setHistoryCount(getReports().length);
        }}
        apiBase={API_BASE}
      />

      <footer className="gov-link-bar">
        <a
          href="http://localhost:5174"
          target="_blank"
          rel="noopener noreferrer"
          className="gov-link"
        >
          <span>{t.viewDashboard}</span>
          <ExternalLink size={14} />
        </a>
      </footer>
    </>
  );
}
