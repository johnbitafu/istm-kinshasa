import React from 'react';
import { Users, BookOpen, Award, Heart } from 'lucide-react';

interface HeroProps {
  setActiveSection: (section: string) => void;
}

const Hero: React.FC<HeroProps> = ({ setActiveSection }) => {
  const stats = [
    { icon: Users, value: '500+', label: 'Étudiants' },
    { icon: BookOpen, value: '15+', label: 'Programmes' },
    { icon: Award, value: '20+', label: 'Années d\'expérience' },
    { icon: Heart, value: '95%', label: 'Taux de réussite' }
  ];

  return (
    <section className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-green-600 text-white">
      <div className="absolute inset-0 bg-black opacity-20"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Institut Supérieur des
            <span className="block text-green-300">Techniques Médicales de Kinshasa</span>
            <span className="block text-2xl md:text-3xl font-normal mt-2"></span>
          </h1>
          <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed">
            Formant l'excellence médicale de demain avec des programmes innovants 
            et une approche pédagogique moderne centrée sur la pratique.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button 
              onClick={() => setActiveSection('programmes')}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Nos Programmes
            </button>
            <button 
              onClick={() => setActiveSection('inscription')}
              className="border-2 border-white text-white hover:bg-white hover:text-blue-700 px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              S'inscrire maintenant
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center transform hover:scale-105 transition-transform duration-300">
                <div className="bg-white bg-opacity-10 rounded-full p-4 inline-flex mb-4">
                  <stat.icon className="h-8 w-8" />
                </div>
                <div className="text-3xl font-bold mb-2">{stat.value}</div>
                <div className="text-green-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;