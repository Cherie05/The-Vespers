import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, MessageSquare } from 'lucide-react';

export default function VoiceRecorder({ note, setNote, voiceNote, setVoiceNote, currentLang, t }) {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      // Map language code to speech recognition locale
      const langMap = {
        en: 'en-US',
        hi: 'hi-IN',
        pt: 'pt-BR',
        ru: 'ru-RU',
        zh: 'zh-CN'
      };
      recognition.lang = langMap[currentLang] || 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setVoiceNote(transcript);
        setNote((prev) => (prev ? `${prev} [Voice: ${transcript}]` : transcript));
        setIsRecording(false);
      };

      recognition.onerror = (err) => {
        console.warn('Speech recognition error:', err.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [currentLang, setNote, setVoiceNote]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your observations.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Error starting recognition:', err);
      }
    }
  };

  return (
    <div className="glass-panel voice-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MessageSquare size={16} color="#38bdf8" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t.voiceNoteTitle}</span>
        </div>

        <button
          className={`voice-btn ${isRecording ? 'recording' : ''}`}
          onClick={toggleRecording}
          type="button"
        >
          {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
          <span>{isRecording ? t.stopRecording : t.recordVoice}</span>
        </button>
      </div>

      <textarea
        className="text-input"
        rows="2"
        placeholder={isRecording ? t.recording : "Type or speak observations (smell, intensity, drifting direction)..."}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {voiceNote && (
        <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontStyle: 'italic' }}>
          🎙️ Transcribed: "{voiceNote}"
        </div>
      )}
    </div>
  );
}
