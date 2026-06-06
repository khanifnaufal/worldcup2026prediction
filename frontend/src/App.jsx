import React, { useState } from 'react';
import { Trophy, Grid, GitMerge, Users, HelpCircle, Activity } from 'lucide-react';
import simulationData from './data/simulation_results.json';
import OverviewTab from './components/OverviewTab';
import GroupsTab from './components/GroupsTab';
import BracketTab from './components/BracketTab';
import TeamsTab from './components/TeamsTab';
import TeamDetailModal from './components/TeamDetailModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Tab mapping
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Trophy },
    { id: 'groups', label: 'Groups', icon: Grid },
    { id: 'bracket', label: 'Bracket', icon: GitMerge },
    { id: 'teams', label: 'Teams', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Premium Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/85 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo / Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black tracking-tight text-white block text-sm sm:text-base leading-none">
                WORLD CUP 2026
              </span>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                Simulation Engine
              </span>
            </div>
          </div>

          {/* Desktop/Tablet Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Render Tab Content */}
        {activeTab === 'overview' && (
          <OverviewTab simulationData={simulationData} />
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

      </main>

      {/* Premium Footer */}
      <footer className="bg-slate-950/40 border-t border-slate-900 py-6 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-1">
          <p>© 2026 FIFA World Cup Prediction Dashboard. All simulation weights are computational estimates.</p>
          <div className="flex justify-center gap-4 text-[10px] text-indigo-500/60 font-semibold pt-1">
            <span>MODEL: {simulationData.metadata.model_used}</span>
            <span>•</span>
            <span>SIMULATIONS: {simulationData.metadata.n_simulations.toLocaleString()}</span>
            <span>•</span>
            <span>F1: {simulationData.metadata.model_f1_score.toFixed(4)}</span>
          </div>
        </div>
      </footer>

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
