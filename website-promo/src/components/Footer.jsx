import React from 'react';
import { Shield, Radio, Play, Smartphone, Globe, Lock } from 'lucide-react';
import ServerStatus from './ServerStatus';

export default function Footer({ onOpenAuth }) {
  return (
    <footer style={{
      background: 'linear-gradient(180deg, var(--bg-dark) 0%, rgba(3, 7, 13, 0.98) 100%)',
      borderTop: '1px solid rgba(0, 242, 255, 0.15)',
      padding: '80px 24px 40px',
      position: 'relative'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '40px',
        marginBottom: '60px'
      }}>
        {/* Coluna 1: Sobre */}
        <div>
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
        <div>
          <h4 className="font-display" style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '16px', textTransform: 'uppercase' }}>
            Navegação Tática
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
            <li><a href="#dossier" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Dossiê da Crise 2026</a></li>
            <li><a href="#arsenal" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Showroom de Armamentos 3D</a></li>
            <li><a href="#simulator" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Simulador de Tiro</a></li>
            <li><a href="#gameplay" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Mecânicas de Combate</a></li>
            <li><a href="#ranking" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Ranking Global de Almirantes</a></li>
          </ul>
        </div>

        {/* Coluna 3: Plataforma & Tecnologia */}
        <div>
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
        <div>
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
            style={{ width: '100%', padding: '12px' }}
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
        color: 'var(--text-dim)'
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
