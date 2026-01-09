
import React from 'react';
import { ICONS } from '../constants';
import { UserRole } from '../types';

interface NavigationProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onNavigate: (view: string) => void;
  currentView: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  currentRole, 
  onRoleChange, 
  onNavigate, 
  currentView,
  isDarkMode,
  onToggleTheme
}) => {
  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.DONOR: return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30 shadow-[0_0_10px_rgba(8,145,178,0.2)]';
      case UserRole.NGO: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
      case UserRole.ADMIN: return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/30';
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-slate-950/80 border-slate-800' 
        : 'bg-white/80 border-slate-200'
    }`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => onNavigate('home')}
        >
          <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center group-hover:bg-cyan-500 transition-colors shadow-[0_0_15px_rgba(8,145,178,0.4)]">
            <ICONS.Box className="w-6 h-6 text-white" />
          </div>
          <span className={`text-xl font-bold bg-gradient-to-r from-cyan-500 to-indigo-500 bg-clip-text text-transparent`}>
            Medi-Give
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => onNavigate('home')}
            className={`text-sm font-medium transition-colors ${
              currentView === 'home' 
                ? 'text-cyan-500 underline underline-offset-8' 
                : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Home
          </button>
          <button 
            onClick={() => onNavigate('donate')}
            className={`text-sm font-medium transition-colors ${
              currentView === 'donate' 
                ? 'text-cyan-500 underline underline-offset-8' 
                : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Donate
          </button>
          <button 
            onClick={() => onNavigate('history')}
            className={`text-sm font-medium transition-colors ${
              currentView === 'history' 
                ? 'text-cyan-500 underline underline-offset-8' 
                : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            History
          </button>
          <button 
            onClick={() => onNavigate('ngo-dashboard')}
            className={`text-sm font-medium transition-colors ${
              currentView === 'ngo-dashboard' 
                ? 'text-cyan-500 underline underline-offset-8' 
                : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            NGO Hub
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className={`hidden sm:flex px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest animate-[pulse_3s_infinite] ${getRoleColor(currentRole)}`}>
            {currentRole} ACTIVE
          </div>

          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-lg border transition-all ${
              isDarkMode 
                ? 'bg-slate-900 border-slate-700 text-slate-400 hover:text-cyan-400' 
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-cyan-600 shadow-sm'
            }`}
          >
            {isDarkMode ? <ICONS.Sun className="w-5 h-5" /> : <ICONS.Moon className="w-5 h-5" />}
          </button>

          <div className="h-6 w-px bg-slate-800" />

          <select 
            value={currentRole}
            onChange={(e) => onRoleChange(e.target.value as UserRole)}
            className={`text-sm rounded-lg px-3 py-1.5 focus:ring-cyan-500 focus:border-cyan-500 outline-none border transition-colors cursor-pointer font-bold ${
              isDarkMode 
                ? 'bg-slate-900 border-slate-700 text-slate-300' 
                : 'bg-white border-slate-200 text-slate-700 shadow-sm'
            }`}
          >
            <option value={UserRole.DONOR}>Donor</option>
            <option value={UserRole.NGO}>NGO</option>
            <option value={UserRole.ADMIN}>Admin</option>
          </select>
          
          <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <ICONS.User className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`} />
          </div>
        </div>
      </div>
    </nav>
  );
};
