import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import LoreSection from './components/LoreSection';
import ArmamentShowcase from './components/ArmamentShowcase';
import CinematicCombatDemo from './components/CinematicCombatDemo';
import TacticalRadarDemo from './components/TacticalRadarDemo';
import GameplayFeatures from './components/GameplayFeatures';
import HallOfFame from './components/HallOfFame';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import MarketplaceModal from './components/MarketplaceModal';
import './styles/theme.css';

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
      <CinematicCombatDemo />

      {/* Showroom 3D de Armas */}
      <ArmamentShowcase />

      {/* Simulador Interativo */}
      <TacticalRadarDemo />

      {/* Mecânicas de Jogo */}
      <GameplayFeatures />

      {/* Salão da Fama */}
      <HallOfFame />

      {/* Rodapé */}
      <Footer onOpenAuth={handleOpenAuth} />

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
