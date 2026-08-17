import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Award, Trophy, TrendingUp, Coins, LogOut, X, Play } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, onOpenMarketplace }) {
  const { user, logout, getMilitaryRank } = useAuth();

  if (!isOpen || !user) return null;

  const rank = getMilitaryRank();
  const wins = user.total_wins || 0;
  const losses = user.total_losses || 0;
  const totalMatches = wins + losses;
  const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : '0.0';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="tactical-card" style={{
        maxWidth: '480px',
        width: '100%',
        position: 'relative',
        boxShadow: '0 0 50px rgba(0, 242, 255, 0.2)'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        {/* Perfil Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(0, 242, 255, 0.2), rgba(0, 255, 136, 0.1))',
            border: `2px solid ${rank.color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: `0 0 20px ${rank.color}44`
          }}>
            <Shield size={36} color={rank.color} />
          </div>

          <h2 className="font-display glow-cyan" style={{ fontSize: '1.3rem', color: '#fff' }}>
            {user.username}
          </h2>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '6px',
            padding: '4px 12px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${rank.color}66`,
            borderRadius: '20px'
          }}>
            <Award size={14} color={rank.color} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: rank.color }}>
              {rank.title}
            </span>
          </div>
        </div>

        {/* Saldo da Carteira */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 18px',
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(0, 0, 0, 0.4))',
          border: '1px solid var(--gold)',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Saldo Disponível
            </div>
            <div className="font-display" style={{ fontSize: '1.3rem', color: 'var(--gold)', fontWeight: 800 }}>
              💰 {Math.floor(user.coins || 0).toLocaleString()}
            </div>
          </div>
          <button
            onClick={() => { onClose(); onOpenMarketplace(); }}
            className="btn-tactical btn-tactical-gold"
            style={{ padding: '8px 16px', fontSize: '0.75rem' }}
          >
            <Coins size={14} />
            <span>LOJA / RECARGA</span>
          </button>
        </div>

        {/* Estatísticas de Combate */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginBottom: '24px'
        }}>
          <div style={{ padding: '12px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <Trophy size={14} color="var(--cyan)" />
              <span>VITÓRIAS</span>
            </div>
            <div className="font-display" style={{ fontSize: '1.1rem', color: 'var(--green)', fontWeight: 700 }}>
              {wins}
            </div>
          </div>

          <div style={{ padding: '12px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <Shield size={14} color="var(--red)" />
              <span>DERROTAS</span>
            </div>
            <div className="font-display" style={{ fontSize: '1.1rem', color: 'var(--red)', fontWeight: 700 }}>
              {losses}
            </div>
          </div>

          <div style={{ padding: '12px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <TrendingUp size={14} color="var(--gold)" />
              <span>TAXA W/L</span>
            </div>
            <div className="font-display" style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>
              {winRate}%
            </div>
          </div>

          <div style={{ padding: '12px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <Coins size={14} color="var(--gold)" />
              <span>LUCRO TOTAL</span>
            </div>
            <div className="font-display" style={{ fontSize: '1.1rem', color: 'var(--gold)', fontWeight: 700 }}>
              +{Math.floor(user.total_earnings || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="btn-tactical btn-tactical-green"
            style={{ flex: 1, padding: '12px' }}
          >
            <Play size={14} fill="currentColor" />
            <span>INICIAR JOGO</span>
          </a>
          <button
            onClick={() => { logout(); onClose(); }}
            className="btn-tactical"
            style={{
              borderColor: 'rgba(255, 74, 74, 0.4)',
              color: 'var(--red)',
              background: 'rgba(255, 74, 74, 0.1)',
              padding: '12px 18px'
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
