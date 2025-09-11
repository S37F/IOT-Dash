import React from 'react';
import { PauseIcon, PlayIcon } from './icons/Icons';

interface PausableWrapperProps {
    children: React.ReactNode;
    isPaused: boolean;
    onTogglePause: () => void;
    isLive: boolean;
}

const PausableWrapper: React.FC<PausableWrapperProps> = ({ children, isPaused, onTogglePause, isLive }) => {
  return (
    <div className="relative h-full">
      {children}

      {isLive && (
        <button 
          onClick={onTogglePause} 
          className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-slate-700/50 text-slate-300 hover:bg-slate-600/70 hover:text-white transition-all duration-200"
          aria-label={isPaused ? 'Resume live data for this card' : 'Pause live data for this card'}
        >
          {isPaused ? <PlayIcon className="h-4 w-4" /> : <PauseIcon className="h-4 w-4" />}
        </button>
      )}

      {isPaused && isLive && (
        <div className="absolute inset-0 bg-slate-800/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
          <div className="flex flex-col items-center text-slate-300">
            <PauseIcon className="h-8 w-8 text-yellow-400" />
            <span className="mt-1 text-xs font-semibold">Paused</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PausableWrapper;
