import React, { useState, useMemo } from 'react';
import { ChevronRight, Award, HelpCircle, Trophy } from 'lucide-react';
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
      <div className="w-full h-1.5 rounded-full overflow-hidden bg-[#080808] flex mt-2 border border-[#080808]">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${homeProb * 100}%`, backgroundColor: homeColor }}
          title={`Home Win: ${formatPercent(homeProb)}`}
        />
        <div
          className="h-full bg-[#333] transition-all duration-300"
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
      <div className="flex justify-between items-center text-[10px] text-text-muted-alt mt-1 font-semibold font-noto tabular-nums px-0.5">
        <span>{formatPercent(homeProb)}</span>
        <span>Draw {formatPercent(drawProb)}</span>
        <span>{formatPercent(awayProb)}</span>
      </div>
    );
  };

  // Helper to render individual match cards
  const MatchCard = ({ match }) => {
    if (!match) return null;
    
    const homeColor = getConfedColor(match.home);
    const awayColor = getConfedColor(match.away);
    const hasDraw = match.draw_prob !== undefined;

    const isHomeWinner = match.predicted_winner === match.home;
    const isAwayWinner = match.predicted_winner === match.away;
    const isDrawWinner = match.predicted_winner === 'Draw';

    if (hasDraw) {
      // Group Stage Card
      return (
        <div className="bg-dark-card border border-white/5 rounded-xl p-3.5 shadow-lg hover:border-gold-border/40 hover:-translate-y-[2px] transition-all duration-150 w-full max-w-sm space-y-2.5">
          <div className="space-y-1">
            {/* Home Team */}
            <div className={`flex justify-between items-center px-2 py-1 rounded transition-all ${
              isHomeWinner ? 'bg-gold-muted font-bold text-white-alt border-l border-gold' : 'text-text-muted-alt'
            }`}>
              <div className="flex items-center gap-2 truncate">
                {isHomeWinner ? (
                  <span className="w-1 h-1 rounded-full bg-gold flex-shrink-0 animate-pulse" />
                ) : (
                  <span className="w-1 h-1 rounded-full bg-text-dim flex-shrink-0" />
                )}
                <TeamFlag teamName={match.home} className="w-4.5 h-3 shadow-sm" />
                <span className="truncate text-xs font-noto">{match.home}</span>
              </div>
              {isHomeWinner && <span className="text-gold font-bebas text-[10px] tracking-wider">WINNER</span>}
            </div>

            {/* Draw Option */}
            {isDrawWinner ? (
              <div className="flex justify-between items-center px-2 py-1 rounded bg-gold-muted border-l border-gold font-bold text-white-alt">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-gold flex-shrink-0 animate-pulse" />
                  <span className="text-xs font-noto">Draw (Predicted)</span>
                </div>
                <span className="text-gold font-bebas text-[10px] tracking-wider">DRAW</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-2 py-0.5 text-text-muted-alt text-[10px] pl-[22px]">
                <span className="font-noto">Draw Option</span>
              </div>
            )}

            {/* Away Team */}
            <div className={`flex justify-between items-center px-2 py-1 rounded transition-all ${
              isAwayWinner ? 'bg-gold-muted font-bold text-white-alt border-l border-gold' : 'text-text-muted-alt'
            }`}>
              <div className="flex items-center gap-2 truncate">
                {isAwayWinner ? (
                  <span className="w-1 h-1 rounded-full bg-gold flex-shrink-0 animate-pulse" />
                ) : (
                  <span className="w-1 h-1 rounded-full bg-text-dim flex-shrink-0" />
                )}
                <TeamFlag teamName={match.away} className="w-4.5 h-3 shadow-sm" />
                <span className="truncate text-xs font-noto">{match.away}</span>
              </div>
              {isAwayWinner && <span className="text-gold font-bebas text-[10px] tracking-wider">WINNER</span>}
            </div>
          </div>

          {/* Probability splits */}
          <div>
            <ProbBar
              homeColor={homeColor}
              awayColor={awayColor}
              homeProb={match.home_win_prob}
              drawProb={match.draw_prob || 0}
              awayProb={match.away_win_prob}
            />
            <ProbText
              home={match.home}
              away={match.away}
              homeProb={match.home_win_prob}
              drawProb={match.draw_prob || 0}
              awayProb={match.away_win_prob}
            />
          </div>
        </div>
      );
    } else {
      // Knockout Stage Card
      return (
        <div className="bg-dark-card border border-white/5 border-l-[3px] border-l-white/5 rounded-xl p-3 shadow-lg hover:border-gold-border hover:-translate-y-[2px] transition-all duration-150 w-full max-w-sm space-y-2">
          <div className="space-y-1">
            {/* Home Team */}
            <div className={`flex justify-between items-center px-1.5 py-0.5 rounded ${
              isHomeWinner ? 'font-bold text-white-alt' : 'text-text-muted-alt font-normal'
            }`}>
              <div className="flex items-center gap-2 truncate">
                <TeamFlag teamName={match.home} className="w-4.5 h-3 shadow-sm" />
                <span className="truncate text-xs font-noto">{match.home}</span>
              </div>
              {isHomeWinner && <span className="text-gold font-bold text-xs">✓</span>}
            </div>

            {/* Away Team */}
            <div className={`flex justify-between items-center px-1.5 py-0.5 rounded ${
              isAwayWinner ? 'font-bold text-white-alt' : 'text-text-muted-alt font-normal'
            }`}>
              <div className="flex items-center gap-2 truncate">
                <TeamFlag teamName={match.away} className="w-4.5 h-3 shadow-sm" />
                <span className="truncate text-xs font-noto">{match.away}</span>
              </div>
              {isAwayWinner && <span className="text-gold font-bold text-xs">✓</span>}
            </div>
          </div>

          {/* Probability splits */}
          <div>
            <ProbBar
              homeColor={homeColor}
              awayColor={awayColor}
              homeProb={match.home_win_prob}
              drawProb={0}
              awayProb={match.away_win_prob}
            />
            <ProbText
              home={match.home}
              away={match.away}
              homeProb={match.home_win_prob}
              drawProb={0}
              awayProb={match.away_win_prob}
            />
          </div>
        </div>
      );
    }
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
        <div className="overflow-x-auto pb-6 pt-4 scrollbar-thin">
          <div className="flex items-center gap-8 md:gap-12 min-w-[1000px] px-4">
            
            {/* Round of 32 Column */}
            <div className="flex flex-col gap-6 w-60">
              <div className="text-xs text-gold font-bebas tracking-[0.2em] text-center border-b border-gold/15 pb-2">
                ROUND OF 32
              </div>
              {activeMatches?.r32.map((match, idx) => (
                <div key={idx} className="h-[95px] flex items-center">
                  <MatchCard match={match} />
                </div>
              ))}
            </div>

            {/* Connecting Chevron Column */}
            <div className="flex flex-col justify-around h-[900px] text-text-dim">
              <ChevronRight className="w-5 h-5 text-gold drop-shadow-[0_0_3px_#C9A84C]" />
              <ChevronRight className="w-5 h-5 text-gold drop-shadow-[0_0_3px_#C9A84C]" />
              <ChevronRight className="w-5 h-5 text-gold drop-shadow-[0_0_3px_#C9A84C]" />
              <ChevronRight className="w-5 h-5 text-gold drop-shadow-[0_0_3px_#C9A84C]" />
            </div>

            {/* Round of 16 Column */}
            <div className="flex flex-col justify-around h-[900px] w-60">
              <div className="text-xs text-gold font-bebas tracking-[0.2em] text-center border-b border-gold/15 pb-2">
                ROUND OF 16
              </div>
              {activeMatches?.r16.map((match, idx) => (
                <div key={idx} className="h-[210px] flex items-center">
                  <MatchCard match={match} />
                </div>
              ))}
            </div>

            {/* Connecting Chevron Column */}
            <div className="flex flex-col justify-around h-[900px] text-text-dim">
              <ChevronRight className="w-5 h-5 text-gold drop-shadow-[0_0_3px_#C9A84C]" />
              <ChevronRight className="w-5 h-5 text-gold drop-shadow-[0_0_3px_#C9A84C]" />
            </div>

            {/* Quarter Finals Column */}
            <div className="flex flex-col justify-around h-[900px] w-60">
              <div className="text-xs text-gold font-bebas tracking-[0.2em] text-center border-b border-gold/15 pb-2">
                QUARTER FINALS
              </div>
              {activeMatches?.qf.map((match, idx) => (
                <div key={idx} className="h-[420px] flex items-center">
                  <MatchCard match={match} />
                </div>
              ))}
            </div>

            {/* Connecting Chevron Column */}
            <div className="flex flex-col justify-around h-[900px] text-text-dim">
              <ChevronRight className="w-5 h-5 text-gold drop-shadow-[0_0_3px_#C9A84C]" />
            </div>

            {/* Semi Finals Column */}
            <div className="flex flex-col justify-around h-[900px] w-60">
              <div className="text-xs text-gold font-bebas tracking-[0.2em] text-center border-b border-gold/15 pb-2">
                SEMI FINALS
              </div>
              {activeMatches?.sf.map((match, idx) => (
                <div key={idx} className="h-[840px] flex items-center">
                  <MatchCard match={match} />
                </div>
              ))}
            </div>

            {/* Connecting Chevron Column */}
            <div className="flex flex-col justify-around h-[900px] text-text-dim animate-pulse">
              <ChevronRight className="w-5 h-5 text-gold drop-shadow-[0_0_4px_#C9A84C]" />
            </div>

            {/* Grand Final Column */}
            <div className="flex flex-col justify-center h-[900px] w-72">
              <div className="text-xs text-gold font-bebas tracking-[0.2em] text-center border-b border-gold/15 pb-2 mb-4">
                GRAND FINAL
              </div>
              
              <div className="bg-[#101010] border border-gold hover:border-gold-light rounded-2xl p-5 shadow-2xl relative overflow-hidden group transition-all duration-300">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-gold/10 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                
                <div className="text-center mb-4">
                  <span className="bg-gold-muted text-gold border border-gold/30 text-xs px-3 py-1 rounded-full font-bebas tracking-[0.15em] inline-flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-gold" /> FINAL
                  </span>
                </div>

                {bracketData?.final && (
                  <div className="space-y-4">
                    {/* Home (Finalist 1) */}
                    <div className={`p-3 rounded-xl border transition-all ${
                      bracketData.final.predicted_winner === bracketData.final.home
                        ? 'bg-gold-muted border-gold text-white-alt font-bold shadow'
                        : 'bg-dark-card border-white/5 text-text-muted-alt font-normal'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2.5 truncate">
                          <TeamFlag teamName={bracketData.final.home} className="w-5 h-3.5 shadow-sm" />
                          <span className="truncate text-xs md:text-sm font-noto">{bracketData.final.home}</span>
                        </div>
                        {bracketData.final.predicted_winner === bracketData.final.home && (
                          <span className="bg-gold/20 text-gold text-[9px] px-2 py-0.5 rounded border border-gold/30 font-bebas tracking-wider uppercase">Winner</span>
                        )}
                      </div>
                    </div>

                    <div className="text-center font-bebas text-gold text-sm tracking-widest">VS</div>

                    {/* Away (Finalist 2) */}
                    <div className={`p-3 rounded-xl border transition-all ${
                      bracketData.final.predicted_winner === bracketData.final.away
                        ? 'bg-gold-muted border-gold text-white-alt font-bold shadow'
                        : 'bg-dark-card border-white/5 text-text-muted-alt font-normal'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2.5 truncate">
                          <TeamFlag teamName={bracketData.final.away} className="w-5 h-3.5 shadow-sm" />
                          <span className="truncate text-xs md:text-sm font-noto">{bracketData.final.away}</span>
                        </div>
                        {bracketData.final.predicted_winner === bracketData.final.away && (
                          <span className="bg-gold/20 text-gold text-[9px] px-2 py-0.5 rounded border border-gold/30 font-bebas tracking-wider uppercase">Winner</span>
                        )}
                      </div>
                    </div>

                    {/* Probabilities split */}
                    <div className="pt-2.5 border-t border-white/5">
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
