import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';

export default function StickyMobileCTA({ onOpenAuth }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        padding: '16px',
        background: 'rgba(5, 11, 20, 0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid var(--cyan)',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 900,
        display: 'flex',
        justifyContent: 'center',
        boxShadow: '0 -10px 30px rgba(0, 242, 255, 0.1)'
      }} className="mobile-cta-container">
        <button
          onClick={() => onOpenAuth('register')}
          className="btn-tactical"
          style={{ width: '100%', maxWidth: '400px', padding: '16px' }}
        >
          <Shield size={18} />
          <span>ALISTAR E GANHAR 1000 MOEDAS</span>
        </button>
      </div>
      <style>{`
        @media (min-width: 768px) {
          .mobile-cta-container { display: none !important; }
        }
      `}</style>
    </>
  );
}
