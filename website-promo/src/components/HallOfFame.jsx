import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Crown, Shield } from 'lucide-react';

export default function HallOfFame() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ranking')
      .then(res => res.json())
      .then(data => {
        setRanking(data || []);
        setLoading(false);
      })
      .catch(() => {
        // Fallback para exibição promocional
        setRanking([
          { username: 'AlmiranteHawk', rank_points: 1450, total_wins: 48, total_losses: 12, total_earnings: 28400 },
          { username: 'ComandanteViper', rank_points: 1380, total_wins: 39, total_losses: 15, total_earnings: 19200 },
          { username: 'CapitaoTempest', rank_points: 1290, total_wins: 31, total_losses: 18, total_earnings: 14500 },
          { username: 'GhostShahed', rank_points: 1220, total_wins: 26, total_losses: 14, total_earnings: 11000 },
          { username: 'IronNavy', rank_points: 1160, total_wins: 20, total_losses: 16, total_earnings: 8200 }
        ]);
        setLoading(false);
      });
  }, []);

  return (
    <section id="ranking" style={{
      padding: '100px 24px',
      maxWidth: '1280px',
      margin: '0 auto',
      position: 'relative'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <div style={{ display: 'inline-flex', gap: '8px', marginBottom: '12px' }}>
          <span className="badge-classified badge-top-secret">
            <Trophy size={14} />
            SALÃO DA FAMA // TOP 10 GLOBAL
          </span>
        </div>
        <h2 className="font-display glow-gold" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: 'var(--gold)', textTransform: 'uppercase' }}>
          RANKING DOS ALMIRANTES
        </h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto' }}>
          Os comandantes navais mais temidos do Estreito. Conquiste vitórias, acumule potes e crave seu nome na elite militar.
        </p>
      </div>

      <div className="tactical-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '16px 20px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-cyan)', color: 'var(--cyan)', textAlign: 'left' }}>
              <th style={{ padding: '12px 8px', width: '50px' }}>#</th>
              <th style={{ padding: '12px 8px' }}>COMANDANTE</th>
              <th style={{ padding: '12px 8px', textAlign: 'center' }}>PONTOS ELO</th>
              <th style={{ padding: '12px 8px', textAlign: 'center' }}>V/D</th>
              <th style={{ padding: '12px 8px', textAlign: 'right' }}>LUCRO TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {ranking.slice(0, 10).map((player, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: '1px solid var(--border-glass)',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 242, 255, 0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '14px 8px', fontWeight: 800 }}>
                  {idx === 0 && <span style={{ color: 'var(--gold)' }}>🥇 1</span>}
                  {idx === 1 && <span style={{ color: '#cbd5e1' }}>🥈 2</span>}
                  {idx === 2 && <span style={{ color: '#b45309' }}>🥉 3</span>}
                  {idx > 2 && <span style={{ color: 'var(--text-dim)' }}>{idx + 1}</span>}
                </td>

                <td style={{ padding: '14px 8px', fontWeight: 700, color: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={14} color={idx === 0 ? 'var(--gold)' : 'var(--cyan)'} />
                    <span>{player.username}</span>
                  </div>
                </td>

                <td className="font-display" style={{ padding: '14px 8px', textAlign: 'center', color: 'var(--cyan)', fontWeight: 700 }}>
                  {player.rank_points || 1000}
                </td>

                <td style={{ padding: '14px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--green)' }}>{player.total_wins || 0}</span> / <span style={{ color: 'var(--red)' }}>{player.total_losses || 0}</span>
                </td>

                <td className="font-display" style={{ padding: '14px 8px', textAlign: 'right', color: 'var(--gold)', fontWeight: 700 }}>
                  💰 {Math.floor(player.total_earnings || 0).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
