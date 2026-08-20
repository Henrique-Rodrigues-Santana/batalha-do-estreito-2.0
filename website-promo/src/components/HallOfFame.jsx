import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Shield, Crown } from 'lucide-react';

export default function HallOfFame() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchRanking = () => {
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
    };

    fetchRanking();
    const interval = setInterval(fetchRanking, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="ranking" ref={sectionRef} style={{
      padding: '100px 24px',
      maxWidth: '1280px',
      margin: '0 auto',
      position: 'relative'
    }}>
      <div className={`scroll-reveal ${isVisible ? 'revealed' : ''}`} style={{ textAlign: 'center', marginBottom: '50px' }}>
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

      {/* Champion Spotlight — Top 1 */}
      {!loading && ranking.length > 0 && (
        <div
          className={`scroll-reveal stagger-1 ${isVisible ? 'revealed' : ''}`}
          style={{
            maxWidth: '500px',
            margin: '0 auto 40px',
            padding: '28px',
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.08), rgba(255, 215, 0, 0.02))',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '16px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 0 50px rgba(255, 215, 0, 0.1)'
          }}
        >
          {/* Shimmer overlay */}
          <div className="shimmer-gold" style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '16px',
            pointerEvents: 'none'
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <Crown size={32} color="var(--gold)" style={{ marginBottom: '8px' }} />
            <div className="font-tech" style={{ fontSize: '0.75rem', color: 'var(--gold)', letterSpacing: '2px', marginBottom: '8px' }}>
              👑 ALMIRANTE SUPREMO DO ESTREITO
            </div>
            <div className="font-display" style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 900, marginBottom: '4px' }}>
              {ranking[0].username}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '12px' }}>
              <div>
                <div className="font-tech" style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>ELO</div>
                <div className="font-display counter-glow" style={{ fontSize: '1.3rem', color: 'var(--cyan)' }}>{ranking[0].rank_points || 1000}</div>
              </div>
              <div>
                <div className="font-tech" style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>V/D</div>
                <div className="font-display" style={{ fontSize: '1.3rem', color: '#fff' }}>
                  <span style={{ color: 'var(--green)' }}>{ranking[0].total_wins || 0}</span>
                  <span style={{ color: 'var(--text-dim)' }}>/</span>
                  <span style={{ color: 'var(--red)' }}>{ranking[0].total_losses || 0}</span>
                </div>
              </div>
              <div>
                <div className="font-tech" style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>LUCRO</div>
                <div className="font-display counter-glow" style={{ fontSize: '1.3rem', color: 'var(--gold)' }}>💰 {Math.floor(ranking[0].total_earnings || 0).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ranking Table */}
      <div
        className={`tactical-card scroll-reveal stagger-2 ${isVisible ? 'revealed' : ''}`}
        style={{ maxWidth: '800px', margin: '0 auto', padding: '16px 20px', overflowX: 'auto' }}
      >
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
            {loading ? (
              <tr>
                <td colSpan="5" style={{ padding: '20px' }}>
                  <div className="ranking-skeleton">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="skeleton-row" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </td>
              </tr>
            ) : (
              ranking.slice(0, 10).map((player, idx) => (
                <tr
                  key={idx}
                  className={idx === 0 ? 'champion-row' : ''}
                  style={{
                    borderBottom: '1px solid var(--border-glass)',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (idx !== 0) e.currentTarget.style.background = 'rgba(0, 242, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (idx !== 0) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td style={{ padding: '14px 8px', fontWeight: 800 }}>
                    {idx === 0 && <span style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>🥇</span>}
                    {idx === 1 && <span style={{ color: '#cbd5e1' }}>🥈 2</span>}
                    {idx === 2 && <span style={{ color: '#b45309' }}>🥉 3</span>}
                    {idx > 2 && <span style={{ color: 'var(--text-dim)' }}>{idx + 1}</span>}
                  </td>

                  <td style={{ padding: '14px 8px', fontWeight: 700, color: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {idx === 0 && <Crown size={14} color="var(--gold)" />}
                      {idx !== 0 && <Shield size={14} color={idx <= 2 ? 'var(--cyan)' : 'var(--text-dim)'} />}
                      <span style={{ color: idx === 0 ? 'var(--gold)' : '#fff' }}>{player.username}</span>
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
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className={`scroll-reveal stagger-3 ${isVisible ? 'revealed' : ''}`} style={{ textAlign: 'center', marginTop: '24px' }}>
        <button className="btn-tactical" style={{ padding: '12px 24px' }}>
          VER RANKING COMPLETO
        </button>
      </div>
    </section>
  );
}
