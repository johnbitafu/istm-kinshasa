import React from 'react';
import { GraduationCap, Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo et Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <img 
                src="https://i.postimg.cc/CKRW0X1B/freepik-hand-drawn-online-tutoring-logo-20250521140425s-Emd.png" 
                alt="Logo ISTM" 
                className="w-12 h-12 object-contain"
                onError={(e) => {
                  // Fallback si l'image ne charge pas
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement!;
                  parent.innerHTML = '<div class="bg-blue-600 p-2 rounded-lg"><div class="h-8 w-8 text-white flex items-center justify-center font-bold">ISTM</div></div>';
                }}
              />
              <div>
                <h3 className="text-2xl font-bold">ISTM Kinshasa</h3>
                <p className="text-blue-300">Excellence Médicale</p>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed mb-6">
              L'Institut Supérieur des Techniques Médicales de Kinshasa forme depuis plus de 20 ans 
              les professionnels de santé de demain avec des programmes innovants et une approche 
              pédagogique moderne.
            </p>
            <div className="flex space-x-4">
              <Facebook className="h-6 w-6 text-gray-400 hover:text-blue-400 cursor-pointer transition-colors duration-200" />
              <Twitter className="h-6 w-6 text-gray-400 hover:text-blue-400 cursor-pointer transition-colors duration-200" />
              <Linkedin className="h-6 w-6 text-gray-400 hover:text-blue-400 cursor-pointer transition-colors duration-200" />
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Contact</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <MapPin className="h-14 w-14 text-blue-400" />
                <span className="text-gray-300">Route Kimwenza, Vallée de la FUNA, Mont-Ngafula. Réf : en face du CNPP. Kinshasa, RDC</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-blue-400" />
                <span className="text-gray-300">+243 977 127 160</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-blue-400" />
                <span className="text-gray-300">secretariat@istm-kinshasa.cd</span>
              </div>
            </div>
          </div>

          {/* Liens Rapides 
          <div>
            <h4 className="text-lg font-semibold mb-6">Liens Rapides</h4>
            <ul className="space-y-3">
             <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">Programmes</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">Admissions</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">Campus</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">Recherche</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">Alumni</a></li>
            </ul>
          </div>
          */}
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 Institut Supérieur des Techniques Médicales de Kinshasa. Tous droits réservés.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors duration-200"> Build By Jober Family
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                Construisez votre avenir
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;