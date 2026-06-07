import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getConfedColor, getTeamConfed, formatPercent } from '../utils/helpers';
import TeamFlag from './TeamFlag';

export default function TeamDetailModal({ teamName, simulationData, onClose }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred Backdrop Scrim */}
      <div 
        className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal Card Box */}
      <div className="relative bg-[#101010] border border-gold-border rounded-2xl w-full max-w-[560px] md:max-w-[1000px] max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col z-10 scale-up scrollbar-thin">
        {/* Header banner */}
        <div className="relative p-6 border-b border-white/5 flex justify-between items-start bg-[#080808]/40">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <TeamFlag teamName={teamName} className="w-10 h-7 rounded border border-white/10 shadow-sm" />
              <h2 className="text-4xl font-bebas text-white-alt leading-none mt-1">
                {teamName}
              </h2>
              <span 
                className="text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider font-noto"
                style={{ backgroundColor: `${confedColor}12`, borderColor: `${confedColor}40`, color: confedColor }}
              >
                {confed}
              </span>
            </div>
            
            <p className="text-[10px] text-text-muted-alt font-semibold uppercase tracking-wider font-noto">
              Group Stage <span className="text-gold font-bold">Group {team.group}</span>
            </p>
          </div>

          <button 
            onClick={onClose}
            className="text-gold hover:text-white-alt transition-colors text-3xl font-light leading-none p-1 -mt-2 -mr-1 cursor-pointer"
            title="Close"
          >
            &times;
          </button>
        </div>

        {/* Modal Content Grid (Stacked vertically on mobile, side-by-side on desktop) */}
        <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 overflow-hidden">
          
          {/* Section 1: Probability Stepper */}
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-bebas text-white-alt tracking-wide uppercase border-b border-white/5 pb-1 mb-1">
                PROBABILITY BY STAGE
              </h3>
              <p className="text-[10px] text-text-muted-alt font-noto">Cumulative probability to reach or win each round</p>
            </div>

            <div className="relative pl-5 border-l border-dashed border-[#222] space-y-3 py-1 ml-1.5">
              {steps.map((step, idx) => {
                const hasReached = step.rate > 0;

                return (
                  <div key={idx} className="relative group space-y-0.5">
                    {/* 8px Dot centered on line */}
                    <div 
                      className={`absolute -left-[24px] top-1 w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        hasReached ? 'bg-gold shadow-[0_0_6px_#C9A84C]' : 'bg-[#2A2A2A]'
                      }`}
                    />

                    {/* Step Info Row */}
                    <div className="flex justify-between items-baseline font-noto">
                      <span className="text-[11px] tracking-[0.08em] text-text-muted-alt uppercase font-semibold">
                        {step.label}
                      </span>
                      <span className="font-bebas text-xl text-gold tabular-nums leading-none">
                        {formatPercent(step.rate)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#080808] rounded-full h-1 overflow-hidden border border-white/5">
                      <div 
                        className="h-full rounded-full bg-gold"
                        style={{ 
                          width: animated ? `${step.rate * 100}%` : '0%',
                          transition: `width 0.8s ease-out ${idx * 0.05}s`,
                          willChange: 'width'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Most Likely Path */}
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-bebas text-white-alt tracking-wide uppercase border-b border-white/5 pb-1 mb-1">
                MOST LIKELY PATH
              </h3>
              <p className="text-[10px] text-text-muted-alt font-noto">The highest probability matchups based on simulations</p>
            </div>

            <div className="space-y-2">
              {team.most_likely_path && team.most_likely_path.map((pathStep, idx) => {
                const rate = pathStep.round === 'Group Stage' ? pathStep.qualify_rate : pathStep.reach_rate;
                if (rate !== undefined && rate <= 0) return null;

                const isGroupStage = pathStep.round === 'Group Stage';

                return (
                  <div 
                    key={idx}
                    className="bg-[#080808]/40 border border-white/5 hover:border-gold-border/40 p-2.5 rounded-xl flex items-center justify-between gap-2.5 shadow transition-colors duration-150"
                  >
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0 font-noto">
                      <span className="text-[10px] font-bold uppercase text-text-muted-alt tracking-wider">
                        {pathStep.round}
                      </span>

                      {isGroupStage ? (
                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-white-alt truncate">
                          <span className="text-text-muted-alt font-normal mr-0.5">vs</span>
                          {pathStep.opponents ? pathStep.opponents.map((opp) => (
                            <span key={opp} className="inline-flex items-center gap-1 bg-[#101010] px-2 py-0.5 rounded border border-white/5 font-semibold text-white-alt">
                              <TeamFlag teamName={opp} className="w-3.5 h-2.5 shadow-sm" />
                              {opp}
                            </span>
                          )) : 'TBD'}
                        </div>
                      ) : (
                        <p className="text-xs font-bold text-white-alt flex items-center gap-1.5 truncate">
                          <span className="text-text-muted-alt font-normal mr-0.5">vs</span>
                          <TeamFlag teamName={pathStep.most_likely_opponent} className="w-4 h-2.5 shadow-sm" />
                          <span className="truncate">{pathStep.most_likely_opponent}</span>
                        </p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0 flex flex-col justify-center items-end">
                      <span className="text-[8px] uppercase tracking-wider text-text-muted-alt font-semibold font-noto">
                        {isGroupStage ? 'Qualify Prob' : 'Reach Prob'}
                      </span>
                      <span className="text-lg font-bebas text-gold leading-none mt-0.5">
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
        <div className="p-4 bg-[#080808]/60 border-t border-white/5 flex justify-between items-center text-[9px] text-text-muted-alt font-semibold px-6 font-noto">
          <span>FIFA World Cup 2026 Simulation</span>
          <span>Logistic Regression Model</span>
        </div>
      </div>
    </div>
  );
}
