import React, { useEffect, useRef, useState } from 'react';
import { Shield, Play, Smartphone, Globe, Lock, Anchor } from 'lucide-react';
import ServerStatus from './ServerStatus';

export default function Footer({ onOpenAuth }) {
  const footerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (footerRef.current) observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <footer ref={footerRef} style={{
      background: 'linear-gradient(180deg, var(--bg-dark) 0%, rgba(3, 7, 13, 0.98) 100%)',
      borderTop: '1px solid rgba(0, 242, 255, 0.15)',
      padding: '80px 24px 40px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle background image of warships */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url(/assets/images/fundo.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
        opacity: 0.04,
        filter: 'saturate(0) contrast(1.2)',
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '40px',
        marginBottom: '60px',
        position: 'relative'
      }}>
        {/* Coluna 1: Sobre */}
        <div className={`scroll-reveal ${isVisible ? 'revealed' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <img src="/assets/sem fundo.png" alt="Logo" style={{ height: '36px' }} onError={(e) => e.target.style.display = 'none'} />
            <span className="font-display glow-cyan" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--cyan)' }}>
              BATALHA DO ESTREITO 2.0
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '20px' }}>
            O simulador definitivo de combate aeronaval com Drones Kamikaze Shahed-136, inteligência artificial e economia com comissão de 10% da casa.
          </p>
          <ServerStatus />
        </div>

        {/* Coluna 2: Acesso Rápido */}
        <div className={`scroll-reveal stagger-1 ${isVisible ? 'revealed' : ''}`}>
          <h4 className="font-display" style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '16px', textTransform: 'uppercase' }}>
            Navegação Tática
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
            {[
              { href: '#dossier', text: 'Dossiê da Crise 2026' },
              { href: '#war-footage', text: 'Footage de Combate' },
              { href: '#arsenal', text: 'Showroom de Armamentos 3D' },
              { href: '#simulator', text: 'Simulador de Tiro' },
              { href: '#gameplay', text: 'Mecânicas de Combate' },
              { href: '#ranking', text: 'Ranking Global de Almirantes' }
            ].map((link, i) => (
              <li key={i}>
                <a
                  href={link.href}
                  style={{
                    color: 'var(--text-muted)',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--cyan)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <Anchor size={12} color="var(--cyan)" style={{ opacity: 0.5 }} />
                  {link.text}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Coluna 3: Plataforma & Tecnologia */}
        <div className={`scroll-reveal stagger-2 ${isVisible ? 'revealed' : ''}`}>
          <h4 className="font-display" style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '16px', textTransform: 'uppercase' }}>
            Tecnologia & PWA
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Smartphone size={14} color="var(--cyan)" />
              <span>Instalação PWA sem Loja</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={14} color="var(--green)" />
              <span>WebGL / Three.js 3D Engine</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} color="var(--gold)" />
              <span>Criptografia JWT & Anti-Cheat</span>
            </li>
          </ul>
        </div>

        {/* Coluna 4: CTA de Combate */}
        <div className={`scroll-reveal stagger-3 ${isVisible ? 'revealed' : ''}`}>
          <h4 className="font-display" style={{ fontSize: '0.9rem', color: 'var(--gold)', marginBottom: '16px', textTransform: 'uppercase' }}>
            Pronto para o Combate?
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Aliste-se agora, receba 1.000 moedas de boas-vindas e comande sua frota.
          </p>
          <a
            href={import.meta.env.VITE_GAME_URL || 'http://localhost:3000'}
            target="_blank"
            rel="noreferrer"
            className="btn-tactical btn-tactical-green"
            style={{
              width: '100%',
              padding: '14px',
              boxShadow: '0 0 25px rgba(0, 255, 136, 0.15)'
            }}
          >
            <Play size={14} fill="currentColor" />
            <span>LANÇAR APLICATIVO</span>
          </a>
        </div>
      </div>

      {/* Linha de Copyright */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        paddingTop: '24px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '0.75rem',
        color: 'var(--text-dim)',
        position: 'relative'
      }}>
        <div>
          © 2026 Batalha do Estreito 2.0 — Todos os direitos reservados.
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Jogo fictício de estratégia militar. Jogue com responsabilidade.</span>
        </div>
      </div>
    </footer>
  );
}
