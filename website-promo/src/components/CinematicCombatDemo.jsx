import React, { useState } from 'react';
import CombatSimulation3D from '../3d/CombatSimulation3D';
import { Crosshair, AlertTriangle, Radio, Play, ShieldAlert, Target, Zap } from 'lucide-react';

export default function CinematicCombatDemo() {
  const [viewMode, setViewMode] = useState('attack'); // 'attack' or 'defense'
  const [attackPhase, setAttackPhase] = useState('SEARCHING'); // 'SEARCHING', 'LOCKED', 'DIVING'
  const [impactCount, setImpactCount] = useState(0);
  const [signalLost, setSignalLost] = useState(false);

  const handleSignalLost = () => {
    setSignalLost(true);
    setTimeout(() => setSignalLost(false), 2400);
  };

  return (
    <section id="cinematics" style={{
      padding: '100px 24px',
      maxWidth: '1280px',
      margin: '0 auto',
      position: 'relative'
    }}>
      {/* Título de Seção */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'inline-flex', gap: '8px', marginBottom: '12px' }}>
          <span className="badge-classified badge-active">
            <Radio size={14} />
            HMD COMBAT SYSTEM // CÂMERA DE BICO ÓPTICA
          </span>
        </div>
        <h2 className="font-display glow-cyan" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#fff', textTransform: 'uppercase' }}>
          O IMPACTO DO COMBATE EM 3D
        </h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', maxWidth: '720px', margin: '0 auto' }}>
          Câmera óptica instalada no bico do drone com mira automatizada estilo caça de última geração. O sensor varre o oceano, trava o alvo (Lock-On), arremete e desvia da artilharia pesada até a detonação final!
        </p>
      </div>

      {/* Botões de Seleção de Câmera */}
      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => { setViewMode('attack'); setSignalLost(false); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: viewMode === 'attack' ? 'var(--cyan)' : 'rgba(13, 27, 42, 0.8)',
            color: viewMode === 'attack' ? 'var(--bg-dark)' : 'var(--text-main)',
            border: `1px solid ${viewMode === 'attack' ? 'var(--cyan)' : 'var(--border-cyan)'}`,
            borderRadius: '8px',
            fontFamily: 'var(--font-display)',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: viewMode === 'attack' ? '0 0 24px rgba(0, 242, 255, 0.4)' : 'none'
          }}
        >
          <Target size={16} />
          <span>🚀 VISÃO DO BICO DO DRONE (MIRA HMD + LOCK-ON)</span>
        </button>

        <button
          onClick={() => { setViewMode('defense'); setSignalLost(false); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: viewMode === 'defense' ? 'var(--red)' : 'rgba(13, 27, 42, 0.8)',
            color: viewMode === 'defense' ? '#fff' : 'var(--text-main)',
            border: `1px solid ${viewMode === 'defense' ? 'var(--red)' : 'rgba(255, 74, 74, 0.3)'}`,
            borderRadius: '8px',
            fontFamily: 'var(--font-display)',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: viewMode === 'defense' ? '0 0 24px rgba(255, 74, 74, 0.4)' : 'none'
          }}
        >
          <AlertTriangle size={16} />
          <span>🛡️ VISÃO DEFENSOR (A BORDO DO NAVIO ALVO)</span>
        </button>
      </div>

      {/* Frame Cinemático 3D */}
      <div style={{
        maxWidth: '960px',
        margin: '0 auto',
        aspectRatio: '16/9',
        minHeight: '420px',
        background: 'linear-gradient(145deg, rgba(13, 27, 42, 0.95), rgba(5, 11, 20, 0.98))',
        border: `1px solid ${viewMode === 'attack' ? (attackPhase === 'LOCKED' ? 'var(--gold)' : attackPhase === 'DIVING' ? 'var(--red)' : 'var(--cyan)') : 'var(--red)'}`,
        borderRadius: '16px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: viewMode === 'attack' ? '0 0 60px rgba(0, 242, 255, 0.25)' : '0 0 60px rgba(255, 74, 74, 0.25)'
      }}>
        {/* Renderizador 3D */}
        <CombatSimulation3D
          viewMode={viewMode}
          onPhaseChange={(phase) => setAttackPhase(phase)}
          onImpact={() => setImpactCount(prev => prev + 1)}
          onSignalLost={handleSignalLost}
        />

        {/* OVERLAY DE PERDA DE SINAL / ESTÁTICA CRT */}
        {signalLost && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle, rgba(0,0,0,0.88) 0%, rgba(15,15,15,0.98) 100%)',
            zIndex: 99,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'staticFlicker 0.1s infinite',
            pointerEvents: 'none'
          }}>
            {/* Scanlines pesadas de ruído */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.12) 0px, rgba(255,255,255,0.12) 2px, transparent 2px, transparent 4px)',
              pointerEvents: 'none'
            }} />

            <div style={{
              padding: '18px 28px',
              background: 'rgba(255, 74, 74, 0.25)',
              border: '2px solid var(--red)',
              borderRadius: '8px',
              textAlign: 'center',
              boxShadow: '0 0 50px rgba(255, 74, 74, 0.8)'
            }}>
              <div className="font-display" style={{ color: 'var(--red)', fontSize: '1.5rem', fontWeight: 900, letterSpacing: '4px' }}>
                ⚡ SIGNAL LOST // 0 FPS
              </div>
              <div className="font-tech" style={{ color: '#fff', fontSize: '0.85rem', marginTop: '6px', letterSpacing: '1px' }}>
                IMPACTO DIRETO NO CONVÉS // TELEMETRIA ENCERRADA
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* HUD HMD ESTILO CAPACETE DE CAÇA (F-35 / SU-57)            */}
        {/* ========================================================= */}
        {viewMode === 'attack' && !signalLost && (
          <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '20px'
          }}>
            {/* Topo do HMD: Bússola e Modo de Busca */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                background: 'rgba(5, 11, 20, 0.85)',
                border: `1px solid ${attackPhase === 'LOCKED' ? 'var(--gold)' : attackPhase === 'DIVING' ? 'var(--red)' : 'var(--cyan)'}`,
                borderRadius: '6px'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: attackPhase === 'LOCKED' ? 'var(--gold)' : attackPhase === 'DIVING' ? 'var(--red)' : 'var(--cyan)',
                  animation: 'pulse 0.8s infinite'
                }} />
                <span className="font-tech" style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: attackPhase === 'LOCKED' ? 'var(--gold)' : attackPhase === 'DIVING' ? 'var(--red)' : 'var(--cyan)',
                  letterSpacing: '1px'
                }}>
                  {attackPhase === 'SEARCHING' && '📡 VARRENDO SETOR // BUSCANDO ASSINATURA TÉRMICA...'}
                  {attackPhase === 'LOCKED' && '🎯 ALVO ADQUIRIDO // TRAVA DE MIRA (LOCK-ON) 100%'}
                  {attackPhase === 'DIVING' && '🔥 MERGULHO BALÍSTICO // DESVIANDO DE FLAK & TIROS'}
                </span>
              </div>

              {/* Bússola Digital */}
              <div className="font-tech" style={{
                fontSize: '0.8rem',
                color: 'var(--cyan)',
                padding: '4px 12px',
                background: 'rgba(5, 11, 20, 0.8)',
                border: '1px solid var(--border-cyan)',
                borderRadius: '4px'
              }}>
                HDG: 142° SE · PITCH: -38°
              </div>
            </div>

            {/* Centro do HMD: Retículo Inteligente de Mira */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Linhas de Horizonte Artificial */}
              <div style={{
                position: 'absolute',
                width: '180px',
                height: '2px',
                background: 'rgba(0, 242, 255, 0.25)',
                boxShadow: '0 0 10px rgba(0, 242, 255, 0.3)'
              }} />

              {/* Retículo de Varredura / Caixa de Lock */}
              <div style={{
                width: attackPhase === 'SEARCHING' ? '120px' : '90px',
                height: attackPhase === 'SEARCHING' ? '120px' : '90px',
                border: `2px ${attackPhase === 'SEARCHING' ? 'dashed var(--cyan)' : attackPhase === 'LOCKED' ? 'solid var(--gold)' : 'solid var(--red)'}`,
                borderRadius: attackPhase === 'SEARCHING' ? '50%' : '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: attackPhase === 'LOCKED' ? '0 0 30px rgba(255, 215, 0, 0.6)' : attackPhase === 'DIVING' ? '0 0 30px rgba(255, 74, 74, 0.6)' : '0 0 20px rgba(0, 242, 255, 0.3)'
              }}>
                {/* Ponto Central */}
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: attackPhase === 'LOCKED' ? 'var(--gold)' : attackPhase === 'DIVING' ? 'var(--red)' : 'var(--cyan)'
                }} />
              </div>

              {/* Tag do Alvo */}
              {attackPhase !== 'SEARCHING' && (
                <div className="font-tech" style={{
                  marginTop: '8px',
                  padding: '2px 8px',
                  background: attackPhase === 'LOCKED' ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 74, 74, 0.2)',
                  border: `1px solid ${attackPhase === 'LOCKED' ? 'var(--gold)' : 'var(--red)'}`,
                  borderRadius: '4px',
                  color: attackPhase === 'LOCKED' ? 'var(--gold)' : 'var(--red)',
                  fontSize: '0.7rem',
                  fontWeight: 800
                }}>
                  [TGT: CORVETA T-22 // DIST: {attackPhase === 'LOCKED' ? '2.4 KM' : '0.8 KM'}]
                </div>
              )}
            </div>

            {/* Rodapé do HMD: Dados de Telemetria Óptica */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="font-tech" style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                background: 'rgba(5, 11, 20, 0.85)',
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid var(--border-glass)'
              }}>
                SPD: <strong style={{ color: 'var(--gold)' }}>{attackPhase === 'DIVING' ? '310 KM/H' : '185 KM/H'}</strong> · ALT: <strong style={{ color: 'var(--cyan)' }}>{attackPhase === 'DIVING' ? '12M' : '75M'}</strong>
              </div>

              <div className="font-tech" style={{
                fontSize: '0.75rem',
                color: 'var(--cyan)',
                background: 'rgba(5, 11, 20, 0.85)',
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid var(--border-cyan)'
              }}>
                OGIVA: <strong style={{ color: 'var(--green)' }}>ARMADA (TERMOBÁRICA)</strong>
              </div>
            </div>
          </div>
        )}

        {/* HUD DO DEFENSOR */}
        {viewMode === 'defense' && (
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            right: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pointerEvents: 'none',
            zIndex: 10
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              background: 'rgba(5, 11, 20, 0.85)',
              border: '1px solid var(--red)',
              borderRadius: '6px'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--red)', animation: 'pulse 0.8s infinite' }} />
              <span className="font-tech" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--red)' }}>
                ⚠️ DEFESA ANTIAÉREA EM FOGO CONTÍNUO // DRONE EM APROXIMAÇÃO
              </span>
            </div>

            <div style={{
              padding: '6px 14px',
              background: 'rgba(5, 11, 20, 0.85)',
              border: '1px solid var(--border-glass)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              color: '#fff'
            }}>
              DETONAÇÕES: <span style={{ color: 'var(--gold)', fontWeight: 800 }}>{impactCount}</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes staticFlicker {
          0% { opacity: 0.95; transform: translate(0, 0); }
          25% { opacity: 0.9; transform: translate(-1px, 1px); }
          50% { opacity: 1; transform: translate(1px, -1px); }
          75% { opacity: 0.85; transform: translate(-1px, -1px); }
          100% { opacity: 0.95; transform: translate(1px, 1px); }
        }
      `}</style>
    </section>
  );
}
