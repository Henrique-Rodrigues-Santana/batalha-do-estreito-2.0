import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle } from 'lucide-react';

export default function ServerStatus() {
  const [status, setStatus] = useState('checking'); // checking, online, degraded, offline
  const [ping, setPing] = useState(0);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const start = Date.now();
        const res = await fetch(`${import.meta.env.VITE_GAME_URL || 'http://localhost:3000'}/health`);
        const time = Date.now() - start;
        setPing(time);
        
        if (res.ok) {
          setStatus('online');
        } else {
          setStatus('degraded');
        }
      } catch (err) {
        setStatus('offline');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (status === 'online') return 'var(--green)';
    if (status === 'degraded') return 'var(--gold)';
    if (status === 'offline') return 'var(--red)';
    return 'var(--text-muted)';
  };

  const getStatusText = () => {
    if (status === 'online') return 'SERVIDORES TÁTICOS 100% OPERACIONAIS';
    if (status === 'degraded') return 'SISTEMAS OPERANDO COM DEGRADAÇÃO';
    if (status === 'offline') return 'CONEXÃO COM COMANDO CENTRAL PERDIDA';
    return 'ESTABELECENDO CONEXÃO SEGURA...';
  };

  const getIcon = () => {
    if (status === 'online') return <CheckCircle size={14} color={getStatusColor()} />;
    if (status === 'degraded' || status === 'offline') return <AlertCircle size={14} color={getStatusColor()} />;
    return <Activity size={14} color={getStatusColor()} className="pulse-anim" />;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: getStatusColor(), transition: 'color 0.3s' }}>
      {getIcon()}
      <span style={{ fontWeight: 600, letterSpacing: '0.5px' }}>{getStatusText()}</span>
      {status === 'online' && <span style={{ opacity: 0.6 }}>| ⏱ {ping}ms latência</span>}
      <style>{`
        @keyframes pulseActivity {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
        .pulse-anim { animation: pulseActivity 1.5s infinite; }
      `}</style>
    </div>
  );
}
