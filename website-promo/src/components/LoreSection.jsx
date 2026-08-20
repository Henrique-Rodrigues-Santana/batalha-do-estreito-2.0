import React, { useEffect, useRef, useState } from 'react';
import { FileText, MapPin, AlertTriangle, ChevronRight } from 'lucide-react';

export default function LoreSection() {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const timeline = [
    {
      year: '2026 — FASE 1',
      title: 'A Queda dos Sistemas de Satélite',
      desc: 'Um ataque cibernético desativa os sistemas GPS civis no Estreito de Ormuz. As marinhas mundiais voltam a depender de sonares táticos e reconhecimento por radar óptico.',
      color: 'var(--cyan)'
    },
    {
      year: '2026 — FASE 2',
      title: 'A Doutrina dos Drones Kamikaze',
      desc: 'Grandes navios de guerra tornam-se alvos fáceis para enxames de drones autônomos de baixo custo e alta precisão. A guerra naval muda para sempre.',
      color: 'var(--gold)'
    },
    {
      year: '2026 — FASE 3',
      title: 'A Batalha pelo Pote Estratégico',
      desc: 'Comandantes mercenários e almirantes veteranos disputam cada milha náutica. Cada acerto rende recompensas de guerra e fortalece a frota dominante.',
      color: 'var(--red)'
    }
  ];

  return (
    <section id="dossier" ref={sectionRef} style={{
      padding: '100px 24px',
      maxWidth: '1280px',
      margin: '0 auto',
      position: 'relative'
    }}>
      {/* Título de Seção */}
      <div className={`scroll-reveal ${isVisible ? 'revealed' : ''}`} style={{ textAlign: 'center', marginBottom: '60px' }}>
        <div style={{ display: 'inline-flex', gap: '8px', marginBottom: '12px' }}>
          <span className="badge-classified badge-top-secret">
            <FileText size={14} />
            DOSSIÊ CLASSIFICADO // NÍVEL ULTRA-SECRETO
          </span>
        </div>
        <h2 className="font-display glow-cyan" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#fff', textTransform: 'uppercase' }}>
          A CRISE DO ESTREITO DE 2026
        </h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto' }}>
          Documentos militares desclassificados revelam os bastidores da disputa que transformou o Estreito de Ormuz no maior tabuleiro de guerra da história moderna.
        </p>
      </div>

      {/* Grid: Documento Militar + Facções */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        marginBottom: '60px'
      }}>
        {/* Card Dossiê */}
        <div
          className={`tactical-card scroll-reveal stagger-1 ${isVisible ? 'revealed' : ''}`}
          style={{ borderLeft: '4px solid var(--cyan)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span className="font-tech" style={{ color: 'var(--cyan)', fontSize: '0.85rem', letterSpacing: '1px' }}>
              RELATÓRIO DE INTELIGÊNCIA #884-TX
            </span>
            <MapPin size={18} color="var(--cyan)" />
          </div>

          <h3 className="font-display" style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '12px' }}>
            O Gargalo Estratégico Global
          </h3>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '16px' }}>
            Com apenas 21 milhas de largura em seu ponto mais estreito, o Estreito de Ormuz é a artéria por onde flui um quinto do suprimento energético do planeta. Em 2026, com o colapso dos tratados internacionais, a área tornou-se uma zona de exclusão militar onde apenas os estrategistas mais frios sobrevivem.
          </p>

          <div style={{
            padding: '12px',
            background: 'rgba(0, 242, 255, 0.05)',
            border: '1px dashed var(--border-cyan)',
            borderRadius: '6px',
            fontSize: '0.75rem',
            color: 'var(--cyan)'
          }}>
            ⚠️ <strong>DIRETIVA MILITAR:</strong> Não confie em radares passivos. Cada disparo de drone consome energia e revela parcialmente sua posição térmica na malha tática.
          </div>
        </div>

        {/* Facções em Conflito — COM IMAGENS */}
        <div
          className={`tactical-card scroll-reveal stagger-2 ${isVisible ? 'revealed' : ''}`}
          style={{ borderLeft: '4px solid var(--gold)', padding: 0, overflow: 'hidden' }}
        >
          <div style={{ padding: '24px 24px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span className="font-tech" style={{ color: 'var(--gold)', fontSize: '0.85rem', letterSpacing: '1px' }}>
                ORDEM DE BATALHA // FACÇÕES
              </span>
              <AlertTriangle size={18} color="var(--gold)" />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {/* Coalizão Guardiã — com imagem de navios americanos */}
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'url(/assets/images/navios americanos.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.2,
                filter: 'saturate(0.5)'
              }} />
              <div style={{
                position: 'relative',
                padding: '16px 24px',
                background: 'linear-gradient(90deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.5) 100%)',
                borderTop: '1px solid rgba(0, 242, 255, 0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--cyan)', fontWeight: 800, fontSize: '0.95rem' }}>⚓ COALIZÃO GUARDIÃ</span>
                  <span className="badge-classified" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>DEFESA</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  Frotas ocidentais blindadas, fragatas pesadas com sistemas de defesa antimíssil CIWS Phalanx e porta-aviões de propulsão nuclear.
                </p>
              </div>
            </div>

            {/* Esquadrão do Estreito — com imagem de navios iranianos */}
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'url(/assets/images/navios iranianos.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.2,
                filter: 'saturate(0.5)'
              }} />
              <div style={{
                position: 'relative',
                padding: '16px 24px',
                background: 'linear-gradient(90deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.5) 100%)',
                borderTop: '1px solid rgba(255, 215, 0, 0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--gold)', fontWeight: 800, fontSize: '0.95rem' }}>⚡ ESQUADRÃO DO ESTREITO</span>
                  <span className="badge-classified badge-top-secret" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>ATAQUE</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  Guerrilha naval assimétrica com barcos rápidos, corvetas camufladas e centenas de lançadores de Drones Shahed-136 em contêineres móveis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Linha do Tempo com Conector Animado */}
      <div style={{ position: 'relative' }}>
        {/* Connector line (desktop only) */}
        <div className="step-connector" style={{
          position: 'absolute',
          top: '28px',
          left: '5%',
          right: '5%',
          height: '2px',
          zIndex: 0,
          borderRadius: '1px'
        }} />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          position: 'relative',
          zIndex: 1
        }}>
          {timeline.map((item, idx) => (
            <div
              key={idx}
              className={`tactical-card scroll-reveal stagger-${idx + 3} ${isVisible ? 'revealed' : ''}`}
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              {/* Phase number watermark */}
              <div className="font-display" style={{
                position: 'absolute',
                top: '-8px',
                right: '-5px',
                fontSize: '5rem',
                fontWeight: 900,
                color: 'rgba(255, 255, 255, 0.025)',
                lineHeight: 1,
                pointerEvents: 'none'
              }}>
                {String(idx + 1).padStart(2, '0')}
              </div>

              {/* Dot indicator */}
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: item.color,
                boxShadow: `0 0 12px ${item.color}`,
                marginBottom: '12px'
              }} />

              <div className="font-tech" style={{ color: item.color, fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                {item.year}
              </div>
              <h4 className="font-display" style={{ fontSize: '1rem', color: '#fff', marginBottom: '8px' }}>
                {item.title}
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .step-connector { display: none; }
        }
      `}</style>
    </section>
  );
}
