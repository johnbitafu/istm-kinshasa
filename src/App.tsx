import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from './components/Header';
import NotificationBanner from './components/NotificationBanner';
import ConnectionStatus from './components/ConnectionStatus';
import ScrollingBackground from './components/ScrollingBackground';
import Hero from './components/Hero';
import AboutSection from './components/AboutSection';
import FeaturedContentModal from './components/FeaturedContentModal';
import ProgrammesSection from './components/ProgrammesSection';
import ContentSection from './components/ContentSection';
import ForumSection from './components/ForumSection';
import RegistrationSection from './components/RegistrationSection';
import BackOffice from './components/BackOffice';
import DataMigration from './components/DataMigration';
import AuthGuard, { AuthProvider } from './components/AuthGuard';
import Footer from './components/Footer';

function App() {
  const [activeSection, setActiveSection] = useState('accueil');
  const [showFeaturedContentModal, setShowFeaturedContentModal] = useState(true);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'accueil':
        return (
          <div className="relative">
            <ScrollingBackground />
            <div className="relative z-10">
              <Hero setActiveSection={setActiveSection} />
              <AboutSection />
            </div>
          </div>
        );
      case 'programmes':
        return <ProgrammesSection />;
      case 'backoffice':
        return (
          <AuthGuard requireAdmin={false}>
            <BackOffice />
          </AuthGuard>
        );
      case 'migration':
        return <DataMigration />;
      case 'contenu':
        return <ContentSection selectedContentId={selectedContentId} />;
      case 'forum':
        return <ForumSection />;
      case 'inscription':
        return <RegistrationSection />;
      default:
        return (
          <div className="relative">
            <ScrollingBackground />
            <div className="relative z-10">
            <Hero setActiveSection={setActiveSection} />
            <AboutSection />
            </div>
          </div>
        );
    }
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <NotificationBanner />
        <ConnectionStatus />
        <Header activeSection={activeSection} setActiveSection={setActiveSection} />
        <main>
          {renderActiveSection()}
        </main>
        
        {/* Featured Content Modal */}
        {showFeaturedContentModal && activeSection === 'accueil' && (
          <FeaturedContentModal
            onClose={() => setShowFeaturedContentModal(false)}
            setActiveSection={setActiveSection}
            onSelectContent={(contentId) => {
              setSelectedContentId(contentId);
              setActiveSection('contenu');
              setShowFeaturedContentModal(false);
            }}
          />
        )}
        
        {activeSection !== 'backoffice' && <Footer />}
      </div>
    </AuthProvider>
  );
}

export default App;