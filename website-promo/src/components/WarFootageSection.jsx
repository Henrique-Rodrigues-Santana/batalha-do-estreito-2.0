import React, { useEffect, useRef, useState } from 'react';
import { Radio, Eye, AlertTriangle, Wifi } from 'lucide-react';

export default function WarFootageSection() {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [telemetry, setTelemetry] = useState({
    alt: 120,
    spd: 178,
    hdg: 142,
    lat: '26.5677',
    lon: '56.2481',
    fuel: 87,
    signal: 98
  });

  // Animate telemetry data
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setTelemetry(prev => ({
        alt: Math.max(15, prev.alt + (Math.random() - 0.52) * 8),
        spd: Math.max(140, Math.min(260, prev.spd + (Math.random() - 0.48) * 12)),
        hdg: (prev.hdg + (Math.random() - 0.5) * 3 + 360) % 360,
        lat: (26.5 + Math.random() * 0.1).toFixed(4),
        lon: (56.2 + Math.random() * 0.1).toFixed(4),
        fuel: Math.max(40, prev.fuel - Math.random() * 0.3),
        signal: Math.max(60, Math.min(100, prev.signal + (Math.random() - 0.5) * 6))
      }));
    }, 800);
    return () => clearInterval(interval);
  }, [isVisible]);

  // IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="war-footage"
      style={{
        padding: '100px 24px',
        maxWidth: '1280px',
        margin: '0 auto',
        position: 'relative'
      }}
    >
      {/* Section Header */}
      <div className={`scroll-reveal ${isVisible ? 'revealed' : ''}`} style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'inline-flex', gap: '8px', marginBottom: '12px' }}>
          <span className="badge-classified" style={{ background: 'rgba(255, 74, 74, 0.2)', borderColor: 'rgba(255, 74, 74, 0.5)' }}>
            <Eye size={14} />
            FOOTAGE CLASSIFICADO // NÍVEL RESTRITO
          </span>
        </div>
        <h2 className="font-display glow-cyan" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#fff', textTransform: 'uppercase' }}>
          VISÃO DE COMBATE REAL
        </h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', maxWidth: '720px', margin: '0 auto' }}>
          Imagens reais capturadas pela câmera óptica do drone durante operações de reconhecimento sobre o Estreito de Ormuz.
        </p>
      </div>

      {/* Video Container with HUD Overlay */}
      <div
        className={`scroll-reveal-scale ${isVisible ? 'revealed' : ''}`}
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          aspectRatio: '16/9',
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 0 60px rgba(0, 242, 255, 0.15), 0 0 120px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(0, 242, 255, 0.25)',
          transitionDelay: '0.15s'
        }}
      >
        {/* Actual Video */}
        <video
          src="/assets/video-drone/51bae96f99492dd57cd2fa7d0510443e_1_1777395918_8000.mp4"
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            filter: 'contrast(1.15) saturate(0.85)'
          }}
        />

        {/* Scanlines + HUD Overlay */}
        <div className="video-hud-overlay" />

        {/* Vignette */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.6) 100%)',
          pointerEvents: 'none',
          zIndex: 3
        }} />

        {/* Top HUD Bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 4,
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, transparent 100%)'
        }}>
          {/* Left: Recording indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: 'rgba(255, 74, 74, 0.25)',
              border: '1px solid rgba(255, 74, 74, 0.5)',
              borderRadius: '4px'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--red)',
                animation: 'pulse 1.2s infinite'
              }} />
              <span className="font-tech" style={{ fontSize: '0.7rem', color: 'var(--red)', fontWeight: 700, letterSpacing: '1px' }}>
                ● REC
              </span>
            </div>
            <span className="font-tech" style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.6)' }}>
              CAM-01 // SHAHED OPTIC
            </span>
          </div>

          {/* Right: Signal & Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Wifi size={12} color={telemetry.signal > 80 ? 'var(--green)' : 'var(--gold)'} />
              <span className="font-tech" style={{ fontSize: '0.65rem', color: 'var(--green)', fontWeight: 600 }}>
                {Math.floor(telemetry.signal)}%
              </span>
            </div>
            <span className="font-tech" style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.5)' }}>
              {new Date().toLocaleTimeString('pt-BR')} UTC-3
            </span>
          </div>
        </div>

        {/* Bottom HUD Bar — Telemetry */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          pointerEvents: 'none',
          zIndex: 4,
          background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.7) 0%, transparent 100%)'
        }}>
          {/* Telemetry Data */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <TelemetryItem label="ALT" value={`${Math.floor(telemetry.alt)}M`} color="var(--cyan)" />
            <TelemetryItem label="SPD" value={`${Math.floor(telemetry.spd)} KM/H`} color="var(--gold)" />
            <TelemetryItem label="HDG" value={`${Math.floor(telemetry.hdg)}°`} color="var(--cyan)" />
            <TelemetryItem label="FUEL" value={`${Math.floor(telemetry.fuel)}%`} color={telemetry.fuel > 60 ? 'var(--green)' : 'var(--red)'} />
          </div>

          {/* Coordinates */}
          <div className="font-tech" style={{
            fontSize: '0.65rem',
            color: 'rgba(0, 242, 255, 0.7)',
            padding: '4px 10px',
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '4px',
            border: '1px solid rgba(0, 242, 255, 0.15)'
          }}>
            📍 {telemetry.lat}°N {telemetry.lon}°E // ESTREITO DE ORMUZ
          </div>
        </div>

        {/* Center Crosshair */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 4
        }}>
          {/* Thin crosshair lines */}
          <div style={{
            width: '80px',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.4), transparent)',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }} />
          <div style={{
            width: '1px',
            height: '80px',
            background: 'linear-gradient(180deg, transparent, rgba(0, 242, 255, 0.4), transparent)',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }} />
          {/* Small diamond */}
          <div style={{
            width: '12px',
            height: '12px',
            border: '1px solid rgba(0, 242, 255, 0.5)',
            transform: 'rotate(45deg)',
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: '-6px',
            marginLeft: '-6px'
          }} />
        </div>
      </div>

      {/* Classification Warning */}
      <div
        className={`scroll-reveal ${isVisible ? 'revealed' : ''}`}
        style={{
          maxWidth: '960px',
          margin: '20px auto 0',
          padding: '12px 20px',
          background: 'rgba(255, 74, 74, 0.06)',
          border: '1px dashed rgba(255, 74, 74, 0.3)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          transitionDelay: '0.3s'
        }}
      >
        <AlertTriangle size={16} color="var(--red)" style={{ flexShrink: 0 }} />
        <span>
          <strong style={{ color: 'var(--red)' }}>AVISO DE CLASSIFICAÇÃO:</strong> As imagens acima são simulações in-game renderizadas em tempo real pela engine de combate. Nenhuma operação real é retratada.
        </span>
      </div>
    </section>
  );
}

function TelemetryItem({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
      <span className="font-tech" style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontWeight: 600 }}>{label}:</span>
      <span className="font-tech" style={{ fontSize: '0.75rem', color, fontWeight: 700 }}>{value}</span>
    </div>
  );
}
