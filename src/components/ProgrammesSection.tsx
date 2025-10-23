import React, { useState, useEffect } from 'react';
import { GraduationCap, BookOpen, Users, Award, ChevronRight, Clock, MapPin, Star } from 'lucide-react';
import { getForms } from '../lib/supabase';
import type { DynamicForm, Filiere } from '../lib/supabase';

const ProgrammesSection: React.FC = () => {
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiliere, setSelectedFiliere] = useState<Filiere | null>(null);

  useEffect(() => {
    loadFilieres();
  }, []);

  const loadFilieres = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎓 Chargement des filières depuis les formulaires...');
      const forms = await getForms();
      
      // Extraire les filières du premier formulaire trouvé (généralement le formulaire d'inscription)
      const mainForm = forms.find(form => form.status === 'published') || forms[0];
      
      if (mainForm && mainForm.filieres && mainForm.filieres.length > 0) {
        setFilieres(mainForm.filieres);
        console.log(`✅ ${mainForm.filieres.length} filière(s) chargée(s)`);
      } else {
        // Données de démonstration si aucune filière n'est trouvée
        const demoFilieres: Filiere[] = [
          {
            id: 'bm',
            name: 'Biologie Médicale (BM)',
            mentions: [
              'Techniques de laboratoire',
              'Analyses biomédicales',
              'Microbiologie médicale',
              'Hématologie',
              'Biochimie clinique'
            ]
          },
          {
            id: 'si',
            name: 'Soins Infirmiers (SI)',
            mentions: [
              'Soins généraux',
              'Soins intensifs',
              'Pédiatrie',
              'Chirurgie',
              'Santé communautaire'
            ]
          },
          {
            id: 'im',
            name: 'Imagerie Médicale (IM)',
            mentions: [
              'Radiologie conventionnelle',
              'Échographie',
              'Scanner (TDM)',
              'IRM',
              'Médecine nucléaire'
            ]
          },
          {
            id: 'gos',
            name: 'Gestion des Organisations de Santé (GOS)',
            mentions: [
              'Management en Santé',
              'Administration hospitalière',
              'Économie de la santé',
              'Qualité des soins',
              'Systèmes d\'information santé'
            ]
          }
        ];
        
        setFilieres(demoFilieres);
        console.log('📋 Utilisation des filières de démonstration');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('❌ Erreur lors du chargement des filières:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFiliereIcon = (filiereId: string) => {
    switch (filiereId.toLowerCase()) {
      case 'bm':
      case 'biologie':
        return '🔬';
      case 'si':
      case 'soins':
        return '🏥';
      case 'im':
      case 'imagerie':
        return '📡';
      case 'gos':
      case 'gestion':
        return '📊';
      default:
        return '🎓';
    }
  };

  const getFiliereColor = (index: number) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-orange-500 to-orange-600',
      'from-red-500 to-red-600',
      'from-indigo-500 to-indigo-600'
    ];
    return colors[index % colors.length];
  };

  const getCardBorderColor = (index: number) => {
    const colors = [
      'border-blue-200 hover:border-blue-400',
      'border-green-200 hover:border-green-400',
      'border-purple-200 hover:border-purple-400',
      'border-orange-200 hover:border-orange-400',
      'border-red-200 hover:border-red-400',
      'border-indigo-200 hover:border-indigo-400'
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <section className="py-20 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des programmes...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-red-100 p-4 rounded-full w-20 h-20 mx-auto mb-4">
              <GraduationCap className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Erreur de chargement</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadFilieres}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Réessayer
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête de section */}
        <div className="text-center mb-16">
          <div className="bg-blue-100 p-4 rounded-full w-20 h-20 mx-auto mb-6">
            <GraduationCap className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Nos Programmes de Formation
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            L'ISTM Kinshasa propose des formations de qualité dans le domaine médical, 
            avec des programmes adaptés aux besoins du secteur de la santé en RDC.
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <div className="bg-blue-100 p-3 rounded-full w-16 h-16 mx-auto mb-4">
              <BookOpen className="h-10 w-10 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{filieres.length}</div>
            <div className="text-gray-600">Filières</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto mb-4">
              <Users className="h-10 w-10 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {filieres.reduce((total, filiere) => total + filiere.mentions.length, 0)}
            </div>
            <div className="text-gray-600">Mentions</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <div className="bg-purple-100 p-3 rounded-full w-16 h-16 mx-auto mb-4">
              <Clock className="h-10 w-10 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">3</div>
            <div className="text-gray-600">Années</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
            <div className="bg-orange-100 p-3 rounded-full w-16 h-16 mx-auto mb-4">
              <Award className="h-10 w-10 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">95%</div>
            <div className="text-gray-600">Taux de réussite</div>
          </div>
        </div>

        {/* Liste des filières */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filieres.map((filiere, index) => (
            <div
              key={filiere.id}
              className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 ${getCardBorderColor(index)} overflow-hidden`}
            >
              {/* En-tête de la carte */}
              <div className={`bg-gradient-to-r ${getFiliereColor(index)} p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">
                      {getFiliereIcon(filiere.id)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{filiere.name}</h3>
                      <div className="flex items-center space-x-4 text-sm opacity-90">
                        <span className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-1" />
                          {filiere.mentions.length} mentions
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          3 ans
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFiliere(selectedFiliere?.id === filiere.id ? null : filiere)}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-colors duration-200"
                  >
                    <ChevronRight 
                      className={`h-6 w-6 transition-transform duration-200 ${
                        selectedFiliere?.id === filiere.id ? 'rotate-90' : ''
                      }`} 
                    />
                  </button>
                </div>
              </div>

              {/* Contenu de la carte */}
              <div className="p-6">
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Mentions disponibles :</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {filiere.mentions.slice(0, selectedFiliere?.id === filiere.id ? filiere.mentions.length : 3).map((mention, mentionIndex) => (
                      <div
                        key={mentionIndex}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <span className="text-gray-700 font-medium">{mention}</span>
                      </div>
                    ))}
                  </div>
                  
                  {filiere.mentions.length > 3 && selectedFiliere?.id !== filiere.id && (
                    <button
                      onClick={() => setSelectedFiliere(filiere)}
                      className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    >
                      Voir toutes les mentions ({filiere.mentions.length})
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  )}
                </div>

                {/* Informations supplémentaires */}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      Campus ISTM
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-2 text-yellow-400" />
                      Formation certifiée
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Section d'appel à l'action */}
        <div className="mt-20 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-12 text-white text-center">
          <h3 className="text-3xl font-bold mb-4">Prêt à rejoindre l'ISTM Kinshasa ?</h3>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Choisissez votre filière et commencez votre parcours vers l'excellence médicale. 
            Nos programmes sont conçus pour former les professionnels de santé de demain.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300 transform hover:scale-105 shadow-lg">
              Commencer l'inscription
            </button>
            <button className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105">
              Télécharger la brochure
            </button>
          </div>
        </div>

        {/* Informations pratiques */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Informations Pratiques</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Durée des études</h4>
              <p className="text-gray-600">3 années d'études avec stages pratiques intégrés</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                <Award className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Diplôme délivré</h4>
              <p className="text-gray-600">Diplôme d'État reconnu par le Ministère de l'ESU</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Accompagnement</h4>
              <p className="text-gray-600">Suivi personnalisé et insertion professionnelle</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProgrammesSection;