import React from 'react';
import { X, Shield, ChevronRight, HelpCircle } from 'lucide-react';
import { getConfedColor, getTeamConfed, formatPercent } from '../utils/helpers';
import TeamFlag from './TeamFlag';

export default function TeamDetailModal({ teamName, simulationData, onClose }) {
  if (!teamName) return null;

  const team = simulationData.teams[teamName];
  if (!team) return null;

  const confed = getTeamConfed(teamName);
  const confedColor = getConfedColor(teamName);

  // Set up the stepper rates
  const steps = [
    { label: 'Group Stage', rate: team.group_qualify_rate },
    { label: 'Round of 32', rate: team.r32_rate },
    { label: 'Round of 16', rate: team.r16_rate },
    { label: 'Quarter Finals', rate: team.qf_rate },
    { label: 'Semi Finals', rate: team.sf_rate },
    { label: 'Finals', rate: team.final_rate },
    { label: 'Champion', rate: team.champion_rate }
  ];

  // Helper to color progress bars dynamically
  const getRateColor = (rate) => {
    if (rate > 0.5) return '#10B981'; // Green
    if (rate >= 0.2) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getRateColorClass = (rate) => {
    if (rate > 0.5) return 'bg-emerald-500';
    if (rate >= 0.2) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-[#1E293B] border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col z-10 fade-in scrollbar-thin">
        {/* Header banner with team colors */}
        <div className="relative p-6 border-b border-slate-800 flex justify-between items-start bg-slate-900/40">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <TeamFlag teamName={teamName} className="w-6 h-4" />
                {teamName}
              </h2>
              <span 
                className="text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider text-white"
                style={{ backgroundColor: `${confedColor}20`, borderColor: confedColor, color: confedColor }}
              >
                {confed}
              </span>
            </div>
            
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Group <span className="text-indigo-400 font-bold">{team.group}</span>
            </p>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700/80 text-slate-400 hover:text-white transition-all shadow-md"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto">
          
          {/* Section 1: Probability Stepper */}
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4">
                Round Advancements
              </h3>
              <p className="text-[11px] text-slate-400 -mt-2 mb-4">Cumulative probability to reach or win each round</p>
            </div>

            <div className="relative pl-6 border-l-2 border-slate-800 space-y-5">
              {steps.map((step, idx) => {
                const color = getRateColor(step.rate);
                const colorClass = getRateColorClass(step.rate);

                return (
                  <div key={idx} className="relative group">
                    {/* Circle Bullet */}
                    <div 
                      className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-slate-900 transition-all duration-300"
                      style={{ borderColor: color }}
                    />

                    {/* Step Content */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-350 text-slate-200">{step.label}</span>
                        <span style={{ color }}>{formatPercent(step.rate)}</span>
                      </div>

                      {/* Micro Progress Bar */}
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-900/60">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                          style={{ width: `${step.rate * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Most Likely Path */}
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4">
                Most Likely Path
              </h3>
              <p className="text-[11px] text-slate-400 -mt-2 mb-4">The highest probability matchups based on simulations</p>
            </div>

            <div className="space-y-3">
              {team.most_likely_path && team.most_likely_path.map((pathStep, idx) => {
                // Filter rounds with zero reach_rate (excluding Group Stage)
                const rate = pathStep.round === 'Group Stage' ? pathStep.qualify_rate : pathStep.reach_rate;
                if (rate !== undefined && rate <= 0) return null;

                const isGroupStage = pathStep.round === 'Group Stage';

                return (
                  <div 
                    key={idx}
                    className="bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/60 p-3.5 rounded-xl flex flex-col justify-between gap-2.5 shadow transition-colors duration-200"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                        {pathStep.round}
                      </span>

                      {isGroupStage ? (
                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-350">
                          <span className="text-slate-400 font-semibold mr-1">vs</span>
                          {pathStep.opponents ? pathStep.opponents.map((opp, i) => (
                            <span key={opp} className="inline-flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800/60 font-semibold text-slate-200">
                              <TeamFlag teamName={opp} className="w-3.5 h-2.5" />
                              {opp}
                            </span>
                          )) : 'TBD'}
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                          <span className="text-slate-400 font-semibold mr-1">vs</span>
                          <TeamFlag teamName={pathStep.most_likely_opponent} className="w-4 h-2.5" />
                          {pathStep.most_likely_opponent}
                        </p>
                      )}
                    </div>

                    <div className="text-right border-t border-slate-800/45 pt-1.5 mt-0.5 flex justify-between items-center">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 block font-bold">
                        {isGroupStage ? 'Qualify Prob' : 'Reach Prob'}
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        {formatPercent(rate)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-850 flex justify-between items-center text-[10px] text-slate-500 font-semibold px-6">
          <span>FIFA World Cup 2026 Simulation</span>
          <span>Logistic Regression Model</span>
        </div>
      </div>
    </div>
  );
}
