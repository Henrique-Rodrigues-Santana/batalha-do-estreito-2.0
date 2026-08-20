import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, TrendingUp, Users, Swords } from 'lucide-react';

export default function LiveEconomy() {
  const [pot, setPot] = useState(0);
  const [commanders, setCommanders] = useState(0);
  const [battlesToday, setBattlesToday] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef(null);

  // Target values (will be replaced by real data if server is available)
  const [targets, setTargets] = useState({ pot: 12400, commanders: 142, battles: 87 });

  // Try to fetch real data from the game server
  useEffect(() => {
    const gameUrl = import.meta.env.VITE_GAME_URL || 'http://localhost:3000';

    const fetchLiveData = async () => {
      try {
        // Try multiple endpoints for live data
        const [healthRes, rankingRes] = await Promise.allSettled([
          fetch(`${gameUrl}/health`),
          fetch(`${gameUrl}/api/ranking`)
        ]);

        if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
          const healthData = await healthRes.value.json();
          if (healthData.onlinePlayers !== undefined) {
            setTargets(prev => ({ ...prev, commanders: healthData.onlinePlayers }));
          }
        }

        if (rankingRes.status === 'fulfilled' && rankingRes.value.ok) {
          const rankingData = await rankingRes.value.json();
          if (Array.isArray(rankingData) && rankingData.length > 0) {
            const totalEarnings = rankingData.reduce((sum, p) => sum + (p.total_earnings || 0), 0);
            const totalGames = rankingData.reduce((sum, p) => sum + (p.total_wins || 0) + (p.total_losses || 0), 0);
            if (totalEarnings > 0) setTargets(prev => ({ ...prev, pot: totalEarnings }));
            if (totalGames > 0) setTargets(prev => ({ ...prev, battles: totalGames }));
          }
        }
      } catch (e) {
        // Silently use fallback values
      }
    };

    fetchLiveData();
    const interval = setInterval(fetchLiveData, 30000);
    return () => clearInterval(interval);
  }, []);

  // IntersectionObserver — trigger counter animation when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (!hasAnimated) setHasAnimated(true);
        }
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [hasAnimated]);

  // Animated counter
  useEffect(() => {
    if (!hasAnimated) return;

    const duration = 1800;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      setPot(Math.floor(targets.pot * eased));
      setCommanders(Math.floor(targets.commanders * eased));
      setBattlesToday(Math.floor(targets.battles * eased));

      if (step >= steps) {
        clearInterval(timer);
        setPot(targets.pot);
        setCommanders(targets.commanders);
        setBattlesToday(targets.battles);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [hasAnimated, targets]);

  return (
    <section ref={sectionRef} style={{
      padding: '60px 24px',
      background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.03), rgba(255, 215, 0, 0.08), rgba(255, 215, 0, 0.03))',
      borderTop: '1px solid rgba(255, 215, 0, 0.12)',
      borderBottom: '1px solid rgba(255, 215, 0, 0.12)',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle background glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '200px',
        background: 'radial-gradient(ellipse, rgba(255, 215, 0, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '32px',
        position: 'relative'
      }}>
        {/* Pot */}
        <EconomyCard
          icon={<TrendingUp size={20} />}
          label="ECONOMIA TOTAL"
          value={`💰 ${pot.toLocaleString()}`}
          subtitle="Moedas circulando no Estreito"
          color="var(--gold)"
          isVisible={isVisible}
          delay="0s"
        />

        {/* Commanders */}
        <EconomyCard
          icon={<Users size={20} />}
          label="COMANDANTES ALISTADOS"
          value={commanders.toLocaleString()}
          subtitle="Almirantes registrados"
          color="var(--cyan)"
          isVisible={isVisible}
          delay="0.1s"
        />

        {/* Battles */}
        <EconomyCard
          icon={<Swords size={20} />}
          label="BATALHAS TRAVADAS"
          value={battlesToday.toLocaleString()}
          subtitle="Confrontos no Estreito"
          color="var(--green)"
          isVisible={isVisible}
          delay="0.2s"
        />
      </div>
    </section>
  );
}

function EconomyCard({ icon, label, value, subtitle, color, isVisible, delay }) {
  return (
    <div
      className={`scroll-reveal ${isVisible ? 'revealed' : ''}`}
      style={{
        flex: '1 1 220px',
        transitionDelay: delay
      }}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color, marginBottom: '12px' }}>
        {icon}
        <span className="font-tech" style={{ fontWeight: 700, letterSpacing: '1px', fontSize: '0.8rem' }}>{label}</span>
      </div>
      <h3
        className="font-display counter-glow"
        style={{ fontSize: '2.5rem', color: '#fff', marginBottom: '8px', lineHeight: 1.1 }}
      >
        {value}
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{subtitle}</p>
    </div>
  );
}
