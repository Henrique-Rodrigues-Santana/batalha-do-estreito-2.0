import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Coins, LogIn, Menu, X, Play } from 'lucide-react';

export default function Navbar({ onOpenAuth, onOpenProfile, onOpenMarketplace }) {
  const { user, getMilitaryRank } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const rank = getMilitaryRank();

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      zIndex: 1000,
      background: 'linear-gradient(180deg, rgba(5, 11, 20, 0.97) 0%, rgba(5, 11, 20, 0.88) 80%, transparent 100%)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(0, 242, 255, 0.18)',
      padding: '8px 24px'
    }}>
      <div style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '72px'
      }}>
        {/* Logo Ampliado (+15px) e Imponente */}
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '16px', textDecoration: 'none', flexShrink: 0 }}>
          <img
            src="/assets/sem fundo.png"
            alt="Logo Batalha do Estreito"
            style={{
              height: '69px',
              width: 'auto',
              filter: 'drop-shadow(0 0 14px rgba(0, 242, 255, 0.6))',
              transition: 'transform 0.2s ease'
            }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="font-display glow-cyan" style={{
              fontSize: '1.35rem',
              fontWeight: 900,
              color: 'var(--cyan)',
              letterSpacing: '2.8px',
              lineHeight: 1.15
            }}>
              BATALHA DO ESTREITO
            </div>
            <div className="font-tech" style={{
              fontSize: '0.76rem',
              color: 'var(--text-muted)',
              letterSpacing: '1.8px',
              fontWeight: 600
            }}>
              OPERAÇÃO MULTIPLAYER 2.0
            </div>
          </div>
        </a>

        {/* Links de Navegação Desktop */}
        <nav className="desktop-nav" style={{ alignItems: 'center', gap: '26px', height: '100%', margin: '0 auto' }}>
          <a href="#dossier" className="nav-link">DOSSIÊ 2026</a>
          <a href="#cinematics" className="nav-link nav-link-active">🎬 CINEMÁTICA 3D</a>
          <a href="#arsenal" className="nav-link">ARSENAL 3D</a>
          <a href="#simulator" className="nav-link">SIMULADOR</a>
          <a href="#how-to-play" className="nav-link">COMO JOGAR</a>
          <a href="#gameplay" className="nav-link">MECÂNICAS</a>
          <a href="#ranking" className="nav-link">RANKING</a>
        </nav>

        {/* Ações / Botões Fixados no Canto Direito com Mesmo Tamanho e Bordas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', height: '100%', flexShrink: 0 }}>
          {user ? (
            <>
              {/* Carteira de Moedas */}
              <button
                onClick={onOpenMarketplace}
                style={{
                  height: '42px',
                  minWidth: '135px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '0 16px',
                  background: 'rgba(255, 215, 0, 0.12)',
                  border: '1.5px solid var(--gold)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--gold)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 0 14px rgba(255, 215, 0, 0.18)'
                }}
              >
                <Coins size={16} />
                <span>{Math.floor(user.coins || 0).toLocaleString()}</span>
                <span style={{ fontSize: '1rem', marginLeft: '2px', opacity: 0.9 }}>+</span>
              </button>

              {/* Perfil de Comandante */}
              <button
                onClick={onOpenProfile}
                style={{
                  height: '42px',
                  minWidth: '135px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '0 16px',
                  background: 'rgba(0, 242, 255, 0.12)',
                  border: '1.5px solid var(--cyan)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--cyan)',
                  fontFamily: 'var(--font-tech)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 0 14px rgba(0, 242, 255, 0.18)'
                }}
              >
                <Shield size={16} color={rank.color} />
                <span>{user.username}</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => onOpenAuth('login')}
              className="btn-tactical"
              style={{
                width: '145px',
                height: '42px',
                padding: '0',
                fontSize: '0.82rem',
                border: '1.5px solid var(--cyan)',
                boxShadow: '0 0 14px rgba(0, 242, 255, 0.2)'
              }}
            >
              <LogIn size={15} />
              <span>ALISTAR-SE</span>
            </button>
          )}

          {/* Jogar Agora CTA — Mesmo Tamanho Exato e Borda */}
          <a
            href={import.meta.env.VITE_GAME_URL || 'http://localhost:3000'}
            target="_blank"
            rel="noreferrer"
            className="btn-tactical btn-tactical-green"
            style={{
              width: '145px',
              height: '42px',
              padding: '0',
              fontSize: '0.82rem',
              border: '1.5px solid var(--green)',
              boxShadow: '0 0 14px rgba(0, 255, 136, 0.25)'
            }}
          >
            <Play size={15} fill="currentColor" />
            <span>JOGAR</span>
          </a>

          {/* Toggle Mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              height: '42px',
              width: '42px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 242, 255, 0.08)',
              border: '1.5px solid var(--border-cyan)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--cyan)',
              cursor: 'pointer',
              padding: 0
            }}
            className="mobile-toggle"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div style={{
          padding: '20px 8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          borderTop: '1px solid rgba(0, 242, 255, 0.15)',
          marginTop: '10px'
        }}>
          <a href="#dossier" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
            DOSSIÊ 2026
          </a>
          <a href="#cinematics" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--cyan)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 700 }}>
            🎬 CINEMÁTICA 3D
          </a>
          <a href="#arsenal" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
            ARSENAL 3D
          </a>
          <a href="#simulator" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
            SIMULADOR
          </a>
          <a href="#how-to-play" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
            COMO JOGAR
          </a>
          <a href="#gameplay" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
            MECÂNICAS
          </a>
          <a href="#ranking" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
            RANKING
          </a>
        </div>
      )}

      <style>{`
        .desktop-nav { display: none; }
        .nav-link {
          color: var(--text-main);
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.2s ease;
          letter-spacing: 0.8px;
          display: inline-flex;
          align-items: center;
          height: 100%;
          border-bottom: 2px solid transparent;
        }
        .nav-link:hover {
          color: var(--cyan);
          border-bottom-color: var(--cyan);
        }
        .nav-link-active {
          color: var(--cyan);
          font-weight: 700;
          border-bottom-color: var(--cyan);
        }
        @media (min-width: 900px) {
          .desktop-nav { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
      `}</style>
    </header>
  );
}

