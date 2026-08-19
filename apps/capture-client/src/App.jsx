import React, { useState, useEffect } from 'react';
import { Leaf, Send, ExternalLink, Sparkles, History } from 'lucide-react';
import { translations } from './i18n/translations';
import LanguageSwitcher from './components/LanguageSwitcher';
import GeoLocationBadge from './components/GeoLocationBadge';
import CameraCapture from './components/CameraCapture';
import VoiceRecorder from './components/VoiceRecorder';
import SubmissionStatus from './components/SubmissionStatus';
import UserHistoryDrawer from './components/UserHistoryDrawer';
import { saveReport, getReports, getDeviceUUID } from './lib/historyStorage';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [lang, setLang] = useState('en');
  const [location, setLocation] = useState({
    lat: 31.634,
    lng: 74.872,
    accuracy: 12,
    status: 'locked'
  });
  const [weather, setWeather] = useState({
    windSpeed: 16.2,
    windDirection: 295,
    temperature: 31.5,
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

  // Fetch live weather when coordinates change
  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch(`${API_BASE}/api/weather?lat=${location.lat}&lng=${location.lng}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) setWeather(json.data);
        }
      } catch (e) {
        console.warn('Weather fetch error:', e);
      }
    }
    fetchWeather();
  }, [location.lat, location.lng]);

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
        reporter: 'Citizen Sensor Network',
        deviceId
      };

      const res = await fetch(`${API_BASE}/api/reports/pollution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
            <span className="brics-pill">{t.bricsBadge}</span>
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

        {/* Live GPS & Wind telemetry */}
        <GeoLocationBadge location={location} setLocation={setLocation} weather={weather} t={t} />

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
