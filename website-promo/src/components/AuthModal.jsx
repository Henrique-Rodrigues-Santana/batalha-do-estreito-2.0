import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User, Mail, X, AlertCircle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'login') {
        await login(username, password);
      } else {
        await register(username, email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="tactical-card" style={{
        maxWidth: '420px',
        width: '100%',
        position: 'relative',
        boxShadow: '0 0 50px rgba(0, 242, 255, 0.2)'
      }}>
        {/* Fechar */}
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

        {/* Cabeçalho */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'rgba(0, 242, 255, 0.1)',
            border: '1px solid var(--cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <Shield size={28} color="var(--cyan)" />
          </div>
          <h2 className="font-display glow-cyan" style={{ fontSize: '1.2rem', color: 'var(--cyan)' }}>
            CENTRO DE COMANDO NAVAL
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Autenticação Segura Tática — Acesso à Frota
          </p>
        </div>

        {/* Abas */}
        <div style={{
          display: 'flex',
          gap: '8px',
          background: 'rgba(0, 0, 0, 0.4)',
          padding: '4px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => { setTab('login'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: tab === 'login' ? 'rgba(0, 242, 255, 0.2)' : 'transparent',
              color: tab === 'login' ? 'var(--cyan)' : 'var(--text-muted)',
              fontFamily: 'var(--font-display)',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            LOGIN
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              background: tab === 'register' ? 'rgba(0, 242, 255, 0.2)' : 'transparent',
              color: tab === 'register' ? 'var(--cyan)' : 'var(--text-muted)',
              fontFamily: 'var(--font-display)',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            ALISTAMENTO
          </button>
        </div>

        {/* Alerta de Erro */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            background: 'rgba(255, 74, 74, 0.15)',
            border: '1px solid rgba(255, 74, 74, 0.4)',
            borderRadius: '6px',
            color: 'var(--red)',
            fontSize: '0.75rem',
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
              Identificador / Nome de Guerra
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--cyan)' }} />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: AlmiranteHawk"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid var(--border-cyan)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {tab === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                Frequência de Comunicação / E-mail
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--cyan)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="comandante@frota.mil"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid var(--border-cyan)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
              Chave Criptográfica / Senha
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--cyan)' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid var(--border-cyan)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-tactical btn-tactical-green"
            style={{ width: '100%', padding: '14px', marginTop: '10px' }}
          >
            {loading ? 'PROCESSANDO...' : tab === 'login' ? 'AUTORIZAR ENTRADA' : 'CONFIRMAR ALISTAMENTO (+1.000 💰)'}
          </button>
        </form>
      </div>
    </div>
  );
}
