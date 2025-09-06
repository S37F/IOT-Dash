import React from 'react';

interface HeaderProps {
    isLive: boolean;
    setIsLive: (isLive: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ isLive, setIsLive }) => {
  return (
    <header className="bg-slate-900/70 backdrop-blur-sm shadow-md p-4 flex justify-between items-center border-b border-slate-700">
      <h1 className="text-xl md:text-2xl font-bold text-white tracking-wider">
        Dashboard
      </h1>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full transition-colors ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
          <span className={`text-sm font-semibold ${isLive ? 'text-green-400' : 'text-gray-400'}`}>{isLive ? 'Live' : 'Paused'}</span>
        </div>
        <button
            onClick={() => setIsLive(!isLive)}
            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 flex items-center space-x-2 ${isLive ? 'bg-orange-500/80 hover:bg-orange-500 text-white' : 'bg-cyan-500/80 hover:bg-cyan-500 text-white'}`}
            aria-label={isLive ? 'Pause data stream' : 'Resume data stream'}
        >
            {isLive ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
            )}
            <span>{isLive ? 'Pause' : 'Live'}</span>
        </button>
      </div>
    </header>
  );
};

export default Header;