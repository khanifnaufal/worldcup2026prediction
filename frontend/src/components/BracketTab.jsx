import React, { useState, useMemo } from 'react';
import { ChevronRight, Award, HelpCircle } from 'lucide-react';
import { getConfedColor, formatPercent } from '../utils/helpers';
import TeamFlag from './TeamFlag';

export default function BracketTab({ simulationData }) {
  const [activeGroup, setActiveGroup] = useState('A');
  const [bracketView, setBracketView] = useState('upper'); // 'upper' or 'lower'

  const { bracket } = simulationData;

  const groupsList = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  // Helper to render the split probability bar
  const ProbBar = ({ homeColor, awayColor, homeProb, drawProb, awayProb }) => {
    return (
      <div className="w-full h-2 rounded-full overflow-hidden bg-slate-900 flex mt-2 border border-slate-900">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${homeProb * 100}%`, backgroundColor: homeColor }}
          title={`Home Win: ${formatPercent(homeProb)}`}
        />
        <div
          className="h-full bg-slate-650 transition-all duration-300 bg-slate-600"
          style={{ width: `${drawProb * 100}%` }}
          title={`Draw: ${formatPercent(drawProb)}`}
        />
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${awayProb * 100}%`, backgroundColor: awayColor }}
          title={`Away Win: ${formatPercent(awayProb)}`}
        />
      </div>
    );
  };

  // Helper to format win/draw/loss text nicely
  const ProbText = ({ home, away, homeProb, drawProb, awayProb }) => {
    return (
      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-semibold tabular-nums px-0.5">
        <span>{formatPercent(homeProb)}</span>
        <span>Draw {formatPercent(drawProb)}</span>
        <span>{formatPercent(awayProb)}</span>
      </div>
    );
  };

  // Helper to render individual match cards
  const MatchCard = ({ match, isSmall = false }) => {
    if (!match) return null;
    
    const homeColor = getConfedColor(match.home);
    const awayColor = getConfedColor(match.away);
    const hasDraw = match.draw_prob !== undefined;

    const isHomeWinner = match.predicted_winner === match.home;
    const isAwayWinner = match.predicted_winner === match.away;
    const isDrawWinner = match.predicted_winner === 'Draw';

    return (
      <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-3.5 shadow-lg relative overflow-hidden hover:border-slate-700/80 transition-all duration-200 w-full max-w-sm">
        {/* Card subtle background accent based on predicted winner */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1" 
          style={{ 
            backgroundColor: isHomeWinner ? homeColor : isAwayWinner ? awayColor : '#6B7280' 
          }}
        />

        <div className="space-y-2.5">
          {/* Home Team Row */}
          <div className={`flex justify-between items-center ${isHomeWinner ? 'font-black text-white' : 'text-slate-400 font-medium'}`}>
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: homeColor }} />
              <TeamFlag teamName={match.home} className="w-4.5 h-3" />
              <span className="truncate text-xs md:text-sm">{match.home}</span>
            </div>
            {isHomeWinner && <Award className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />}
          </div>

          {/* Draw Row (only for group stage matches that support draws) */}
          {hasDraw && isDrawWinner && (
            <div className="flex justify-between items-center font-bold text-slate-300">
              <span className="text-[11px] text-slate-400 pl-4">Draw (Predicted)</span>
              <Award className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            </div>
          )}

          {/* Away Team Row */}
          <div className={`flex justify-between items-center ${isAwayWinner ? 'font-black text-white' : 'text-slate-400 font-medium'}`}>
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: awayColor }} />
              <TeamFlag teamName={match.away} className="w-4.5 h-3" />
              <span className="truncate text-xs md:text-sm">{match.away}</span>
            </div>
            {isAwayWinner && <Award className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />}
          </div>
        </div>

        {/* Win Probability Bar */}
        <ProbBar
          homeColor={homeColor}
          awayColor={awayColor}
          homeProb={match.home_win_prob}
          drawProb={match.draw_prob || 0}
          awayProb={match.away_win_prob}
        />

        {/* Win Probability Labels */}
        <ProbText
          home={match.home}
          away={match.away}
          homeProb={match.home_win_prob}
          drawProb={match.draw_prob || 0}
          awayProb={match.away_win_prob}
        />
      </div>
    );
  };

  // Organize Knockout bracket paths
  const bracketData = useMemo(() => {
    if (!bracket) return null;

    // Helper map to find match by ID
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

    // Upper Bracket matches structure
    // R32: 73, 75 (feeds 89) | 74, 77 (feeds 90) | 76, 78 (feeds 91) | 79, 80 (feeds 92)
    // R16: 89, 90 (feeds 97) | 91, 92 (feeds 98)
    // QF: 97, 98 (feeds 101)
    // SF: 101 (feeds 104)
    const upper = {
      r32: [73, 75, 74, 77, 76, 78, 79, 80].map(id => findMatch('r32', id)),
      r16: [89, 90, 91, 92].map(id => findMatch('r16', id)),
      qf: [97, 98].map(id => findMatch('qf', id)),
      sf: [101].map(id => findMatch('sf', id)),
    };

    // Lower Bracket matches structure
    // R32: 81, 82 (feeds 94) | 83, 84 (feeds 93) | 85, 87 (feeds 96) | 86, 88 (feeds 95)
    // R16: 94, 93 (feeds 99) | 96, 95 (feeds 100)
    // QF: 99, 100 (feeds 102)
    // SF: 102 (feeds 104)
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
      {/* 1. Group Stage Section */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-5 md:p-6 shadow-xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">Group Stage Predictions</h2>
          <p className="text-xs text-slate-400">Match outcomes and win probabilities for all 6 matches per group</p>
        </div>

        {/* Group Tabs selector */}
        <div className="flex overflow-x-auto gap-1.5 pb-2 scrollbar-thin">
          {groupsList.map(g => (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={`flex-shrink-0 px-3.5 py-2 text-xs font-black rounded-lg border transition-all duration-200 ${
                activeGroup === g
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Group {g}
            </button>
          ))}
        </div>

        {/* Group Matches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bracket?.group_stage?.[activeGroup]?.map((match, idx) => (
            <MatchCard key={idx} match={match} />
          ))}
        </div>
      </div>

      {/* 2. Knockout Bracket Section */}
      <div className="bg-[#1E293B] border border-slate-855 rounded-xl border-slate-800 p-5 md:p-6 shadow-xl space-y-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Tournament Knockout Bracket
            </h2>
            <p className="text-xs text-slate-400">Monte Carlo predicted path to the World Cup trophy</p>
          </div>

          {/* Toggle buttons Upper/Lower Bracket */}
          <div className="flex bg-slate-900/60 p-1 rounded-lg border border-slate-800/80">
            <button
              onClick={() => setBracketView('upper')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${
                bracketView === 'upper'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Upper Bracket (Match 73-80)
            </button>
            <button
              onClick={() => setBracketView('lower')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${
                bracketView === 'lower'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Lower Bracket (Match 81-88)
            </button>
          </div>
        </div>

        {/* Horizontal Scrollable Bracket Workspace */}
        <div className="overflow-x-auto pb-6 pt-4 scrollbar-thin">
          <div className="flex items-center gap-8 md:gap-12 min-w-[1000px] px-4">
            
            {/* Round of 32 Column */}
            <div className="flex flex-col gap-6 w-60">
              <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider text-center border-b border-indigo-950 pb-2">
                Round of 32
              </div>
              {activeMatches?.r32.map((match, idx) => (
                <div key={idx} className="h-[90px] flex items-center">
                  <MatchCard match={match} />
                </div>
              ))}
            </div>

            {/* Connecting Chevron Column */}
            <div className="flex flex-col justify-around h-[900px] text-slate-700">
              <ChevronRight className="w-5 h-5" />
              <ChevronRight className="w-5 h-5" />
              <ChevronRight className="w-5 h-5" />
              <ChevronRight className="w-5 h-5" />
            </div>

            {/* Round of 16 Column */}
            <div className="flex flex-col justify-around h-[900px] w-60">
              <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider text-center border-b border-indigo-950 pb-2">
                Round of 16
              </div>
              {activeMatches?.r16.map((match, idx) => (
                <div key={idx} className="h-[200px] flex items-center">
                  <MatchCard match={match} />
                </div>
              ))}
            </div>

            {/* Connecting Chevron Column */}
            <div className="flex flex-col justify-around h-[900px] text-slate-700">
              <ChevronRight className="w-5 h-5" />
              <ChevronRight className="w-5 h-5" />
            </div>

            {/* Quarter Finals Column */}
            <div className="flex flex-col justify-around h-[900px] w-60">
              <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider text-center border-b border-indigo-950 pb-2">
                Quarter Finals
              </div>
              {activeMatches?.qf.map((match, idx) => (
                <div key={idx} className="h-[400px] flex items-center">
                  <MatchCard match={match} />
                </div>
              ))}
            </div>

            {/* Connecting Chevron Column */}
            <div className="flex flex-col justify-around h-[900px] text-slate-700">
              <ChevronRight className="w-5 h-5" />
            </div>

            {/* Semi Finals Column */}
            <div className="flex flex-col justify-around h-[900px] w-60">
              <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider text-center border-b border-indigo-950 pb-2">
                Semi Finals
              </div>
              {activeMatches?.sf.map((match, idx) => (
                <div key={idx} className="h-[800px] flex items-center">
                  <MatchCard match={match} />
                </div>
              ))}
            </div>

            {/* Connecting Chevron Column */}
            <div className="flex flex-col justify-around h-[900px] text-slate-700">
              <ChevronRight className="w-5 h-5 text-indigo-500 animate-pulse" />
            </div>

            {/* Grand Final Column */}
            <div className="flex flex-col justify-center h-[900px] w-72">
              <div className="text-xs text-yellow-400 font-black uppercase tracking-wider text-center border-b border-yellow-950 pb-2 mb-4">
                Grand Final
              </div>
              <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-emerald-950/20 border-2 border-yellow-500/40 hover:border-yellow-500 rounded-2xl p-5 shadow-2xl relative overflow-hidden group transition-all duration-300">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-yellow-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                
                <div className="text-center mb-4">
                  <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest inline-flex items-center gap-1">
                    <Award className="w-3 h-3" /> Champion Match
                  </span>
                </div>

                {bracketData?.final && (
                  <div className="space-y-4">
                    {/* Home (Finalist 1) */}
                    <div className={`p-2.5 rounded-xl border transition-all ${
                      bracketData.final.predicted_winner === bracketData.final.home
                        ? 'bg-slate-900 border-indigo-500/40 text-white font-extrabold shadow-md'
                        : 'bg-slate-900/30 border-transparent text-slate-500 font-medium'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 truncate">
                          <TeamFlag teamName={bracketData.final.home} className="w-5 h-3.5" />
                          <span className="truncate text-xs md:text-sm">{bracketData.final.home}</span>
                        </div>
                        {bracketData.final.predicted_winner === bracketData.final.home && (
                          <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/20">Winner</span>
                        )}
                      </div>
                    </div>

                    <div className="text-center font-black text-slate-600 text-xs">VS</div>

                    {/* Away (Finalist 2) */}
                    <div className={`p-2.5 rounded-xl border transition-all ${
                      bracketData.final.predicted_winner === bracketData.final.away
                        ? 'bg-slate-900 border-indigo-500/40 text-white font-extrabold shadow-md'
                        : 'bg-slate-900/30 border-transparent text-slate-500 font-medium'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 truncate">
                          <TeamFlag teamName={bracketData.final.away} className="w-5 h-3.5" />
                          <span className="truncate text-xs md:text-sm">{bracketData.final.away}</span>
                        </div>
                        {bracketData.final.predicted_winner === bracketData.final.away && (
                          <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/20">Winner</span>
                        )}
                      </div>
                    </div>

                    {/* Probabilities split */}
                    <div className="pt-2 border-t border-slate-800">
                      <ProbBar
                        homeColor={getConfedColor(bracketData.final.home)}
                        awayColor={getConfedColor(bracketData.final.away)}
                        homeProb={bracketData.final.home_win_prob}
                        drawProb={bracketData.final.draw_prob || 0}
                        awayProb={bracketData.final.away_win_prob}
                      />
                      <ProbText
                        home={bracketData.final.home}
                        away={bracketData.final.away}
                        homeProb={bracketData.final.home_win_prob}
                        drawProb={bracketData.final.draw_prob || 0}
                        awayProb={bracketData.final.away_win_prob}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
