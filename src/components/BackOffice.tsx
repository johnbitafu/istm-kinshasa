import React, { useState } from 'react';
import { Plus, Edit, Trash2, Users, Calendar, MessageSquare, BookOpen, Settings, BarChart3, Bell, FileText, Lock, Image } from 'lucide-react';
import DynamicFormBuilder from './DynamicFormBuilder';
import { useAuth } from './AuthGuard';
import FirebaseDiagnostics from './FirebaseDiagnostics';
import ContentManagement from './ContentManagement';
import DatabaseSelector from './DatabaseSelector';

interface Event {
  id: string;
  type: 'event' | 'conference' | 'forum' | 'class';
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  instructor?: string;
  participants: number;
  maxParticipants?: number;
  status: 'draft' | 'published' | 'cancelled';
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  program?: string;
}

const BackOffice: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<'event' | 'conference' | 'forum' | 'class'>('event');
  const { user, logout, isAdmin } = useAuth();
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    instructor: '',
    maxParticipants: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Vérifier si l'utilisateur a accès au back office
  if (!user) {
    return <div>Chargement...</div>;
  }

  // Seuls les admins et professeurs peuvent accéder au back office
  if (user.role !== 'admin' && user.role !== 'teacher') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="flex justify-end mb-4">
            <button 
              onClick={logout}
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
            Vous devez être administrateur ou professeur pour accéder au back office.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Rôle actuel: <span className="font-semibold">{user.role}</span>
          </p>
          <p className="text-sm text-blue-600">
            Matricule: <span className="font-semibold">{user.matricule}</span>
          </p>
          <button
            onClick={logout}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            Se déconnecter et changer de compte
          </button>
        </div>
      </div>
    );
  }

  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      type: 'conference',
      title: 'Conférence sur les nouvelles techniques chirurgicales',
      description: 'Présentation des dernières innovations en chirurgie minimalement invasive',
      date: '2025-02-15',
      time: '14:00',
      location: 'Amphithéâtre A',
      instructor: 'Dr. Mukamba',
      participants: 45,
      maxParticipants: 100,
      status: 'published'
    },
    {
      id: '2',
      type: 'class',
      title: 'Cours d\'Anatomie - Système Cardiovasculaire',
      description: 'Étude détaillée du cœur et des vaisseaux sanguins',
      date: '2025-01-20',
      time: '09:00',
      location: 'Salle 201',
      instructor: 'Prof. Kabongo',
      participants: 25,
      maxParticipants: 30,
      status: 'published'
    }
  ]);

  const [users] = useState<User[]>([
    { id: '1', name: 'Marie Mukendi', email: 'marie@istm.cd', role: 'student', program: 'Soins Infirmiers' },
    { id: '2', name: 'Jean Kasongo', email: 'jean@istm.cd', role: 'student', program: 'Laboratoire Médical' },
    { id: '3', name: 'Dr. Lumumba', email: 'lumumba@istm.cd', role: 'teacher' }
  ]);

  const tabs = [
    { id: 'dashboard', label: 'Tableau de bord', icon: BarChart3 },
    ...(isAdmin() ? [{ id: 'forms', label: 'Formulaires', icon: FileText }] : []),
    { id: 'content', label: 'Contenu', icon: Image },
    { id: 'events', label: 'Événements', icon: Calendar },
    { id: 'conferences', label: 'Conférences', icon: Users },
    { id: 'forums', label: 'Forums', icon: MessageSquare },
    { id: 'classes', label: 'Classes', icon: BookOpen },
    ...(isAdmin() ? [
      { id: 'users', label: 'Utilisateurs', icon: Users },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'settings', label: 'Paramètres', icon: Settings }
    ] : [])
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'conference': return 'bg-blue-100 text-blue-800';
      case 'class': return 'bg-green-100 text-green-800';
      case 'forum': return 'bg-purple-100 text-purple-800';
      case 'event': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Validation des champs requis
      if (!newEvent.title || !newEvent.date || !newEvent.time || !newEvent.location) {
        setSubmitError('Veuillez remplir tous les champs obligatoires');
        setIsSubmitting(false);
        return;
      }

      // Créer le nouvel événement
      const eventToCreate: Event = {
        id: Date.now().toString(),
        type: selectedEventType,
        title: newEvent.title,
        description: newEvent.description,
        date: newEvent.date,
        time: newEvent.time,
        location: newEvent.location,
        instructor: newEvent.instructor || undefined,
        participants: 0,
        maxParticipants: newEvent.maxParticipants ? parseInt(newEvent.maxParticipants) : undefined,
        status: 'draft'
      };

      // Ajouter à la liste des événements
      setEvents(prev => [...prev, eventToCreate]);

      // Réinitialiser le formulaire
      setNewEvent({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        instructor: '',
        maxParticipants: ''
      });
      setSelectedEventType('event');
      setShowCreateModal(false);

      // Optionnel: Afficher un message de succès
      console.log('Événement créé avec succès:', eventToCreate);

    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error);
      setSubmitError('Erreur lors de la création de l\'événement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setNewEvent(prev => ({ ...prev, [field]: value }));
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <DatabaseSelector />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Événements</p>
              <p className="text-3xl font-bold text-gray-900">{events.length}</p>
            </div>
            <Calendar className="h-12 w-12 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Utilisateurs Actifs</p>
              <p className="text-3xl font-bold text-gray-900">{users.length}</p>
            </div>
            <Users className="h-12 w-12 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Classes Actives</p>
              <p className="text-3xl font-bold text-gray-900">
                {events.filter(e => e.type === 'class' && e.status === 'published').length}
              </p>
            </div>
            <BookOpen className="h-12 w-12 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conférences</p>
              <p className="text-3xl font-bold text-gray-900">
                {events.filter(e => e.type === 'conference').length}
              </p>
            </div>
            <MessageSquare className="h-12 w-12 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-4">Événements Récents</h3>
          <div className="space-y-3">
            {events.slice(0, 5).map(event => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-gray-600">{event.date} à {event.time}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(event.status)}`}>
                  {event.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-4">Statistiques</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Taux de participation</span>
              <span className="font-semibold">85%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Satisfaction moyenne</span>
              <span className="font-semibold">4.7/5</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '94%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEventsList = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Événements</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nouvel Événement</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Événement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date/Heure
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map(event => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{event.title}</div>
                      <div className="text-sm text-gray-500">{event.location}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(event.type)}`}>
                      {event.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>{event.date}</div>
                    <div className="text-gray-500">{event.time}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {event.participants}{event.maxParticipants && `/${event.maxParticipants}`}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCreateModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Créer un Nouvel Événement</h2>
            <button 
              onClick={() => {
                setShowCreateModal(false);
                setSubmitError('');
                setNewEvent({
                  title: '',
                  description: '',
                  date: '',
                  time: '',
                  location: '',
                  instructor: '',
                  maxParticipants: ''
                });
              }}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{submitError}</p>
            </div>
          )}

          <form onSubmit={handleCreateEvent} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type d'événement
              </label>
              <select 
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value as any)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="event">Événement</option>
                <option value="conference">Conférence</option>
                <option value="forum">Forum</option>
                <option value="class">Classe</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre *
              </label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Titre de l'événement"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={newEvent.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                rows={4}
                placeholder="Description détaillée"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure *
                </label>
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lieu *
              </label>
              <input
                type="text"
                value={newEvent.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Salle, amphithéâtre, etc."
                required
              />
            </div>

            {(selectedEventType === 'class' || selectedEventType === 'conference') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructeur/Intervenant
                </label>
                <input
                  type="text"
                  value={newEvent.instructor}
                  onChange={(e) => handleInputChange('instructor', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nom de l'instructeur"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre maximum de participants
              </label>
              <input
                type="number"
                value={newEvent.maxParticipants}
                onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 50"
                min="1"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button 
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setSubmitError('');
                  setNewEvent({
                    title: '',
                    description: '',
                    date: '',
                    time: '',
                    location: '',
                    instructor: '',
                    maxParticipants: ''
                  });
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Création...</span>
                  </div>
                ) : (
                  'Créer l\'événement'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900">Back Office</h1>
            <p className="text-sm text-gray-600">ISTM Kinshasa</p>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">{user?.name}</p>
              <p className="text-xs text-blue-700">{user?.role}</p>
              <button
                onClick={logout}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Déconnexion
              </button>
            </div>
          </div>
          
          <nav className="mt-6">
            {tabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-6 py-3 text-left hover:bg-blue-50 transition-colors duration-200 ${
                    activeTab === tab.id ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' : 'text-gray-700'
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'forms' && <DynamicFormBuilder />}
          {activeTab === 'content' && <ContentManagement />}
          {(activeTab === 'students' || activeTab === 'users') && <StudentManagement />}
          {(activeTab === 'events' || activeTab === 'conferences' || activeTab === 'forums' || activeTab === 'classes') && renderEventsList()}
          {activeTab === 'users' && (
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-2xl font-bold mb-6">Gestion des Utilisateurs</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Programme</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map(user => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
                            user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{user.program || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && renderCreateModal()}
    </div>
  );
};

export default BackOffice;