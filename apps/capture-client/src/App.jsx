import React, { useState, useEffect } from 'react';
import { Leaf, Send, ExternalLink, Sparkles } from 'lucide-react';
import { translations } from './i18n/translations';
import LanguageSwitcher from './components/LanguageSwitcher';
import GeoLocationBadge from './components/GeoLocationBadge';
import CameraCapture from './components/CameraCapture';
import VoiceRecorder from './components/VoiceRecorder';
import SubmissionStatus from './components/SubmissionStatus';

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

  const t = translations[lang] || translations.en;

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
      const payload = {
        image,
        lat: location.lat,
        lng: location.lng,
        note,
        voiceNote,
        reporter: 'Citizen Sensor Network'
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
          <div className="logo-icon">
            <Leaf size={22} />
          </div>
          <div className="logo-text">
            <h1>{t.title}</h1>
            <span className="brics-pill">{t.bricsBadge}</span>
          </div>
        </div>

        <LanguageSwitcher currentLang={lang} onLanguageChange={setLang} />
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
