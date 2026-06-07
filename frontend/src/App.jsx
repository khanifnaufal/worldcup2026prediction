import React, { useState } from 'react';
import simulationData from './data/simulation_results.json';
import OverviewTab from './components/OverviewTab';
import GroupsTab from './components/GroupsTab';
import BracketTab from './components/BracketTab';
import TeamsTab from './components/TeamsTab';
import TeamDetailModal from './components/TeamDetailModal';
import { LayoutDashboard, Grid, Trophy, Shield } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Tab mapping
  const tabs = [
    { id: 'overview', label: 'Overview', num: '01' },
    { id: 'groups', label: 'Groups', num: '02' },
    { id: 'bracket', label: 'Bracket', num: '03' },
    { id: 'teams', label: 'Teams', num: '04' },
  ];

  return (
    <div className="min-h-screen bg-dark-bg text-white-alt flex flex-col font-noto select-none antialiased">
      {/* Premium Navigation Header */}
      <header className="sticky top-0 z-40 bg-dark-bg/90 backdrop-blur-md border-b border-gold/15 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <img 
              src="/logo.avif" 
              alt="FIFA World Cup 2026 Logo" 
              className="h-9 w-auto object-contain select-none"
            />
            <div className="flex flex-col justify-center">
              <div className="flex items-baseline gap-1">
                <span className="font-bebas text-2xl tracking-normal text-gold leading-none">WORLD CUP</span>
                <span className="font-bebas text-2xl tracking-normal text-white-alt leading-none">2026</span>
              </div>
              <span className="text-[9px] text-text-muted-alt font-noto font-semibold uppercase tracking-[0.25em] mt-0.5">
                PREDICTION ENGINE
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-stretch h-16">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 sm:px-5 h-full transition-all duration-200 border-b-2 font-bebas text-base sm:text-lg uppercase tracking-wider relative ${
                    isActive
                      ? 'bg-gold-muted border-gold text-gold'
                      : 'border-transparent text-text-muted-alt hover:text-white-alt hover:bg-white/[0.02]'
                  }`}
                >
                  <span className="font-noto text-[9px] text-text-muted-alt/70 font-normal tracking-normal normal-case -mt-1.5">
                    {tab.num}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        
        {/* Render Tab Content */}
        <div key={activeTab} className="fade-slide-up">
          {activeTab === 'overview' && (
            <OverviewTab 
              simulationData={simulationData} 
              onSelectTeam={setSelectedTeam} 
            />
          )}
          {activeTab === 'groups' && (
            <GroupsTab simulationData={simulationData} />
          )}
          {activeTab === 'bracket' && (
            <BracketTab simulationData={simulationData} />
          )}
          {activeTab === 'teams' && (
            <TeamsTab 
              simulationData={simulationData} 
              onSelectTeam={setSelectedTeam} 
            />
          )}
        </div>

      </main>

      {/* Premium Footer */}
      <footer className="bg-dark-card border-t border-gold/10 py-6 text-center text-xs text-text-muted-alt mt-12 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <p>© 2026 FIFA World Cup Prediction Dashboard. All simulation weights are computational estimates.</p>
          <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 text-[10px] text-gold/60 font-semibold pt-1">
            <span>MODEL: {simulationData.metadata.model_used}</span>
            <span>•</span>
            <span>SIMULATIONS: {simulationData.metadata.n_simulations.toLocaleString()}</span>
            <span>•</span>
            <span>F1: {simulationData.metadata.model_f1_score.toFixed(4)}</span>
          </div>
        </div>
      </footer>

      {/* Premium Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-dark-bg/95 backdrop-blur-md border-t border-gold/15 shadow-[0_-4px_12px_rgba(0,0,0,0.5)] flex justify-around items-center h-16 px-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          let Icon;
          if (tab.id === 'overview') Icon = LayoutDashboard;
          else if (tab.id === 'groups') Icon = Grid;
          else if (tab.id === 'bracket') Icon = Trophy;
          else if (tab.id === 'teams') Icon = Shield;

          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 relative ${
                isActive ? 'text-gold' : 'text-text-muted-alt hover:text-white-alt'
              }`}
            >
              {Icon && <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />}
              <span className="text-[10px] font-semibold tracking-wider uppercase mt-1 font-noto">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-gold rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Shared Detail Modal */}
      {selectedTeam && (
        <TeamDetailModal
          teamName={selectedTeam}
          simulationData={simulationData}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </div>
  );
}
