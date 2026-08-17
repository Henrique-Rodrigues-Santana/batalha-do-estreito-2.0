import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Coins, Tv, CheckCircle, Copy, AlertCircle, X, Sparkles } from 'lucide-react';

export default function MarketplaceModal({ isOpen, onClose }) {
  const { user, watchAd, buyPackage } = useAuth();
  const [packages, setPackages] = useState([]);
  const [watchingAd, setWatchingAd] = useState(false);
  const [adSeconds, setAdSeconds] = useState(15);
  const [adFinished, setAdFinished] = useState(false);
  const [pixModal, setPixModal] = useState(null);
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetch('/api/marketplace/packages')
        .then(res => res.json())
        .then(data => setPackages(data))
        .catch(() => {
          // Fallback de pacotes
          setPackages([
            { id: 'pack_1000', coins: 1000, price: 5.00, label: '1.000 Moedas', badge: null },
            { id: 'pack_5000', coins: 5500, price: 20.00, label: '5.500 Moedas', badge: '+10% Bônus' },
            { id: 'pack_15000', coins: 17000, price: 50.00, label: '17.000 Moedas', badge: 'Mais Popular' },
            { id: 'pack_50000', coins: 60000, price: 150.00, label: '60.000 Moedas', badge: '+20% Bônus' }
          ]);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Iniciar Anúncio de 15s
  const handleStartAd = () => {
    if (!user) {
      setNotification('Faça login ou aliste-se primeiro!');
      return;
    }
    setWatchingAd(true);
    setAdSeconds(15);
    setAdFinished(false);

    const timer = setInterval(() => {
      setAdSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setAdFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Coletar Recompensa do Anúncio
  const handleClaimAdReward = async () => {
    try {
      const res = await watchAd();
      setNotification(`+${res.reward || 200} moedas adicionadas à sua conta!`);
      setWatchingAd(false);
    } catch (err) {
      setNotification(err.message || 'Erro ao creditar recompensa');
      setWatchingAd(false);
    }
  };

  // Comprar Pacote PIX
  const handleBuy = async (pkg) => {
    if (!user) {
      setNotification('Faça login primeiro para comprar moedas!');
      return;
    }
    try {
      const res = await buyPackage(pkg.id);
      setPixModal({
        package: pkg,
        pixCode: res.pixCode || `00020126580014BR.GOV.BCB.PIX0136${Date.now()}520400005303986540${pkg.price.toFixed(2)}5802BR5925BATALHA DO ESTREITO6009SAO PAULO`,
        coins: res.coins
      });
      setNotification(`✅ +${pkg.coins} moedas creditadas!`);
    } catch (err) {
      setNotification(err.message || 'Erro ao processar compra');
    }
  };

  const copyPixCode = () => {
    if (pixModal?.pixCode) {
      navigator.clipboard.writeText(pixModal.pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      background: 'rgba(0, 0, 0, 0.88)',
      backdropFilter: 'blur(14px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="tactical-card" style={{
        maxWidth: '520px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        boxShadow: '0 0 60px rgba(255, 215, 0, 0.15)'
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

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'rgba(255, 215, 0, 0.1)',
            border: '1px solid var(--gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px'
          }}>
            <Coins size={28} color="var(--gold)" />
          </div>
          <h2 className="font-display glow-gold" style={{ fontSize: '1.25rem', color: 'var(--gold)' }}>
            MERCADO DE MUNIÇÃO & MOEDAS
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {user ? `Saldo Atual: 💰 ${Math.floor(user.coins || 0).toLocaleString()}` : 'Aliste-se para comprar e apostar'}
          </p>
        </div>

        {/* Notificação */}
        {notification && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            background: 'rgba(0, 255, 136, 0.15)',
            border: '1px solid rgba(0, 255, 136, 0.4)',
            borderRadius: '6px',
            color: 'var(--green)',
            fontSize: '0.75rem',
            marginBottom: '16px'
          }}>
            <CheckCircle size={16} />
            <span>{notification}</span>
          </div>
        )}

        {/* SEÇÃO 1: ANÚNCIO PREMIADO DE 15s */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '14px 18px',
          background: 'linear-gradient(135deg, rgba(0, 242, 255, 0.12), rgba(0, 255, 136, 0.08))',
          border: '1px solid var(--cyan)',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            background: 'rgba(0, 242, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Tv size={22} color="var(--cyan)" />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
              Assistir Transmissão Tática (15s)
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--green)', fontWeight: 600 }}>
              Ganhe +200 moedas instantâneas
            </div>
          </div>

          <button
            onClick={handleStartAd}
            className="btn-tactical btn-tactical-green"
            style={{ padding: '8px 16px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
          >
            ASSISTIR
          </button>
        </div>

        {/* SEÇÃO 2: PACOTES PIX */}
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginBottom: '10px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontFamily: 'var(--font-display)'
        }}>
          Pacotes de Moedas (PIX Instantâneo)
        </div>

        <div style={{ display: 'grid', gap: '10px' }}>
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              onClick={() => handleBuy(pkg)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-glass)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--gold)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-glass)'}
            >
              {pkg.badge && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  padding: '2px 8px',
                  background: 'linear-gradient(135deg, var(--gold), #e5a600)',
                  color: 'var(--bg-dark)',
                  fontSize: '0.55rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  borderRadius: '0 0 0 6px'
                }}>
                  {pkg.badge}
                </div>
              )}

              <div>
                <div className="font-display" style={{ fontSize: '1rem', color: 'var(--gold)', fontWeight: 700 }}>
                  {pkg.label}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {pkg.coins.toLocaleString()} créditos táticos
                </div>
              </div>

              <div style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, var(--gold), #e5a600)',
                color: 'var(--bg-dark)',
                borderRadius: '6px',
                fontFamily: 'var(--font-display)',
                fontSize: '0.8rem',
                fontWeight: 700
              }}>
                R$ {pkg.price.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL SIMULADOR DE ANÚNCIO DE 15 SEGUNDOS */}
      {watchingAd && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 3000,
          background: 'rgba(0, 0, 0, 0.95)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="tactical-card" style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span className="badge-classified">TRANSMISSÃO TÁTICA</span>
              <span className="font-display" style={{ color: 'var(--cyan)', fontWeight: 700 }}>
                {adFinished ? '✓ CONCLUÍDO' : `${adSeconds}s`}
              </span>
            </div>

            <div style={{ padding: '30px 10px' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '10px' }}>🚁</div>
              <h3 className="font-display glow-cyan" style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '6px' }}>
                Batalha do Estreito 2.0
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Combates navais táticos com Drones Kamikaze Shahed-136 e apostas em tempo real!
              </p>

              {/* Barra de Progresso */}
              <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${((15 - adSeconds) / 15) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--cyan), var(--green))',
                  transition: 'width 1s linear'
                }} />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
              {adFinished ? (
                <button
                  onClick={handleClaimAdReward}
                  className="btn-tactical btn-tactical-green"
                  style={{ width: '100%', padding: '14px' }}
                >
                  <Sparkles size={16} />
                  <span>COLETAR +200 MOEDAS 💰</span>
                </button>
              ) : (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Aguarde o término do vídeo para receber a recompensa...
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PIX RECEBIMENTO */}
      {pixModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 3000,
          background: 'rgba(0, 0, 0, 0.95)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="tactical-card" style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>
            <h3 className="font-display glow-gold" style={{ fontSize: '1.2rem', color: 'var(--gold)', marginBottom: '8px' }}>
              PIX COPIA E COLA
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Pague com seu app do banco para liberar {pixModal.package.label}:
            </p>

            <div style={{
              padding: '12px',
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px dashed var(--gold)',
              borderRadius: '6px',
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              wordBreak: 'break-all',
              marginBottom: '16px',
              fontFamily: 'monospace'
            }}>
              {pixModal.pixCode}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={copyPixCode}
                className="btn-tactical btn-tactical-gold"
                style={{ flex: 1, padding: '12px' }}
              >
                <Copy size={16} />
                <span>{copied ? 'CÓDIGO COPIADO!' : 'COPIAR PIX'}</span>
              </button>
              <button
                onClick={() => setPixModal(null)}
                className="btn-tactical"
                style={{ padding: '12px 20px' }}
              >
                FECHAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
