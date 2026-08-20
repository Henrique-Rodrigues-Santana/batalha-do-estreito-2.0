import React, { useEffect, useRef, useMemo } from 'react';
import HeroScene3D from '../3d/HeroScene3D';
import { Play, Shield, Radio, Zap } from 'lucide-react';
import gsap from 'gsap';

export default function HeroSection({ onOpenAuth }) {
  const badgesRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const ctaRef = useRef(null);

  // Generate ash particles once
  const ashParticles = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      bottom: `-${Math.random() * 20}px`,
      width: `${2 + Math.random() * 3}px`,
      height: `${2 + Math.random() * 3}px`,
      animationDuration: `${6 + Math.random() * 8}s`,
      animationDelay: `${Math.random() * 8}s`,
      opacity: 0.3 + Math.random() * 0.5,
      background: Math.random() > 0.5
        ? `rgba(255, ${100 + Math.floor(Math.random() * 100)}, 0, 0.7)`
        : `rgba(200, 200, 200, 0.3)`
    }));
  }, []);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // 1. Badges slide in from top with stagger
    tl.fromTo(
      badgesRef.current?.children || [],
      { y: -30, opacity: 0, scale: 0.9 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.15 }
    );

    // 2. Title — dramatic scale entrance
    tl.fromTo(
      titleRef.current,
      { opacity: 0, scale: 0.85, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.8 },
      '-=0.2'
    );

    // 3. Add glitch flash to title after it appears
    tl.to(titleRef.current, {
      keyframes: [
        { x: -3, textShadow: '-3px 0 #ff4a4a, 3px 0 #00f2ff', duration: 0.05 },
        { x: 3, textShadow: '3px 0 #ff4a4a, -3px 0 #00f2ff', duration: 0.05 },
        { x: -1, textShadow: '-1px 0 #ff4a4a, 1px 0 #00f2ff', duration: 0.05 },
        { x: 0, textShadow: '0 0 16px rgba(0, 242, 255, 0.4)', duration: 0.1 }
      ]
    });

    // 4. Subtitle fade in
    tl.fromTo(
      subtitleRef.current,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.6 },
      '-=0.15'
    );

    // 5. CTA buttons pop in with stagger
    tl.fromTo(
      ctaRef.current?.children || [],
      { opacity: 0, y: 20, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.12 },
      '-=0.2'
    );

    return () => tl.kill();
  }, []);

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

      {/* War Vignette — bordas avermelhadas de zona de guerra */}
      <div className="war-vignette" style={{ zIndex: 1 }} />

      {/* Grid Overlay e Gradientes Cinematográficos de Transição Suave */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 50% 35%, transparent 25%, rgba(5, 11, 20, 0.4) 65%, var(--bg-dark) 100%)',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* Degradê na Base para Transição Suave com o Dossiê/Próxima Seção */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '240px',
        background: 'linear-gradient(to bottom, transparent 0%, rgba(5, 11, 20, 0.6) 45%, var(--bg-dark) 100%)',
        pointerEvents: 'none',
        zIndex: 2
      }} />

      {/* Floating Ash / Ember Particles */}
      <div className="ash-particles">
        {ashParticles.map((p, i) => (
          <div
            key={i}
            className="ash-particle"
            style={{
              left: p.left,
              bottom: p.bottom,
              width: p.width,
              height: p.height,
              animationDuration: p.animationDuration,
              animationDelay: p.animationDelay,
              opacity: p.opacity,
              background: p.background
            }}
          />
        ))}
      </div>

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
        <div ref={badgesRef} style={{ display: 'inline-flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span className="badge-classified" style={{ opacity: 0 }}>
            <Radio size={14} />
            OPERAÇÃO ESTREITO DE FERRO
          </span>
          <span className="badge-active" style={{ opacity: 0 }}>
            <Zap size={14} />
            MULTIPLAYER 3D & APOSTAS AO VIVO
          </span>
        </div>

        {/* Título Principal */}
        <h1
          ref={titleRef}
          className="font-display"
          style={{
            fontSize: 'clamp(2.2rem, 6vw, 4.2rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '16px',
            textShadow: '0 0 16px rgba(0, 242, 255, 0.4)',
            opacity: 0
          }}
        >
          BATALHA DO <span style={{ color: 'var(--cyan)' }}>ESTREITO 2.0</span>
        </h1>

        {/* Subtítulo / Lore Hook */}
        <p ref={subtitleRef} style={{
          fontSize: 'clamp(0.95rem, 2vw, 1.25rem)',
          color: 'var(--text-muted)',
          maxWidth: '720px',
          margin: '0 auto 36px',
          lineHeight: 1.6,
          opacity: 0
        }}>
          O maior teatro de guerra aeronaval do Oriente Médio. Comande esquadrões de <strong style={{ color: 'var(--cyan)' }}>Drones Kamikaze Shahed-136</strong>, antecipe os radares inimigos e conquiste o domínio absoluto dos mares.
        </p>

        {/* Botões de Ação */}
        <div ref={ctaRef} style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href={import.meta.env.VITE_GAME_URL || 'http://localhost:3000'}
            target="_blank"
            rel="noreferrer"
            className="btn-tactical btn-tactical-green"
            style={{ padding: '16px 36px', fontSize: '0.95rem', opacity: 0 }}
          >
            <Play size={18} fill="currentColor" />
            <span>ENTRAR EM COMBATE</span>
          </a>

          <button
            onClick={() => onOpenAuth('register')}
            className="btn-tactical"
            style={{ padding: '16px 32px', fontSize: '0.95rem', opacity: 0 }}
          >
            <Shield size={18} />
            <span>ALISTAR COMANDANTE</span>
          </button>
        </div>
      </div>
    </section>
  );
}
