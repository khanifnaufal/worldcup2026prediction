import React, { useMemo } from 'react';
import { getConfedColor, getTeamConfed, formatPercent } from '../utils/helpers';
import TeamFlag from './TeamFlag';

export default function GroupsTab({ simulationData }) {
  const { teams } = simulationData;

  // Group teams by their designated letters A to L
  const groups = useMemo(() => {
    const grouped = {};
    const groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    
    groupLetters.forEach(letter => {
      grouped[letter] = [];
    });

    Object.entries(teams).forEach(([name, data]) => {
      const g = data.group;
      if (grouped[g]) {
        grouped[g].push({
          name,
          ...data,
          confed: getTeamConfed(name),
          color: getConfedColor(name)
        });
      }
    });

    // Sort each group's teams by group_qualify_rate descending
    Object.keys(grouped).forEach(g => {
      grouped[g].sort((a, b) => {
        if (b.group_qualify_rate !== a.group_qualify_rate) {
          return b.group_qualify_rate - a.group_qualify_rate;
        }
        return b.champion_rate - a.champion_rate; // Tiebreaker
      });
    });

    return grouped;
  }, [teams]);

  return (
    <div className="space-y-8 fade-in">
      <div className="space-y-3">
        <h2 className="text-4xl sm:text-5xl font-bebas text-white-alt tracking-wide uppercase">
          GROUP STAGE STANDINGS
        </h2>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gold/10 pb-4">
          <p className="text-xs text-text-muted-alt font-noto">
            Simulation probability of qualifying to the Round of 32
          </p>
          <div className="flex flex-wrap gap-4 text-[10px] sm:text-xs font-semibold font-noto">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
              <span className="text-text-muted-alt">UEFA</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
              <span className="text-text-muted-alt">CONMEBOL</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
              <span className="text-text-muted-alt">CONCACAF</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>
              <span className="text-text-muted-alt">CAF</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#8B5CF6]"></span>
              <span className="text-text-muted-alt">AFC</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#6B7280]"></span>
              <span className="text-text-muted-alt">OFC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of 12 Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(groups).map(([letter, groupTeams]) => (
          <div
            key={letter}
            className="bg-dark-card border border-white/5 rounded-xl overflow-hidden shadow-lg hover:border-gold-border/50 hover:shadow-2xl transition-all duration-150 flex flex-col"
          >
            {/* Header */}
            <div className="bg-[#080808]/60 px-4 py-3.5 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-noto text-xs font-semibold text-text-muted-alt tracking-wider uppercase">GROUP</span>
                <span className="font-bebas text-2xl text-gold leading-none">{letter}</span>
              </div>
              <span className="font-noto text-[10px] text-text-muted-alt font-semibold uppercase tracking-wider">
                4 TEAMS
              </span>
            </div>

            {/* Table */}
            <div className="p-4 flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[9px] text-text-muted-alt font-bold uppercase tracking-wider font-noto">
                    <th className="pb-2 w-[40%]">Team</th>
                    <th className="pb-2 w-[45%] text-center">Qualify Prob</th>
                    <th className="pb-2 w-[15%] text-right">Champ</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {groupTeams.map((team, idx) => (
                    <tr 
                      key={team.name} 
                      className="hover:bg-dark-card-alt/80 border-b border-[#141414]/80 transition-colors duration-100 last:border-0"
                    >
                      {/* Team name & Rank */}
                      <td className="py-3 pr-2 font-medium text-white-alt">
                        <div className="flex items-center gap-2">
                          <span className="font-bebas text-sm text-text-dim w-3 text-center">
                            {idx + 1}
                          </span>
                          <span className="truncate max-w-[100px] sm:max-w-none hover:text-gold transition-colors cursor-default flex items-center gap-2" title={team.name}>
                            <TeamFlag teamName={team.name} className="w-5 h-3.5 shadow-sm" />
                            <span className="truncate font-noto text-sm text-white-alt">{team.name}</span>
                          </span>
                        </div>
                      </td>

                      {/* Qualification Progress Bar */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1 bg-[#080808] rounded-full h-1 overflow-hidden border border-white/5">
                            <div
                              className="h-full rounded-full transition-all duration-500 animate-grow-width"
                              style={{
                                width: `${team.group_qualify_rate * 100}%`,
                                backgroundColor: team.color
                              }}
                            ></div>
                          </div>
                          <span className="font-noto text-xs font-semibold text-white-alt/80 w-10 text-right tabular-nums">
                            {formatPercent(team.group_qualify_rate)}
                          </span>
                        </div>
                      </td>

                      {/* Champion Rate */}
                      <td className={`py-3 pl-2 text-right font-bebas text-base tabular-nums ${team.champion_rate > 0.01 ? 'text-gold' : 'text-text-muted-alt'}`}>
                        {team.champion_rate > 0 ? formatPercent(team.champion_rate) : '0%'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
