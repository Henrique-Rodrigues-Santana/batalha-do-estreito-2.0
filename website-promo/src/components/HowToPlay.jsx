import React, { useEffect, useRef, useState } from 'react';
import { Shield, Grid, Target } from 'lucide-react';

export default function HowToPlay() {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      num: '01',
      icon: <Shield size={32} color="var(--cyan)" />,
      title: 'ALISTAR',
      desc: 'Crie sua conta, receba 1.000 moedas de boas-vindas e escolha seu apelido tático.',
      color: 'var(--cyan)'
    },
    {
      num: '02',
      icon: <Grid size={32} color="var(--green)" />,
      title: 'POSICIONAR',
      desc: 'Distribua suas 5 embarcações no grid 10x10. Estratégia é tudo no Estreito.',
      color: 'var(--green)'
    },
    {
      num: '03',
      icon: <Target size={32} color="var(--red)" />,
      title: 'ATACAR',
      desc: 'Lance drones Shahed-136, destrua a frota inimiga e embolse o pote.',
      color: 'var(--red)'
    },
  ];

  return (
    <section id="how-to-play" ref={sectionRef} style={{
      padding: '100px 24px',
      maxWidth: '1280px',
      margin: '0 auto',
      position: 'relative'
    }}>
      <div className={`scroll-reveal ${isVisible ? 'revealed' : ''}`} style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h2 className="font-display glow-cyan" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#fff', textTransform: 'uppercase' }}>
          COMO ENTRAR NO COMBATE
        </h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', maxWidth: '680px', margin: '12px auto 0' }}>
          Três passos simples para iniciar sua campanha naval e conquistar o domínio do Estreito.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        position: 'relative'
      }}>
        {/* Animated connector line (desktop only) */}
        <div className="step-connector steps-connector" style={{
          position: 'absolute',
          top: '56px',
          left: '10%',
          right: '10%',
          height: '3px',
          zIndex: 0,
          borderRadius: '2px'
        }} />

        {steps.map((step, idx) => (
          <div
            key={idx}
            className={`tactical-card scroll-reveal stagger-${idx + 1} ${isVisible ? 'revealed' : ''}`}
            style={{
              zIndex: 1,
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.4s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = step.color;
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = `0 12px 40px ${step.color}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '';
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            {/* Large watermark number */}
            <div className="font-display" style={{
              position: 'absolute',
              top: '-12px',
              right: '-8px',
              fontSize: '5rem',
              fontWeight: 900,
              color: 'rgba(255, 255, 255, 0.03)',
              lineHeight: 1,
              pointerEvents: 'none'
            }}>
              {step.num}
            </div>

            {/* Icon circle with glow */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--bg-dark)',
              border: `2px solid ${step.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: `0 0 25px ${step.color}30, inset 0 0 15px ${step.color}10`,
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}>
              {step.icon}
            </div>

            {/* Step number tag */}
            <div className="font-tech" style={{
              display: 'inline-block',
              padding: '2px 10px',
              background: `${step.color}15`,
              border: `1px solid ${step.color}40`,
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: step.color,
              letterSpacing: '1px',
              marginBottom: '12px'
            }}>
              PASSO {step.num}
            </div>

            <h3 className="font-display" style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '12px' }}>
              {step.title}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              {step.desc}
            </p>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .steps-connector { display: none !important; }
        }
      `}</style>
    </section>
  );
}
