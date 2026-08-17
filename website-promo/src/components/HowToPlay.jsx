import React from 'react';
import { Shield, Grid, Target } from 'lucide-react';

export default function HowToPlay() {
  const steps = [
    { num: '01', icon: <Shield size={32} color="var(--cyan)" />, title: 'ALISTAR', desc: 'Crie sua conta, receba 1.000 moedas de boas-vindas e escolha seu apelido tático.' },
    { num: '02', icon: <Grid size={32} color="var(--green)" />, title: 'POSICIONAR', desc: 'Distribua suas 5 embarcações no grid 10x10. Estratégia é tudo no Estreito.' },
    { num: '03', icon: <Target size={32} color="var(--red)" />, title: 'ATACAR', desc: 'Lance drones Shahed-136, destrua a frota inimiga e embolse o pote.' },
  ];

  return (
    <section id="how-to-play" style={{
      padding: '100px 24px',
      maxWidth: '1280px',
      margin: '0 auto',
      position: 'relative'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
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
        {/* Linha conectando os passos (apenas desktop) */}
        <div className="steps-connector" style={{
          position: 'absolute',
          top: '40px',
          left: '10%',
          right: '10%',
          height: '2px',
          background: 'var(--border-glass)',
          zIndex: 0
        }} />

        {steps.map((step, idx) => (
          <div key={idx} className="tactical-card" style={{ zIndex: 1, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div className="font-display" style={{
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              fontSize: '4rem',
              fontWeight: 900,
              color: 'rgba(255, 255, 255, 0.03)',
              lineHeight: 1
            }}>
              {step.num}
            </div>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--bg-dark)',
              border: '2px solid var(--border-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 0 20px var(--cyan-dim)'
            }}>
              {step.icon}
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
          .steps-connector { display: none; }
        }
      `}</style>
    </section>
  );
}
