import React, { useState } from 'react';
import { Target, Play, RotateCcw, Crosshair, Award } from 'lucide-react';

export default function TacticalRadarDemo() {
  const [board, setBoard] = useState(() => Array(6).fill().map(() => Array(6).fill(null)));
  const [shots, setShots] = useState(0);
  const [hits, setHits] = useState(0);
  const [message, setMessage] = useState('Selecione uma coordenada no radar para disparar um drone de teste');
  const [firing, setFiring] = useState(false);

  // Posição secreta de demonstração (2 navios fictícios)
  const ships = [
    { r: 1, c: 2 }, { r: 1, c: 3 }, { r: 1, c: 4 }, // Fragata 3
    { r: 4, c: 1 }, { r: 4, c: 2 }                  // Submarino 2
  ];

  const handleCellClick = (r, c) => {
    if (board[r][c] !== null || firing) return;

    setFiring(true);
    setMessage(`🚀 Lançando Drone Shahed-136 nas coordenadas [${String.fromCharCode(65 + r)}${c + 1}]...`);

    setTimeout(() => {
      const isHit = ships.some(s => s.r === r && s.c === c);
      const newBoard = board.map(row => [...row]);
      newBoard[r][c] = isHit ? 'hit' : 'miss';
      setBoard(newBoard);
      setShots(prev => prev + 1);

      if (isHit) {
        setHits(prev => prev + 1);
        setMessage(`💥 ACERTO CONFIRMADO! Navio inimigo danificado nas coordenadas [${String.fromCharCode(65 + r)}${c + 1}]!`);
      } else {
        setMessage(`💧 ÁGUA! Nenhuma embarcação detectada em [${String.fromCharCode(65 + r)}${c + 1}].`);
      }
      setFiring(false);
    }, 600);
  };

  const resetDemo = () => {
    setBoard(Array(6).fill().map(() => Array(6).fill(null)));
    setShots(0);
    setHits(0);
    setMessage('Radar recalibrado. Pronto para novo disparo.');
  };

  return (
    <section id="simulator" style={{
      padding: '100px 24px',
      maxWidth: '1280px',
      margin: '0 auto',
      position: 'relative'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'inline-flex', gap: '8px', marginBottom: '12px' }}>
          <span className="badge-classified badge-active">
            <Target size={14} />
            SIMULADOR DE TIRO INTERATIVO
          </span>
        </div>
        <h2 className="font-display glow-cyan" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#fff', textTransform: 'uppercase' }}>
          RADAR DE DISPARO DE DEMONSTRAÇÃO
        </h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto' }}>
          Experimente a mecânica de ataque antes de entrar na guerra real. Clique nas coordenadas para lançar um drone kamikaze de teste!
        </p>
      </div>

      <div style={{
        maxWidth: '560px',
        margin: '0 auto',
        background: 'linear-gradient(145deg, rgba(13, 27, 42, 0.9), rgba(5, 11, 20, 0.95))',
        border: '1px solid var(--cyan)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 0 40px rgba(0, 242, 255, 0.15)'
      }}>
        {/* HUD Superior */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-glass)',
          marginBottom: '20px'
        }}>
          <div>
            <span className="font-tech" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>DISPAROS: </span>
            <strong style={{ color: '#fff' }}>{shots}</strong>
          </div>
          <div>
            <span className="font-tech" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>ACERTOS: </span>
            <strong style={{ color: 'var(--green)' }}>{hits}</strong>
          </div>
          <button
            onClick={resetDemo}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-muted)',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={12} />
            <span>REINICIAR</span>
          </button>
        </div>

        {/* Grade de Radar 6x6 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '8px',
          aspectRatio: '1',
          padding: '12px',
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '8px',
          border: '1px dashed var(--border-cyan)',
          position: 'relative'
        }}>
          {board.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                disabled={cell !== null || firing}
                style={{
                  background:
                    cell === 'hit'
                      ? 'linear-gradient(135deg, rgba(255, 74, 74, 0.8), rgba(255, 215, 0, 0.4))'
                      : cell === 'miss'
                      ? 'rgba(0, 242, 255, 0.15)'
                      : 'rgba(13, 27, 42, 0.6)',
                  border: `1px solid ${
                    cell === 'hit'
                      ? 'var(--red)'
                      : cell === 'miss'
                      ? 'var(--border-cyan)'
                      : 'rgba(0, 242, 255, 0.2)'
                  }`,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  cursor: cell === null && !firing ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (cell === null && !firing) e.currentTarget.style.borderColor = 'var(--cyan)';
                }}
                onMouseLeave={(e) => {
                  if (cell === null && !firing) e.currentTarget.style.borderColor = 'rgba(0, 242, 255, 0.2)';
                }}
              >
                {cell === 'hit' && '💥'}
                {cell === 'miss' && '💧'}
                {cell === null && (
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                    {String.fromCharCode(65 + r)}{c + 1}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Mensagem de Feedback Tático */}
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: 'rgba(0, 0, 0, 0.6)',
          border: '1px solid var(--border-glass)',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: firing ? 'var(--cyan)' : 'var(--text-main)',
          textAlign: 'center',
          minHeight: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {message}
        </div>

        {/* CTA para o Jogo Real */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="btn-tactical btn-tactical-green"
            style={{ width: '100%', padding: '14px' }}
          >
            <Play size={16} fill="currentColor" />
            <span>JOGAR NA FROTA REAL COM APOSTAS</span>
          </a>
        </div>
      </div>
    </section>
  );
}
