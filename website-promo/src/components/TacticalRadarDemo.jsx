import React, { useState, useEffect } from 'react';
import { Target, Play, RotateCcw, Crosshair, Award, ShieldAlert, Cross } from 'lucide-react';

export default function TacticalRadarDemo({ onOpenAuth }) {
  const [shotsLeft, setShotsLeft] = useState(3);
  const [phase, setPhase] = useState('IDLE'); // IDLE, FIRING, MISS, WIN
  const [message, setMessage] = useState('ESCANINANDO SETOR: 3 Disparos Disponíveis');
  const [blips, setBlips] = useState([]);
  const [selectedBlip, setSelectedBlip] = useState(null);
  const [totalFired, setTotalFired] = useState(0);

  // Generate random blips on mount
  useEffect(() => {
    generateBlips();
  }, []);

  const generateBlips = () => {
    const newBlips = [];
    for (let i = 0; i < 5; i++) {
      newBlips.push({
        id: i,
        // angle from 0 to 360
        angle: Math.random() * 360,
        // distance from center (10% to 80% to fit in circle)
        distance: 15 + Math.random() * 65,
        destroyed: false
      });
    }
    setBlips(newBlips);
  };

  const handleBlipClick = (blip) => {
    if (phase !== 'IDLE' && phase !== 'MISS') return;
    if (shotsLeft <= 0) return;

    setSelectedBlip(blip.id);
    setPhase('FIRING');
    setMessage('🚀 DRONE SHAHED-136 A CAMINHO DO ALVO...');
    setShotsLeft(prev => prev - 1);
    setTotalFired(prev => prev + 1);

    setTimeout(() => {
      // Rigged Logic: 
      // 1st shot = Always Miss
      // 2nd shot = 50% Win
      // 3rd shot = Always Win
      let isHit = false;
      if (totalFired === 0) {
        isHit = false; // 1st shot always miss
      } else if (totalFired === 1) {
        isHit = Math.random() > 0.5; // 2nd shot 50/50
      } else {
        isHit = true; // 3rd shot guaranteed win
      }

      setBlips(prev => prev.map(b => b.id === blip.id ? { ...b, destroyed: true } : b));

      if (isHit) {
        setPhase('WIN');
        setMessage('💥 ALVO NEUTRALIZADO! PORTA-AVIÕES INIMIGO DESTRUÍDO!');
      } else {
        setPhase('MISS');
        setMessage(`💧 ÁGUA! Alvo evadiu. ${shotsLeft - 1} Mísseis Restantes.`);
      }
      setSelectedBlip(null);
    }, 1800);
  };

  const resetGame = () => {
    setShotsLeft(3);
    setTotalFired(0);
    setPhase('IDLE');
    setMessage('ESCANINANDO SETOR: 3 Disparos Disponíveis');
    generateBlips();
  };

  return (
    <section id="simulator" style={{
      padding: '100px 24px',
      maxWidth: '1280px',
      margin: '0 auto',
      position: 'relative'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'inline-flex', gap: '8px', marginBottom: '12px' }}>
          <span className="badge-classified badge-active">
            <Target size={14} />
            TREINAMENTO TÁTICO
          </span>
        </div>
        <h2 className="font-display glow-cyan" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#fff', textTransform: 'uppercase' }}>
          RADAR DE BÔNUS
        </h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto' }}>
          Destrua a frota inimiga no radar para provar suas habilidades. Acertando o alvo, você garante um código promocional exclusivo para seu primeiro depósito!
        </p>
      </div>

      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        background: 'linear-gradient(145deg, rgba(13, 27, 42, 0.9), rgba(5, 11, 20, 0.95))',
        border: `1px solid ${phase === 'WIN' ? 'var(--gold)' : 'var(--cyan)'}`,
        borderRadius: '16px',
        padding: '32px',
        boxShadow: phase === 'WIN' ? '0 0 80px rgba(255, 215, 0, 0.2)' : '0 0 40px rgba(0, 242, 255, 0.15)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.5s'
      }}>
        
        {/* HUD Info */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-glass)',
          marginBottom: '32px'
        }}>
          <div>
            <span className="font-tech" style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>MÍSSEIS: </span>
            <strong style={{ color: shotsLeft > 0 ? 'var(--green)' : 'var(--red)', fontSize: '1.2rem' }}>
              {shotsLeft} / 3
            </strong>
          </div>
          <div className="font-tech" style={{ fontSize: '0.8rem', color: phase === 'FIRING' ? 'var(--gold)' : 'var(--cyan)' }}>
            STATUS: {phase === 'WIN' ? 'MISSÃO CUMPRIDA' : phase === 'FIRING' ? 'ENGAGED' : 'SCANNING'}
          </div>
        </div>

        {/* RADAR CONTAINER */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '400px',
          aspectRatio: '1',
          margin: '0 auto',
          background: 'radial-gradient(circle, rgba(0, 50, 40, 0.4) 0%, rgba(5, 11, 20, 0.9) 80%)',
          borderRadius: '50%',
          border: '2px solid rgba(0, 242, 255, 0.3)',
          boxShadow: 'inset 0 0 60px rgba(0, 242, 255, 0.1)',
          overflow: 'hidden'
        }}>
          {/* Concentric Rings */}
          <div className="radar-ring" style={{ width: '33%', height: '33%' }} />
          <div className="radar-ring" style={{ width: '66%', height: '66%' }} />
          
          {/* Crosshairs */}
          <div style={{ position: 'absolute', top: '0', bottom: '0', left: '50%', width: '1px', background: 'rgba(0, 242, 255, 0.2)' }} />
          <div style={{ position: 'absolute', left: '0', right: '0', top: '50%', height: '1px', background: 'rgba(0, 242, 255, 0.2)' }} />

          {/* Sweeping Scanner */}
          <div className="radar-sweep" />

          {/* Blips */}
          {blips.map(blip => {
            if (blip.destroyed) return null;
            // Convert angle and distance to top/left percentages
            const rad = blip.angle * (Math.PI / 180);
            const x = 50 + (blip.distance * Math.cos(rad));
            const y = 50 + (blip.distance * Math.sin(rad));
            const isTargeted = selectedBlip === blip.id;

            return (
              <button
                key={blip.id}
                onClick={() => handleBlipClick(blip)}
                disabled={phase === 'FIRING' || phase === 'WIN'}
                style={{
                  position: 'absolute',
                  top: `${y}%`,
                  left: `${x}%`,
                  transform: 'translate(-50%, -50%)',
                  width: isTargeted ? '24px' : '12px',
                  height: isTargeted ? '24px' : '12px',
                  background: isTargeted ? 'var(--red)' : 'var(--cyan)',
                  borderRadius: '50%',
                  border: isTargeted ? '2px solid #fff' : 'none',
                  cursor: (phase === 'FIRING' || phase === 'WIN') ? 'default' : 'crosshair',
                  boxShadow: `0 0 15px ${isTargeted ? 'var(--red)' : 'var(--cyan)'}`,
                  animation: isTargeted ? 'pulse 0.4s infinite' : 'blipFade 4s infinite',
                  animationDelay: `${blip.angle / 360 * 4}s`, // sync fade roughly with sweep
                  zIndex: 10,
                  transition: 'all 0.3s'
                }}
              />
            );
          })}

          {/* Firing Overlay */}
          {phase === 'FIRING' && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle, rgba(255,0,0,0.2) 0%, transparent 70%)',
              animation: 'pulse 0.5s infinite',
              pointerEvents: 'none',
              zIndex: 20
            }} />
          )}

          {/* WIN OVERLAY INSIDE RADAR */}
          {phase === 'WIN' && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(5, 11, 20, 0.85)',
              backdropFilter: 'blur(4px)',
              zIndex: 30,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              textAlign: 'center'
            }}>
              <Award size={48} color="var(--gold)" style={{ marginBottom: '16px' }} />
              <div className="font-display" style={{ color: 'var(--gold)', fontSize: '1.5rem', marginBottom: '8px' }}>
                ALVO DESTRUÍDO!
              </div>
              <p className="font-tech" style={{ color: '#fff', fontSize: '0.8rem', marginBottom: '16px' }}>
                Você encontrou o Porta-Aviões escondido e ganhou um Suprimento Tático.
              </p>
              <div style={{
                background: 'rgba(255, 215, 0, 0.15)',
                border: '1px dashed var(--gold)',
                padding: '8px 24px',
                borderRadius: '4px',
                color: 'var(--gold)',
                fontWeight: 800,
                letterSpacing: '2px',
                fontSize: '1.2rem',
                marginBottom: '20px'
              }}>
                ALFA-50
              </div>
            </div>
          )}
        </div>

        {/* FEEDBACK & CTA */}
        <div style={{
          marginTop: '32px',
          padding: '16px',
          background: 'rgba(0, 0, 0, 0.4)',
          border: `1px solid ${phase === 'WIN' ? 'var(--gold)' : 'var(--border-glass)'}`,
          borderRadius: '8px',
          textAlign: 'center',
          minHeight: '80px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {phase !== 'WIN' ? (
            <>
              <div className="font-tech" style={{ color: phase === 'MISS' ? 'var(--red)' : 'var(--text-main)', marginBottom: '12px' }}>
                {message}
              </div>
              {phase === 'MISS' && shotsLeft === 0 && (
                <button onClick={resetGame} className="btn-tactical" style={{ padding: '8px 24px', fontSize: '0.8rem' }}>
                  <RotateCcw size={14} /> RECALIBRAR RADAR
                </button>
              )}
            </>
          ) : (
            <div style={{ width: '100%' }}>
              <div className="font-tech" style={{ color: 'var(--gold)', marginBottom: '12px', fontSize: '0.9rem' }}>
                +50 MOEDAS NO PRIMEIRO DEPÓSITO
              </div>
              <button
                onClick={() => onOpenAuth ? onOpenAuth('register') : null}
                className="btn-tactical"
                style={{
                  width: '100%',
                  background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                  color: '#000',
                  boxShadow: '0 0 30px rgba(255, 215, 0, 0.4)'
                }}
              >
                CRIAR CONTA E RESGATAR BÔNUS
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .radar-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border: 1px solid rgba(0, 242, 255, 0.15);
          border-radius: 50%;
          pointer-events: none;
        }
        .radar-sweep {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          transform-origin: 0 0;
          background: conic-gradient(from 0deg, rgba(0, 242, 255, 0.4) 0deg, transparent 60deg, transparent 360deg);
          animation: radarSpin 4s linear infinite;
          pointer-events: none;
        }
        @keyframes radarSpin {
          100% { transform: rotate(360deg); }
        }
        @keyframes blipFade {
          0%, 100% { opacity: 0.2; transform: translate(-50%, -50%) scale(0.8); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
        }
      `}</style>
    </section>
  );
}
