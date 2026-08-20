import React, { useState, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import LoreSection from './components/LoreSection';
import GameplayFeatures from './components/GameplayFeatures';
import HallOfFame from './components/HallOfFame';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import MarketplaceModal from './components/MarketplaceModal';
import HowToPlay from './components/HowToPlay';
import LiveEconomy from './components/LiveEconomy';
import StickyMobileCTA from './components/StickyMobileCTA';
import './styles/theme.css';

const CinematicCombatDemo = React.lazy(() => import('./components/CinematicCombatDemo'));
const ArmamentShowcase = React.lazy(() => import('./components/ArmamentShowcase'));
const TacticalRadarDemo = React.lazy(() => import('./components/TacticalRadarDemo'));

// Reusable Section Divider
function SectionDivider({ variant = 'cyan' }) {
  return (
    <div
      className={`section-divider ${variant === 'gold' ? 'section-divider-gold' : ''}`}
      style={{ margin: '0 auto', padding: '0 24px' }}
    />
  );
}

// Loading fallback with military styling
function LoadingFallback({ text = 'Carregando...' }) {
  return (
    <div style={{
      padding: '100px 24px',
      textAlign: 'center',
      color: 'var(--cyan)',
      fontFamily: 'var(--font-display)',
      fontSize: '0.9rem',
      letterSpacing: '2px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '2px solid var(--border-cyan)',
        borderTop: '2px solid var(--cyan)',
        borderRadius: '50%',
        animation: 'radarSweep 1s linear infinite',
        margin: '0 auto 16px'
      }} />
      {text}
    </div>
  );
}

function MainApp() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState('login');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [marketplaceModalOpen, setMarketplaceModalOpen] = useState(false);

  const handleOpenAuth = (tab = 'login') => {
    setAuthInitialTab(tab);
    setAuthModalOpen(true);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
      {/* Barra de Navegação */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenMarketplace={() => setMarketplaceModalOpen(true)}
      />

      {/* Hero 3D */}
      <HeroSection onOpenAuth={handleOpenAuth} />

      <SectionDivider />

      {/* Dossiê & Lore */}
      <LoreSection />

      <SectionDivider />

      {/* Demonstração Cinemática de Impacto 3D (Atacante vs Defensor) */}
      <Suspense fallback={<LoadingFallback text="Carregando simulação 3D..." />}>
        <CinematicCombatDemo />
      </Suspense>

      {/* Economia ao Vivo */}
      <LiveEconomy />

      <SectionDivider variant="gold" />

      {/* Showroom 3D de Armas */}
      <Suspense fallback={<LoadingFallback text="Carregando arsenal 3D..." />}>
        <ArmamentShowcase />
      </Suspense>

      <SectionDivider />

      {/* Simulador Interativo */}
      <Suspense fallback={<LoadingFallback text="Carregando radar tático..." />}>
        <TacticalRadarDemo onOpenAuth={handleOpenAuth} />
      </Suspense>

      <SectionDivider />

      {/* Como Jogar */}
      <HowToPlay />

      <SectionDivider />

      {/* Mecânicas de Jogo */}
      <GameplayFeatures />

      <SectionDivider variant="gold" />

      {/* Salão da Fama */}
      <HallOfFame />

      {/* Rodapé */}
      <Footer onOpenAuth={handleOpenAuth} />

      {/* CTA Mobile Fixo */}
      <StickyMobileCTA onOpenAuth={handleOpenAuth} />

      {/* Modais Globais */}
      <AuthModal
        isOpen={authModalOpen}
        initialTab={authInitialTab}
        onClose={() => setAuthModalOpen(false)}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onOpenMarketplace={() => setMarketplaceModalOpen(true)}
      />

      <MarketplaceModal
        isOpen={marketplaceModalOpen}
        onClose={() => setMarketplaceModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
