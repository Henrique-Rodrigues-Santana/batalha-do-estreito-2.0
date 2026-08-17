import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Coins, User, LogIn, Menu, X, Play, ShoppingCart, Award } from 'lucide-react';

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
      background: 'linear-gradient(180deg, rgba(5, 11, 20, 0.95) 0%, rgba(5, 11, 20, 0.8) 70%, transparent 100%)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(0, 242, 255, 0.15)',
      padding: '12px 24px'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Logo */}
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <img
            src="/assets/sem fundo.png"
            alt="Logo"
            style={{ height: '42px', filter: 'drop-shadow(0 0 10px rgba(0, 242, 255, 0.5))' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div>
            <div className="font-display glow-cyan" style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--cyan)', letterSpacing: '2px' }}>
              BATALHA DO ESTREITO
            </div>
            <div className="font-tech" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>
              OPERAÇÃO MULTIPLAYER 2.0
            </div>
          </div>
        </a>

        {/* Links de Navegação Desktop */}
        <nav style={{ display: 'none', alignItems: 'center', gap: '24px' }} className="desktop-nav">
          <a href="#dossier" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
            DOSSIÊ 2026
          </a>
          <a href="#cinematics" style={{ color: 'var(--cyan)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}>
            🎬 CINEMÁTICA 3D
          </a>
          <a href="#arsenal" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
            ARSENAL 3D
          </a>
          <a href="#simulator" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
            SIMULADOR
          </a>
          <a href="#gameplay" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
            MECÂNICAS
          </a>
          <a href="#ranking" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
            RANKING
          </a>
        </nav>

        {/* Ações / Carteira / Login */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <>
              {/* Carteira */}
              <button
                onClick={onOpenMarketplace}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  background: 'rgba(255, 215, 0, 0.1)',
                  border: '1px solid var(--gold)',
                  borderRadius: '20px',
                  color: 'var(--gold)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Coins size={15} />
                <span>{Math.floor(user.coins || 0).toLocaleString()}</span>
                <span style={{ fontSize: '0.9rem', marginLeft: '2px', opacity: 0.8 }}>+</span>
              </button>

              {/* Perfil */}
              <button
                onClick={onOpenProfile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  background: 'rgba(0, 242, 255, 0.1)',
                  border: '1px solid var(--cyan)',
                  borderRadius: '20px',
                  color: 'var(--cyan)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Shield size={15} color={rank.color} />
                <span>{user.username}</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => onOpenAuth('login')}
              className="btn-tactical"
              style={{ padding: '8px 18px', fontSize: '0.75rem' }}
            >
              <LogIn size={14} />
              <span>ALISTAR-SE</span>
            </button>
          )}

          {/* Jogar Agora CTA */}
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="btn-tactical btn-tactical-green"
            style={{ padding: '8px 18px', fontSize: '0.75rem' }}
          >
            <Play size={14} fill="currentColor" />
            <span>JOGAR</span>
          </a>

          {/* Toggle Mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              color: 'var(--cyan)',
              cursor: 'pointer',
              padding: '6px'
            }}
            className="mobile-toggle"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div style={{
          padding: '20px 0 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          borderTop: '1px solid rgba(0, 242, 255, 0.1)',
          marginTop: '12px'
        }}>
          <a href="#dossier" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
            DOSSIÊ 2026
          </a>
          <a href="#arsenal" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
            ARSENAL 3D
          </a>
          <a href="#simulator" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
            SIMULADOR
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
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
      `}</style>
    </header>
  );
}
