import React from 'react';
import { Link } from 'react-router-dom';
import { Microscope, Users2, Globe, Target } from 'lucide-react';

const AboutSection: React.FC = () => {
  const features = [
    {
      icon: Microscope,
      title: 'Formation Pratique',
      description: 'Laboratoires modernes équipés des dernières technologies médicales pour une formation hands-on.'
    },
    {
      icon: Users2,
      title: 'Corps Professoral Expert',
      description: 'Enseignants qualifiés avec une expérience pratique dans le domaine médical.'
    },
    {
      icon: Globe,
      title: 'Reconnaissance Internationale',
      description: 'Diplômes reconnus et programmes conformes aux standards internationaux.'
    },
    {
      icon: Target,
      title: 'Insertion Professionnelle',
      description: 'Accompagnement personnalisé pour l\'insertion dans le monde professionnel.'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Pourquoi choisir l'ISTM Kinshasa ?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Notre institut se distingue par son excellence académique, ses infrastructures modernes 
            et son engagement pour la formation de professionnels de santé compétents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group bg-gray-50 p-8 rounded-xl hover:bg-blue-50 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="bg-blue-100 group-hover:bg-blue-200 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-6 transition-colors duration-300">
                <feature.icon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-12 text-white text-center">
          <h3 className="text-3xl font-bold mb-4">Prêt à commencer votre parcours médical ?</h3>
          <p className="text-xl mb-8 opacity-90">
            Rejoignez une communauté d'étudiants passionnés et de professionnels dévoués à l'excellence médicale.
          </p>
          



                  <Link 
            to="/inscription"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300 transform hover:scale-105 shadow-lg inline-block"
          >
            Commencer l'inscription
          </Link>

          
          {/* <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
 <button 
              onClick={() => setActiveSection('inscription')}
              className="border-2 border-white text-white hover:bg-white hover:text-blue-700 px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              S'inscrire maintenant
            </button>
          </div>*/}

          
        </div>
      </div>
    </section>
  );
};

export default AboutSection;