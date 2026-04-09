import React from 'react';
import { GraduationCap, Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from './AuthGuard';

interface HeaderProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeSection, setActiveSection }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { user, logout, isStudent } = useAuth();

  const navItems = [
    { id: 'accueil', label: 'Accueil' },
    { id: 'programmes', label: 'Programmes' },
    { id: 'contenu', label: 'Contenu' },
    //{ id: 'forum', label: 'Forum' },
    { id: 'inscription', label: 'Inscription' },
    { id: 'backoffice', label: 'Se Connecter' }
  ];

  return (
    <>
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img 
              src="https://i.postimg.cc/CKRW0X1B/freepik-hand-drawn-online-tutoring-logo-20250521140425s-Emd.png" 
              alt="Logo ISTM" 
              className="w-12 h-12 object-contain"
              onError={(e) => {
                // Fallback si l'image ne charge pas
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement!;
                parent.innerHTML = '<div class="w-12 h-12 flex items-center justify-center"><span class="text-blue-600 font-bold text-sm">ISTM</span></div>';
              }}
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">ISTM Kinshasa</h1>
              <p className="text-sm text-gray-600">Excellence Médicale</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => {
              if (item.id === 'inscription') {
                return (
                  <a
                    key={item.id}
                    href="https://www.jober.space/inscription"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center space-x-1"
                  >
                    <span>{item.label}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                );
              }
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    activeSection === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User Badge (student only) */}
          {user && isStudent() && (
            <div className="hidden md:flex items-center">
              <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-blue-800 max-w-[120px] truncate">{user.matricule}</span>
                <button
                  onClick={() => { logout(); setActiveSection('backoffice'); }}
                  className="text-blue-400 hover:text-red-500 transition-colors ml-1"
                  title="Se déconnecter"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {user && isStudent() && (
              <div className="flex items-center space-x-1 bg-blue-50 border border-blue-200 rounded-full px-2 py-1">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-blue-800">{user.matricule}</span>
                <button
                  onClick={() => { logout(); setActiveSection('backoffice'); }}
                  className="text-blue-400 hover:text-red-500 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              {navItems.map((item) => {
                if (item.id === 'inscription') {
                  return (
                    <a
                      key={item.id}
                      href="https://www.jober.space/inscription"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center space-x-1"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>{item.label}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  );
                }
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setIsMenuOpen(false);
                    }}
                    className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200 ${
                      activeSection === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>

  </>
  );
};

export default Header;