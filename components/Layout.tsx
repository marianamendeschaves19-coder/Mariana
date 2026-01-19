
import React from 'react';
import { User, UserRole } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children }) => {
  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.MANAGER: return 'Gestor(a)';
      case UserRole.TEACHER: return 'Professor(a)';
      case UserRole.GUARDIAN: return 'Responsável';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="gradient-aquarela text-white shadow-lg p-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-white p-2 rounded-full">
              <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 12h3v8h14v-8h3L12 2zM12 17a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Agenda Aquarela</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs opacity-80">{getRoleLabel(user.role)}</p>
            </div>
            <button 
              onClick={onLogout}
              className="bg-white/20 hover:bg-white/30 transition-colors p-2 rounded-lg text-xs font-bold"
            >
              SAIR
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6">
        {children}
      </main>

      <footer className="p-4 text-center text-gray-400 text-xs">
        &copy; 2024 Agenda Aquarela - O Futuro da Educação
      </footer>
    </div>
  );
};

export default Layout;
