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

      {/* Dossiê & Lore */}
      <LoreSection />

      {/* Demonstração Cinemática de Impacto 3D (Atacante vs Defensor) */}
      <Suspense fallback={<div style={{ padding: '100px', textAlign: 'center', color: 'var(--cyan)' }}>Carregando simulação 3D...</div>}>
        <CinematicCombatDemo />
      </Suspense>

      {/* Economia ao Vivo (NOVO) */}
      <LiveEconomy />

      {/* Showroom 3D de Armas */}
      <Suspense fallback={<div style={{ padding: '100px', textAlign: 'center', color: 'var(--cyan)' }}>Carregando arsenal 3D...</div>}>
        <ArmamentShowcase />
      </Suspense>

      {/* Simulador Interativo */}
      <Suspense fallback={<div style={{ padding: '100px', textAlign: 'center', color: 'var(--cyan)' }}>Carregando radar tático...</div>}>
        <TacticalRadarDemo />
      </Suspense>

      {/* Como Jogar (NOVO) */}
      <HowToPlay />

      {/* Mecânicas de Jogo */}
      <GameplayFeatures />

      {/* Salão da Fama */}
      <HallOfFame />

      {/* Rodapé */}
      <Footer onOpenAuth={handleOpenAuth} />

      {/* CTA Mobile Fixo (NOVO) */}
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
