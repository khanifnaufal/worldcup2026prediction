import React, { useState, useMemo } from 'react';
import { ChevronRight, Award, HelpCircle, Trophy } from 'lucide-react';
import { getConfedColor, formatPercent } from '../utils/helpers';
import TeamFlag from './TeamFlag';
import MatchDetailModal from './MatchDetailModal';
import teamStats from '../data/team_stats.json';

export default function BracketTab({ simulationData }) {
  const [activeGroup, setActiveGroup] = useState('A');
  const [bracketView, setBracketView] = useState('upper'); // 'upper' or 'lower'
  const [selectedMatch, setSelectedMatch] = useState(null);

  const { bracket } = simulationData;

  const groupsList = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  // Helper to render a team row with flag, name, and winner status (percentages moved to bottom progress bar)
  const TeamRow = ({ name, isWinner, isDraw = false, isKnockout = false }) => {
    return (
      <div className="w-full font-noto">
        <div className={`flex justify-between items-center px-1.5 rounded transition-all ${
          isKnockout ? 'py-0.5' : 'py-0.5 md:py-1'
        } ${
          isWinner ? 'bg-gold-muted border-l border-gold font-bold text-white-alt' : 'text-text-muted-alt font-normal'
        }`}>
          <div className="flex items-center gap-1.5 truncate">
            {isWinner ? (
              <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0 animate-pulse" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-text-dim flex-shrink-0" />
            )}
            {!isDraw && <TeamFlag teamName={name} className="w-4.5 h-3 shadow-sm" />}
            <span className="truncate text-[10px] font-noto">{isDraw ? 'Draw Option' : name}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isWinner && (
              <span className="bg-gold text-dark-bg font-bebas font-bold text-[10px] md:text-[11px] tracking-wider px-1.5 py-0.5 rounded shadow-sm select-none ml-1.5 inline-flex items-center leading-none align-middle animate-pulse">
                {isDraw ? 'DRAW' : 'WINNER'}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Helper to render individual match cards with bottom side-by-side probability bars & percentages
  const MatchCard = ({ match, isKnockout = false }) => {
    if (!match) return null;
    
    const homeColor = getConfedColor(match.home);
    const awayColor = getConfedColor(match.away);
    const hasDraw = !isKnockout && match.draw_prob !== undefined;

    const isHomeWinner = match.predicted_winner === match.home;
    const isAwayWinner = match.predicted_winner === match.away;
    const isDrawWinner = match.predicted_winner === 'Draw';

    return (
      <div 
        onClick={() => setSelectedMatch({ ...match, isKnockout })}
        className={`bg-dark-card border border-white/5 hover:border-gold-border/40 rounded-xl shadow-lg w-full card-hover cursor-pointer transition-all duration-150 ${
          isKnockout ? 'p-1 space-y-1.5' : 'p-1.5 space-y-2.5'
        }`}
      >
        <div className={isKnockout ? 'space-y-0.5' : 'space-y-1.5'}>
          {/* Home Team */}
          <TeamRow 
            name={match.home}
            isWinner={isHomeWinner}
            isKnockout={isKnockout}
          />

          {/* Draw Option */}
          {hasDraw && (
            <TeamRow 
              name="Draw"
              isWinner={isDrawWinner}
              isDraw={true}
              isKnockout={isKnockout}
            />
          )}

          {/* Away Team */}
          <TeamRow 
            name={match.away}
            isWinner={isAwayWinner}
            isKnockout={isKnockout}
          />
        </div>

        {/* Side-by-Side (Kanan-Kiri) Progress Bars with Percentages */}
        <div className={`flex items-center gap-1.5 px-1 border-t border-white/5 font-noto ${isKnockout ? 'pt-1' : 'pt-1.5'}`}>
          {/* Home Win Probability Text */}
          <span className={`${isKnockout ? "text-[10px] font-semibold text-text-muted-alt w-8" : "text-[13px] font-bold text-white-alt w-12"} tabular-nums flex-shrink-0 text-right`}>
            {formatPercent(match.home_win_prob)}
          </span>

          {/* Home Bar (Left) */}
          <div className="flex-1 bg-[#080808]/60 h-1 rounded-full overflow-hidden flex justify-end">
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${match.home_win_prob * 100}%`, backgroundColor: homeColor }}
            />
          </div>
          
          {/* Center text / Draw label */}
          {hasDraw ? (
            <div className="flex-shrink-0 text-[10px] font-bold text-white-alt/90 bg-[#080808]/85 border border-white/5 px-1.5 py-0.5 rounded tabular-nums select-none leading-none">
              D: {formatPercent(match.draw_prob)}
            </div>
          ) : (
            <div className={`flex-shrink-0 font-bebas text-gold/60 tracking-wider select-none leading-none ${isKnockout ? "text-[9px]" : "text-[11px] text-gold/80"}`}>VS</div>
          )}
          
          {/* Away Bar (Right) */}
          <div className="flex-1 bg-[#080808]/60 h-1 rounded-full overflow-hidden flex justify-start">
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${match.away_win_prob * 100}%`, backgroundColor: awayColor }}
            />
          </div>

          {/* Away Win Probability Text */}
          <span className={`${isKnockout ? "text-[10px] font-semibold text-text-muted-alt w-8" : "text-[13px] font-bold text-white-alt w-12"} tabular-nums flex-shrink-0 text-left`}>
            {formatPercent(match.away_win_prob)}
          </span>
        </div>
      </div>
    );
  };

  // Organize Knockout bracket paths
  const bracketData = useMemo(() => {
    if (!bracket) return null;

    const findMatch = (roundKey, id) => {
      const list = bracket[roundKey];
      if (Array.isArray(list)) {
        return list.find(m => m.match_id === id);
      }
      if (list && list.match_id === id) {
        return list;
      }
      return null;
    };

    const upper = {
      r32: [73, 75, 74, 77, 76, 78, 79, 80].map(id => findMatch('r32', id)),
      r16: [89, 90, 91, 92].map(id => findMatch('r16', id)),
      qf: [97, 98].map(id => findMatch('qf', id)),
      sf: [101].map(id => findMatch('sf', id)),
    };

    const lower = {
      r32: [81, 82, 83, 84, 85, 87, 86, 88].map(id => findMatch('r32', id)),
      r16: [94, 93, 96, 95].map(id => findMatch('r16', id)),
      qf: [99, 100].map(id => findMatch('qf', id)),
      sf: [102].map(id => findMatch('sf', id)),
    };

    const finalMatch = bracket.final;

    return { upper, lower, final: finalMatch };
  }, [bracket]);

  const activeMatches = bracketView === 'upper' ? bracketData?.upper : bracketData?.lower;

  return (
    <div className="space-y-12 fade-in">
      {/* 1. Group Stage Predictions Section */}
      <div className="bg-dark-card border border-gold-border rounded-xl p-5 md:p-6 shadow-xl space-y-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bebas text-white-alt tracking-wide uppercase">Group Stage Predictions</h2>
          <p className="text-xs text-text-muted-alt font-noto">Match outcomes and win probabilities for all matches per group</p>
        </div>

        {/* Minimal Group selector tabs */}
        <div className="flex items-center justify-between border-b border-white/5 overflow-x-auto pb-1 gap-4 scrollbar-none">
          {groupsList.map(g => {
            const isActive = activeGroup === g;
            return (
              <button
                key={g}
                onClick={() => setActiveGroup(g)}
                className={`pb-2 text-lg sm:text-xl font-bebas transition-all duration-150 flex-shrink-0 relative ${
                  isActive
                    ? 'text-gold border-b-2 border-gold'
                    : 'text-text-muted-alt hover:text-white-alt font-noto text-xs sm:text-sm font-medium -mt-1'
                }`}
              >
                Group {g}
              </button>
            );
          })}
        </div>

        {/* Group Matches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bracket?.group_stage?.[activeGroup]?.map((match, idx) => (
            <MatchCard key={idx} match={match} />
          ))}
        </div>
      </div>

      {/* 2. Knockout Bracket Section */}
      <div className="bg-dark-card border border-gold-border rounded-xl p-5 md:p-6 shadow-xl space-y-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-bebas text-white-alt tracking-wide uppercase">
              Tournament Knockout Bracket
            </h2>
            <p className="text-xs text-text-muted-alt font-noto">Monte Carlo predicted path to the World Cup trophy</p>
          </div>

          {/* Toggle buttons Upper/Lower Bracket */}
          <div className="flex bg-[#080808] p-1 rounded-lg border border-white/5">
            <button
              onClick={() => setBracketView('upper')}
              className={`px-4 py-1.5 text-xs font-bold font-noto uppercase tracking-wider rounded-md transition-all duration-150 ${
                bracketView === 'upper'
                  ? 'bg-gold-muted text-gold border border-gold/30 shadow'
                  : 'text-text-muted-alt hover:text-white-alt border border-transparent'
              }`}
            >
              Upper Bracket
            </button>
            <button
              onClick={() => setBracketView('lower')}
              className={`px-4 py-1.5 text-xs font-bold font-noto uppercase tracking-wider rounded-md transition-all duration-150 ${
                bracketView === 'lower'
                  ? 'bg-gold-muted text-gold border border-gold/30 shadow'
                  : 'text-text-muted-alt hover:text-white-alt border border-transparent'
              }`}
            >
              Lower Bracket
            </button>
          </div>
        </div>

        {/* Horizontal Scrollable Bracket Workspace */}
        <div className="overflow-x-auto custom-scrollbar pt-2 -mx-4 px-4 sm:-mx-6 sm:px-6">
          <div className="min-w-[950px] lg:min-w-full pb-4">
            
            {/* Column Headers */}
            <div className="flex items-center gap-0 pb-3 mb-4 border-b border-white/5 text-center font-bebas text-gold text-xs tracking-[0.2em]">
              <div className="flex-1 min-w-0">ROUND OF 32</div>
              <div className="flex-1 min-w-0">ROUND OF 16</div>
              <div className="flex-1 min-w-0">QUARTER FINALS</div>
              <div className="flex-1 min-w-0">SEMI FINALS</div>
              <div className="w-44 flex-shrink-0">GRAND FINAL</div>
            </div>

            {/* Brackets Grid Workspace */}
            <div className="flex items-center gap-0 h-[780px]">
              
              {/* Round of 32 Column */}
              <div className="flex flex-col justify-between h-[780px] flex-1 min-w-0">
                {activeMatches?.r32.map((match, idx) => (
                  <div key={idx} className="h-[97px] flex items-center">
                    <MatchCard match={match} isKnockout />
                  </div>
                ))}
              </div>

              {/* Connecting Lines: R32 -> R16 */}
              <div className="w-8 h-full relative flex-shrink-0 -mx-0">
                <svg viewBox="0 0 32 780" className="absolute inset-0 w-full h-full text-gold animate-connector-glow" fill="none" strokeWidth="2">
                  <path d="M 0,48.75 L 16,48.75 L 16,146.25 L 0,146.25 M 16,97.5 L 32,97.5" />
                  <path d="M 0,243.75 L 16,243.75 L 16,341.25 L 0,341.25 M 16,292.5 L 32,292.5" />
                  <path d="M 0,438.75 L 16,438.75 L 16,536.25 L 0,536.25 M 16,487.5 L 32,487.5" />
                  <path d="M 0,633.75 L 16,633.75 L 16,731.25 L 0,731.25 M 16,682.5 L 32,682.5" />
                </svg>
              </div>

              {/* Round of 16 Column */}
              <div className="flex flex-col justify-between h-[780px] flex-1 min-w-0">
                {activeMatches?.r16.map((match, idx) => (
                  <div key={idx} className="h-[195px] flex items-center">
                    <MatchCard match={match} isKnockout />
                  </div>
                ))}
              </div>

              {/* Connecting Lines: R16 -> QF */}
              <div className="w-8 h-full relative flex-shrink-0 -mx-0">
                <svg viewBox="0 0 32 780" className="absolute inset-0 w-full h-full text-gold animate-connector-glow" fill="none" strokeWidth="2">
                  <path d="M 0,97.5 L 16,97.5 L 16,292.5 L 0,292.5 M 16,195 L 32,195" />
                  <path d="M 0,487.5 L 16,487.5 L 16,682.5 L 0,682.5 M 16,585 L 32,585" />
                </svg>
              </div>

              {/* Quarter Finals Column */}
              <div className="flex flex-col justify-between h-[780px] flex-1 min-w-0">
                {activeMatches?.qf.map((match, idx) => (
                  <div key={idx} className="h-[390px] flex items-center">
                    <MatchCard match={match} isKnockout />
                  </div>
                ))}
              </div>

              {/* Connecting Lines: QF -> SF */}
              <div className="w-8 h-full relative flex-shrink-0 -mx-0">
                <svg viewBox="0 0 32 780" className="absolute inset-0 w-full h-full text-gold animate-connector-glow" fill="none" strokeWidth="2">
                  <path d="M 0,195 L 16,195 L 16,585 L 0,585 M 16,390 L 32,390" />
                </svg>
              </div>

              {/* Semi Finals Column */}
              <div className="flex flex-col justify-between h-[780px] flex-1 min-w-0">
                {activeMatches?.sf.map((match, idx) => (
                  <div key={idx} className="h-[780px] flex items-center">
                    <MatchCard match={match} isKnockout />
                  </div>
                ))}
              </div>

              {/* Connecting Lines: SF -> Grand Final */}
              <div className="w-8 h-full relative flex-shrink-0 -mx-0">
                <svg viewBox="0 0 32 780" className="absolute inset-0 w-full h-full text-gold animate-connector-glow" fill="none" strokeWidth="2">
                  <path d="M 0,390 L 32,390" />
                </svg>
              </div>

              {/* Grand Final Column */}
              <div className="flex flex-col justify-center h-auto w-44 flex-shrink-0">
                <div onClick={() => setSelectedMatch({ ...bracketData.final, isKnockout: true })} className="bg-[#101010] border border-gold hover:border-gold-light rounded-2xl p-4 shadow-2xl relative overflow-hidden group transition-all duration-300 cursor-pointer">
                  <div className="absolute -top-10 -right-10 w-20 h-20 bg-gold/10 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                  
                  <div className="text-center mb-3">
                    <span className="bg-gold-muted text-gold border border-gold/30 text-[10px] px-2.5 py-0.5 rounded-full font-bebas tracking-[0.15em] inline-flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-gold" /> FINAL
                    </span>
                  </div>

                  {bracketData?.final && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        {/* Home (Finalist 1) */}
                        <TeamRow 
                          name={bracketData.final.home}
                          isWinner={bracketData.final.predicted_winner === bracketData.final.home}
                        />

                        {/* Away (Finalist 2) */}
                        <TeamRow 
                          name={bracketData.final.away}
                          isWinner={bracketData.final.predicted_winner === bracketData.final.away}
                        />
                      </div>

                      {/* Side-by-Side (Kanan-Kiri) Progress Bars with Percentages */}
                      <div className="flex items-center gap-1.5 px-1 pt-1.5 border-t border-white/5 font-noto">
                        {/* Home Win Probability Text */}
                        <span className="text-[10px] font-semibold text-text-muted-alt tabular-nums flex-shrink-0 w-8 text-right">
                          {formatPercent(bracketData.final.home_win_prob)}
                        </span>

                        {/* Home Bar (Left) */}
                        <div className="flex-1 bg-[#080808]/60 h-1 rounded-full overflow-hidden flex justify-end">
                          <div 
                            className="h-full rounded-full transition-all duration-300"
                            style={{ 
                              width: `${bracketData.final.home_win_prob * 100}%`, 
                              backgroundColor: getConfedColor(bracketData.final.home) 
                            }}
                          />
                        </div>
                        
                        {/* Center Separator */}
                        <div className="flex-shrink-0 text-[9px] font-bebas text-gold/60 tracking-wider select-none leading-none">VS</div>
                        
                        {/* Away Bar (Right) */}
                        <div className="flex-1 bg-[#080808]/60 h-1 rounded-full overflow-hidden flex justify-start">
                          <div 
                            className="h-full rounded-full transition-all duration-300"
                            style={{ 
                              width: `${bracketData.final.away_win_prob * 100}%`, 
                              backgroundColor: getConfedColor(bracketData.final.away) 
                            }}
                          />
                        </div>

                        {/* Away Win Probability Text */}
                        <span className="text-[10px] font-semibold text-text-muted-alt tabular-nums flex-shrink-0 w-8 text-left">
                          {formatPercent(bracketData.final.away_win_prob)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {selectedMatch && (
        <MatchDetailModal
          match={selectedMatch}
          teamStats={teamStats}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}
