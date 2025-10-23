import React from 'react';
import RegistrationSection from '../components/RegistrationSection';
import { AuthProvider } from '../components/AuthGuard';

const RegistrationPage: React.FC = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <RegistrationSection />
      </div>
    </AuthProvider>
  );
};

export default RegistrationPage;