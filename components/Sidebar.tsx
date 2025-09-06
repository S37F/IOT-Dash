import React from 'react';
import type { ViewType } from '../types';
import { DashboardIcon, AnalyticsIcon, LogoIcon } from './icons/Icons';

interface SidebarProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'analytics', label: 'Analytics', icon: <AnalyticsIcon /> },
  ];

  return (
    <nav className="bg-slate-900 w-20 lg:w-64 flex flex-col border-r border-slate-700">
      <div className="flex items-center justify-center lg:justify-start p-4 lg:p-6 h-20 border-b border-slate-700">
        <LogoIcon />
        <span className="hidden lg:block ml-3 text-2xl font-bold text-cyan-400">S37F</span>
      </div>
      <ul className="flex-1 px-2 lg:px-4 py-4">
        {navItems.map(item => (
          <li key={item.id}>
            <button
              onClick={() => setCurrentView(item.id as ViewType)}
              className={`flex items-center justify-center lg:justify-start w-full p-3 my-2 rounded-lg transition-all duration-200 ${
                currentView === item.id
                  ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                  : 'text-gray-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="hidden lg:block ml-4 font-semibold">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="p-4 border-t border-slate-700 text-center">
         <p className="text-xs text-slate-500 hidden lg:block">© built by S37F for IPD</p>
      </div>
    </nav>
  );
};

export default Sidebar;