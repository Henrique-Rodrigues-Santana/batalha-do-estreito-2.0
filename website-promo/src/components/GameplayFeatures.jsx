import React from 'react';
import { Video, DollarSign, Cpu, Smartphone, RefreshCw, Eye, ShieldCheck, Zap } from 'lucide-react';

export default function GameplayFeatures() {
  const features = [
    {
      icon: <Video size={24} color="var(--cyan)" />,
      title: 'Câmera FPV de Mergulho 3D',
      desc: 'Sinta o impacto visceral. Ao afundar navios ou disparar contra alvos críticos, a câmera mergulha junto com o drone em câmera lenta com explosões volumétricas.'
    },
    {
      icon: <DollarSign size={24} color="var(--gold)" />,
      title: 'Economia com 10% Rake da Casa',
      desc: 'Partidas apostadas justas entre jogadores ou contra a IA. A casa retém 10% de comissão sobre o pote, garantindo sustentabilidade e prêmios altos aos vencedores.'
    },
    {
      icon: <Cpu size={24} color="var(--green)" />,
      title: 'IA Militar com 3 Níveis Táticos',
      desc: 'Treine solo ou aposte contra algoritmos táticos avançados: Recruta (Fácil), Caçador Adjacente (Médio) ou Almirante com Heatmap Probabilístico (Difícil).'
    },
    {
      icon: <Zap size={24} color="var(--cyan)" />,
      title: 'Anúncios Premiados (+200 Moedas)',
      desc: 'Ficou sem saldo? Assista a um vídeo militar curto de 15 segundos no Marketplace e receba 200 moedas na hora para continuar no combate sem parar.'
    },
    {
      icon: <Smartphone size={24} color="var(--green)" />,
      title: 'PWA Nativo sem Download de Loja',
      desc: 'Esqueça downloads de 500MB na Play Store ou App Store. O Batalha do Estreito instala instantaneamente na sua tela inicial direto do navegador em 2 segundos.'
    },
    {
      icon: <RefreshCw size={24} color="var(--gold)" />,
      title: 'Reconexão Tática em 30 Segundos',
      desc: 'Caiu o 4G no meio da batalha? Você tem 30 segundos para reconectar e ter seu tabuleiro, frotas e turno restaurados exatamente de onde parou.'
    }
  ];

  return (
    <section id="gameplay" style={{
      padding: '100px 24px',
      maxWidth: '1280px',
      margin: '0 auto',
      position: 'relative'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <div style={{ display: 'inline-flex', gap: '8px', marginBottom: '12px' }}>
          <span className="badge-classified">
            <ShieldCheck size={14} />
            ENGENHARIA DO JOGO
          </span>
        </div>
        <h2 className="font-display glow-cyan" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#fff', textTransform: 'uppercase' }}>
          MECÂNICAS & DIFERENCIAIS DE COMBATE
        </h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto' }}>
          Conheça a tecnologia por trás do primeiro jogo de batalha naval 3D com drones, economia descentralizada e suporte mobile de alto desempenho.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px'
      }}>
        {features.map((item, idx) => (
          <div key={idx} className="tactical-card">
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-glass)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              {item.icon}
            </div>

            <h3 className="font-display" style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '10px' }}>
              {item.title}
            </h3>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
