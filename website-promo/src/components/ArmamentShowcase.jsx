import React, { useState } from 'react';
import ModelViewer3D from '../3d/ModelViewer3D';
import { Crosshair, Shield, Zap, Radio, Target, Sparkles } from 'lucide-react';

export default function ArmamentShowcase() {
  const [selectedWeapon, setSelectedWeapon] = useState('drone');

  const weapons = {
    drone: {
      title: 'UAV Kamikaze Shahed-136',
      class: 'Drone de Ataque Suicida Guiado',
      role: 'Neutralização de Alvos Navais',
      specs: [
        { label: 'VELOCIDADE', value: '185 km/h (Mergulho 260 km/h)' },
        { label: 'OGIVA', value: '40 kg Termobárica / Alto Explosivo' },
        { label: 'ALCANCE', value: '2.500 km (Inercial + Óptico)' },
        { label: 'ASSINATURA RADAR', value: 'Ultra Baixa (Composto Delta)' }
      ],
      description: 'A espinha dorsal das forças ofensivas no Estreito. Voa em altitudes rasantes rente à água para evitar defesas antiaéreas e atinge o convés de embarcações blindadas com precisão cirúrgica.'
    },
    corvette: {
      title: 'Corveta Lança-Mísseis Classe Jamaran',
      class: 'Navio de Escolta e Ataque Rápido',
      role: 'Defesa de Posição e Patrulha',
      specs: [
        { label: 'DESLOCAMENTO', value: '1.500 Toneladas' },
        { label: 'ARMAMENTO', value: '4x Mísseis Noor + Canhão 76mm' },
        { label: 'BLINDAGEM', value: 'Casco Duplo Hidrodinâmico' },
        { label: 'SLOTS DE VIDA', value: '4 Células no Tabuleiro' }
      ],
      description: 'Embarcação ágil equipada com defesas de ponto e lançadores quádruplos de mísseis antinavio. Difícil de localizar nos recifes rasos do Golfo.'
    },
    carrier: {
      title: 'Porta-Drones & Helicópteros Tático',
      class: 'Navio-Capitânia da Frota',
      role: 'Comando e Controle Central',
      specs: [
        { label: 'CAPACIDADE', value: '30+ Drones Shahed em Tubos' },
        { label: 'DEFESA', value: 'Sistemas CIWS Phalanx de 20mm' },
        { label: 'PONTOS DE VITÓRIA', value: '500 Moedas ao Afundar' },
        { label: 'SLOTS DE VIDA', value: '5 Células no Tabuleiro' }
      ],
      description: 'O gigante dos mares. Capaz de lançar enxames inteiros de drones de uma só vez. Sua perda significa quase certamente a derrota na batalha naval.'
    },
    radar: {
      title: 'Radar de Varredura Quântica 2x2',
      class: 'Módulo Tático de Reconhecimento',
      role: 'Descoberta e Iluminação de Alvos',
      specs: [
        { label: 'ÁREA DE VARREDURA', value: 'Quadrante 2x2 (4 Células)' },
        { label: 'RECARGA', value: '3 Acertos Consecutivos' },
        { label: 'CONSUMO', value: 'Munição Especial de Reconhecimento' },
        { label: 'EFICÁCIA', value: '100% de Detecção Térmica' }
      ],
      description: 'Habilidade especial que revela instantaneamente se há embarcações ocultas em um quadrante de 4 células, virando o rumo de partidas acirradas.'
    }
  };

  const current = weapons[selectedWeapon];

  return (
    <section id="arsenal" style={{
      padding: '100px 24px',
      maxWidth: '1280px',
      margin: '0 auto',
      position: 'relative'
    }}>
      {/* Título de Seção */}
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <div style={{ display: 'inline-flex', gap: '8px', marginBottom: '12px' }}>
          <span className="badge-classified">
            <Crosshair size={14} />
            SHOWROOM TÁTICO MILITAR
          </span>
        </div>
        <h2 className="font-display glow-cyan" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#fff', textTransform: 'uppercase' }}>
          ARSENAL DE COMBATE 3D
        </h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto' }}>
          Inspecione os modelos em 3D com rotação interativa de 360° e conheça as especificações táticas de cada arma do jogo.
        </p>
      </div>

      {/* Botões de Seleção de Armamento */}
      <div style={{
        display: 'flex',
        gap: '10px',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginBottom: '40px'
      }}>
        {[
          { key: 'drone', label: '🛸 DRONE SHAHED-136' },
          { key: 'corvette', label: '🚢 CORVETA LANÇA-MÍSSEIS' },
          { key: 'carrier', label: '🛳️ PORTA-DRONES' },
          { key: 'radar', label: '📡 RADAR QUÂNTICO 2x2' }
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setSelectedWeapon(item.key)}
            style={{
              padding: '12px 20px',
              background: selectedWeapon === item.key ? 'var(--cyan)' : 'rgba(13, 27, 42, 0.8)',
              color: selectedWeapon === item.key ? 'var(--bg-dark)' : 'var(--text-main)',
              border: `1px solid ${selectedWeapon === item.key ? 'var(--cyan)' : 'var(--border-cyan)'}`,
              borderRadius: '8px',
              fontFamily: 'var(--font-display)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: selectedWeapon === item.key ? '0 0 20px rgba(0, 242, 255, 0.4)' : 'none'
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Container Principal: Visualizador 3D + Ficha Técnica */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '30px',
        alignItems: 'center'
      }}>
        {/* Lado Esquerdo: Canvas 3D Interativo */}
        <div className="tactical-card" style={{ padding: '20px', textAlign: 'center', position: 'relative' }}>
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.7rem',
            color: 'var(--cyan)'
          }}>
            <Sparkles size={14} />
            <span>ARRASTE PARA GIRAR 360°</span>
          </div>

          <ModelViewer3D modelType={selectedWeapon} />
        </div>

        {/* Lado Direito: Ficha Técnica Militar */}
        <div className="tactical-card" style={{ padding: '32px' }}>
          <span className="badge-classified" style={{ marginBottom: '12px' }}>
            {current.class}
          </span>

          <h3 className="font-display glow-cyan" style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '4px' }}>
            {current.title}
          </h3>

          <div style={{ fontSize: '0.8rem', color: 'var(--cyan)', marginBottom: '18px', fontWeight: 600 }}>
            MISSÃO: {current.role}
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '24px' }}>
            {current.description}
          </p>

          {/* Grid de Especificações */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {current.specs.map((spec, idx) => (
              <div key={idx} style={{
                padding: '10px 12px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-glass)',
                borderRadius: '6px'
              }}>
                <div className="font-tech" style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                  {spec.label}
                </div>
                <div className="font-display" style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 700, marginTop: '2px' }}>
                  {spec.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
