import React, { useRef } from 'react';
import { Camera, Image as ImageIcon, RefreshCw, UploadCloud, ShieldCheck } from 'lucide-react';

export default function CameraCapture({
  image,
  setImage,
  t
}) {
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Client-side image compression using canvas
  const processAndSetImage = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setImage(compressedDataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processAndSetImage(file);
  };

  return (
    <div className="glass-panel capture-box">
      {image ? (
        <div className="preview-container">
          <img src={image} alt="Pollution Capture Preview" className="preview-image" />
          <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.75)', padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', color: '#38bdf8', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <ShieldCheck size={12} color="#38bdf8" />
            <span>Captured Image Verified & Compressed</span>
          </div>

          <button
            className="retake-btn"
            onClick={() => {
              setImage(null);
            }}
          >
            <RefreshCw size={12} style={{ display: 'inline', marginRight: 4 }} />
            Retake / Clear
          </button>
        </div>
      ) : (
        <div className="preview-container" onClick={() => cameraInputRef.current?.click()} style={{ cursor: 'pointer' }}>
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '28px 16px' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Camera size={32} color="#38bdf8" />
            </div>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Capture Real-Time Pollution</p>
            <p style={{ fontSize: '0.8rem', marginTop: 4, color: '#94a3b8' }}>Tap to take a live photo or upload from your gallery</p>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div className="button-group">
        <button className="btn-primary" onClick={() => cameraInputRef.current?.click()}>
          <Camera size={18} />
          {t.cameraButton}
        </button>
        <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
          <UploadCloud size={18} />
          {t.uploadButton}
        </button>
      </div>
    </div>
  );
}
