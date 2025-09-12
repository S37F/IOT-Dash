
import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardView from './views/DashboardView';
import AnalyticsView from './views/AnalyticsView';
import { useSolarData } from './hooks/useSolarData';
import type { ViewType } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isLive, setIsLive] = useState(true);
  const { latestData, historicalData, isLoading, isDataAvailable } = useSolarData(isLive);

  return (
    <div className="flex h-screen bg-slate-900 text-gray-200 font-sans">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header isLive={isLive} setIsLive={setIsLive} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-800 p-4 md:p-6 lg:p-8">
          {currentView === 'dashboard' ? (
            <DashboardView 
              data={latestData} 
              isLive={isLive} 
              isLoading={isLoading} 
              isDataAvailable={isDataAvailable} 
            />
          ) : (
            <AnalyticsView data={historicalData} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
