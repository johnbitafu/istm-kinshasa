import React, { useState, createContext, useContext } from 'react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Add a UUID validation function
const isUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

interface User {
  id: string;
  matricule: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
}

interface AuthContextType {
  user: User | null;
  login: (matricule: string) => Promise<boolean>;
  loginAdmin: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
  isStudent: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock users database
const mockAdminUsers: (User & { password: string })[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    matricule: 'ADMIN001',
    name: 'Administrateur ISTM',
    email: 'admin@istm-kinshasa.cd',
    role: 'admin',
    password: 'admin123'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    matricule: 'TEACH001',
    name: 'Dr. Mukamba',
    email: 'mukamba@istm-kinshasa.cd',
    role: 'teacher',
    password: 'teacher123'
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('istm_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && typeof parsedUser.id === 'string' && isUUID(parsedUser.id)) {
          return parsedUser;
        } else {
          localStorage.removeItem('istm_user'); // Clear invalid data
        }
      } catch (e) { /* Error parsing, will return null */ }
    }
    return null;
  });

  const login = async (matricule: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, matricule, full_name, email, status')
        .eq('matricule', matricule)
        .eq('status', 'approved')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const studentUser: User = {
          id: data.id,
          matricule: data.matricule,
          name: data.full_name,
          email: data.email || '',
          role: 'student'
        };

        setUser(studentUser);
        localStorage.setItem('istm_user', JSON.stringify(studentUser));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return false;
    }
  };

  const loginAdmin = async (email: string, password: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Vérifier avec les comptes administrateurs
      const mockUser = mockAdminUsers.find(u => u.email === email && u.password === password);
      
      if (mockUser) {
        const { password: _, ...userWithoutPassword } = mockUser;
        setUser(userWithoutPassword);
        localStorage.setItem('istm_user', JSON.stringify(userWithoutPassword));
        
        console.log('✅ Connexion admin réussie pour:', email);
        return true;
      }
    } catch (error) {
      console.error('Erreur de connexion admin:', error);
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('istm_user');
  };

  const isAdmin = () => user?.role === 'admin';
  const isStudent = () => user?.role === 'student';

  return (
    <AuthContext.Provider value={{ user, login, loginAdmin, logout, isAdmin, isStudent }}>
      {children}
    </AuthContext.Provider>
  );
};

interface LoginFormProps {
  onLogin: (success: boolean) => void;
  isAdminLogin?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, isAdminLogin = false }) => {
  const [matricule, setMatricule] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(isAdminLogin);
  const { login, loginAdmin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let success = false;
      
      if (showAdminLogin) {
        success = await loginAdmin(email, password);
        if (!success) {
          setError('Email ou mot de passe incorrect');
        }
      } else {
        success = await login(matricule);
        if (!success) {
          setError('Matricule non trouvé ou inscription non approuvée');
        }
      }
      
      if (success) {
        onLogin(true);
      } else {
        onLogin(false);
      }
    } catch (err) {
      setError('Erreur de connexion. Veuillez réessayer.');
      onLogin(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-100 p-4 rounded-full w-20 h-20 mx-auto mb-4">
            <Lock className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {showAdminLogin ? 'Connexion Administrateur' : 'Connexion Étudiant'}
          </h1>
          <p className="text-gray-600">
            {showAdminLogin ? 'ISTM Kinshasa - Back Office' : 'ISTM Kinshasa - Espace Étudiant'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {showAdminLogin ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="admin@istm-kinshasa.cd"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de matricule
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ISTM20250001"
                  required
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Utilisez le matricule généré lors de votre inscription
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAdminLogin(!showAdminLogin)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {showAdminLogin ? 'Connexion Étudiant' : 'Connexion Administrateur'}
          </button>
        </div>

        {!showAdminLogin && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Information</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p>• Seuls les étudiants inscrits et approuvés peuvent se connecter</p>
              <p>• Utilisez le matricule reçu après validation de votre inscription</p>
              <p>• Format du matricule : ISTM + année + numéro (ex: ISTM20250001)</p>
            </div>
          </div>
        )}

        {showAdminLogin && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Prod By Jober</h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong></strong>
              </div>
              <div>
                <strong></strong> 
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireStudent?: boolean;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireAdmin = false, requireStudent = false }) => {
  const { user, isAdmin, isStudent, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(!user);

  if (showLogin || !user) {
    return <LoginForm onLogin={(success) => setShowLogin(!success)} isAdminLogin={requireAdmin} />;
  }

  if (requireAdmin && !isAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="flex justify-end mb-4">
            <button 
              onClick={() => logout()}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          <div className="bg-red-100 p-4 rounded-full w-20 h-20 mx-auto mb-4">
            <Lock className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Accès Refusé</h2>
          <p className="text-gray-600 mb-6">
            Vous devez être administrateur pour accéder à cette section.
          </p>
          <p className="text-sm text-gray-500">
            Rôle actuel: <span className="font-semibold">{user.role}</span>
          </p>
        </div>
      </div>
    );
  }

  if (requireStudent && !isStudent()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="flex justify-end mb-4">
            <button 
              onClick={() => logout()}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          <div className="bg-orange-100 p-4 rounded-full w-20 h-20 mx-auto mb-4">
            <Lock className="h-12 w-12 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Accès Étudiant Requis</h2>
          <p className="text-gray-600 mb-6">
            Vous devez être un étudiant inscrit et approuvé pour accéder à cette fonctionnalité.
          </p>
          <p className="text-sm text-gray-500">
            Connectez-vous avec votre matricule étudiant.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
//admin@istm-kinshasa.cd / admin123
//mukamba@istm-kinshasa.cd / teacher123