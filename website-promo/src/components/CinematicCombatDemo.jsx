import React, { useState } from 'react';
import CombatSimulation3D from '../3d/CombatSimulation3D';
import { Crosshair, AlertTriangle, Radio, Play, ShieldAlert, Target, Zap } from 'lucide-react';

export default function CinematicCombatDemo() {
  const [viewMode, setViewMode] = useState('attack'); // 'attack' or 'defense'
  const [attackPhase, setAttackPhase] = useState('SEARCHING'); // 'SEARCHING', 'LOCKED', 'DIVING'
  const [impactCount, setImpactCount] = useState(0);
  const [signalLost, setSignalLost] = useState(false);

  const handleSignalLost = () => {
    setSignalLost(true);
    setTimeout(() => setSignalLost(false), 2400);
  };

  return (
    <section id="cinematics" style={{
      padding: '100px 24px',
      maxWidth: '1280px',
      margin: '0 auto',
      position: 'relative'
    }}>
      {/* Título de Seção */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'inline-flex', gap: '8px', marginBottom: '12px' }}>
          <span className="badge-classified badge-active">
            <Radio size={14} />
            HMD COMBAT SYSTEM // CÂMERA DE BICO ÓPTICA
          </span>
        </div>
        <h2 className="font-display glow-cyan" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#fff', textTransform: 'uppercase' }}>
          O IMPACTO DO COMBATE EM 3D
        </h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', maxWidth: '720px', margin: '0 auto' }}>
          Câmera óptica instalada no bico do drone com mira automatizada estilo caça de última geração. O sensor varre o oceano, trava o alvo (Lock-On), arremete e desvia da artilharia pesada até a detonação final!
        </p>
      </div>

      {/* Botões de Seleção de Câmera */}
      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => { setViewMode('attack'); setSignalLost(false); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: viewMode === 'attack' ? 'var(--cyan)' : 'rgba(13, 27, 42, 0.8)',
            color: viewMode === 'attack' ? 'var(--bg-dark)' : 'var(--text-main)',
            border: `1px solid ${viewMode === 'attack' ? 'var(--cyan)' : 'var(--border-cyan)'}`,
            borderRadius: '8px',
            fontFamily: 'var(--font-display)',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: viewMode === 'attack' ? '0 0 24px rgba(0, 242, 255, 0.4)' : 'none'
          }}
        >
          <Target size={16} />
          <span>🚀 VISÃO DO BICO DO DRONE (MIRA HMD + LOCK-ON)</span>
        </button>

        <button
          onClick={() => { setViewMode('defense'); setSignalLost(false); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: viewMode === 'defense' ? 'var(--red)' : 'rgba(13, 27, 42, 0.8)',
            color: viewMode === 'defense' ? '#fff' : 'var(--text-main)',
            border: `1px solid ${viewMode === 'defense' ? 'var(--red)' : 'rgba(255, 74, 74, 0.3)'}`,
            borderRadius: '8px',
            fontFamily: 'var(--font-display)',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: viewMode === 'defense' ? '0 0 24px rgba(255, 74, 74, 0.4)' : 'none'
          }}
        >
          <AlertTriangle size={16} />
          <span>🛡️ VISÃO DEFENSOR (A BORDO DO NAVIO ALVO)</span>
        </button>
      </div>

      {/* Frame Cinemático */}
      <div style={{
        maxWidth: '960px',
        margin: '0 auto',
        aspectRatio: '16/9',
        minHeight: '420px',
        background: 'var(--bg-dark)',
        border: '1px solid var(--border-cyan)',
        borderRadius: '16px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 0 60px rgba(0, 242, 255, 0.15)'
      }}>
        <video
          key={viewMode}
          src={viewMode === 'attack' ? '/assets/video-drone/drone_strike.mp4' : '/assets/video-drone/51bae96f99492dd57cd2fa7d0510443e_1_1777395918_8000.mp4'}
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            filter: viewMode === 'defense' ? 'contrast(1.15) saturate(0.85)' : 'none'
          }}
        />
      </div>
    </section>
  );
}
