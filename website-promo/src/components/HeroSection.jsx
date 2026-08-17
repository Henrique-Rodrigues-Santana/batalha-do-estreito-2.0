import React from 'react';
import HeroScene3D from '../3d/HeroScene3D';
import { Play, Shield, Crosshair, Radio, Zap } from 'lucide-react';

export default function HeroSection({ onOpenAuth }) {
  return (
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '120px 24px 60px',
      overflow: 'hidden'
    }}>
      {/* Canvas 3D de Fundo */}
      <HeroScene3D />

      {/* Grid Overlay e Gradiente */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 50% 40%, transparent 20%, rgba(5, 11, 20, 0.8) 70%, var(--bg-dark) 100%)',
        pointerEvents: 'none'
      }} />

      {/* Conteúdo Central */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '900px',
        width: '100%',
        textAlign: 'center',
        margin: '0 auto'
      }}>
        {/* Badges de Status Militar */}
        <div style={{ display: 'inline-flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span className="badge-classified">
            <Radio size={14} />
            OPERAÇÃO ESTREITO DE FERRO
          </span>
          <span className="badge-active">
            <Zap size={14} />
            MULTIPLAYER 3D & APOSTAS AO VIVO
          </span>
        </div>

        {/* Título Principal */}
        <h1 className="font-display glow-cyan" style={{
          fontSize: 'clamp(2.2rem, 6vw, 4.2rem)',
          fontWeight: 900,
          lineHeight: 1.1,
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          marginBottom: '16px'
        }}>
          BATALHA DO <span style={{ color: 'var(--cyan)' }}>ESTREITO 2.0</span>
        </h1>

        {/* Subtítulo / Lore Hook */}
        <p style={{
          fontSize: 'clamp(0.95rem, 2vw, 1.25rem)',
          color: 'var(--text-muted)',
          maxWidth: '720px',
          margin: '0 auto 36px',
          lineHeight: 1.6
        }}>
          O maior teatro de guerra aeronaval do Oriente Médio. Comande esquadrões de <strong style={{ color: 'var(--cyan)' }}>Drones Kamikaze Shahed-136</strong>, antecipe os radares inimigos e conquiste o domínio absoluto dos mares.
        </p>

        {/* Botões de Ação */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="btn-tactical btn-tactical-green"
            style={{ padding: '16px 36px', fontSize: '0.95rem' }}
          >
            <Play size={18} fill="currentColor" />
            <span>ENTRAR EM COMBATE</span>
          </a>

          <button
            onClick={() => onOpenAuth('register')}
            className="btn-tactical"
            style={{ padding: '16px 32px', fontSize: '0.95rem' }}
          >
            <Shield size={18} />
            <span>ALISTAR COMANDANTE</span>
          </button>
        </div>

        {/* Telemetria Tática HUD */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginTop: '60px',
          padding: '16px 24px',
          background: 'rgba(5, 11, 20, 0.75)',
          border: '1px solid rgba(0, 242, 255, 0.2)',
          borderRadius: '12px',
          backdropFilter: 'blur(8px)'
        }}>
          <div>
            <div className="font-tech" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>ZONA DE OPERAÇÕES</div>
            <div className="font-display" style={{ fontSize: '0.9rem', color: 'var(--cyan)', fontWeight: 700 }}>25.04° N / 56.40° E</div>
          </div>
          <div>
            <div className="font-tech" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>SISTEMA DE ARMAS</div>
            <div className="font-display" style={{ fontSize: '0.9rem', color: 'var(--green)', fontWeight: 700 }}>UAV-136 KAMIKAZE</div>
          </div>
          <div>
            <div className="font-tech" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>ECONOMIA TÁTICA</div>
            <div className="font-display" style={{ fontSize: '0.9rem', color: 'var(--gold)', fontWeight: 700 }}>10% RAKE DA CASA</div>
          </div>
          <div>
            <div className="font-tech" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>PLATAFORMA</div>
            <div className="font-display" style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 700 }}>PWA WEB (SEM LOJA)</div>
          </div>
        </div>
      </div>
    </section>
  );
}
