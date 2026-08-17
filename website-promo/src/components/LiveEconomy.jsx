import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users } from 'lucide-react';

export default function LiveEconomy() {
  const [currentPot, setCurrentPot] = useState(0);
  const targetPot = 12400; // Valor de exemplo

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += 200;
      if (current >= targetPot) {
        current = targetPot;
        clearInterval(interval);
      }
      setCurrentPot(current);
    }, 20);
    return () => clearInterval(interval);
  }, []);

  return (
    <section style={{
      padding: '60px 24px',
      background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.05), rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05))',
      borderTop: '1px solid var(--gold-dim)',
      borderBottom: '1px solid var(--gold-dim)',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--gold)', marginBottom: '12px' }}>
            <TrendingUp size={18} />
            <span className="font-tech" style={{ fontWeight: 700, letterSpacing: '1px' }}>ECONOMIA AO VIVO</span>
          </div>
          <h3 className="font-display glow-gold" style={{ fontSize: '2.5rem', color: '#fff', marginBottom: '8px' }}>
            💰 {currentPot.toLocaleString()}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Pote em disputa neste momento</p>
        </div>

        <div style={{ flex: '1 1 300px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--cyan)', marginBottom: '12px' }}>
            <Users size={18} />
            <span className="font-tech" style={{ fontWeight: 700, letterSpacing: '1px' }}>FROTAS ATIVAS</span>
          </div>
          <h3 className="font-display glow-cyan" style={{ fontSize: '2.5rem', color: '#fff', marginBottom: '8px' }}>
            142
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Comandantes engajados no Estreito</p>
        </div>
      </div>
    </section>
  );
}
