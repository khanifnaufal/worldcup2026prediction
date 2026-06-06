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
    <div className="space-y-6 fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Group Stage Standings</h2>
          <p className="text-xs text-slate-400">Simulation probability of qualifying to the Round of 32</p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#3B82F6]"></span>
            <span className="text-slate-400">UEFA</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#10B981]"></span>
            <span className="text-slate-400">CONMEBOL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#F59E0B]"></span>
            <span className="text-slate-400">CONCACAF</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#EF4444]"></span>
            <span className="text-slate-400">CAF</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#8B5CF6]"></span>
            <span className="text-slate-400">AFC</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#6B7280]"></span>
            <span className="text-slate-400">OFC</span>
          </div>
        </div>
      </div>

      {/* Grid of 12 Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(groups).map(([letter, groupTeams]) => (
          <div
            key={letter}
            className="bg-[#1E293B] border border-slate-800 rounded-xl overflow-hidden shadow-lg hover:border-slate-700/60 hover:shadow-2xl transition-all duration-300 flex flex-col"
          >
            {/* Header */}
            <div className="bg-slate-900/60 px-4 py-3 border-b border-slate-850 flex justify-between items-center">
              <h3 className="font-bold text-white tracking-wide text-sm">
                GROUP <span className="text-indigo-400 text-base">{letter}</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                4 Teams
              </span>
            </div>

            {/* Table */}
            <div className="p-4 flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-2 w-[40%]">Team</th>
                    <th className="pb-2 w-[45%] text-center">Qualify Prob</th>
                    <th className="pb-2 w-[15%] text-right">Champ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs">
                  {groupTeams.map((team, idx) => (
                    <tr key={team.name} className="hover:bg-slate-800/20 transition-colors duration-150">
                      {/* Team name & Rank */}
                      <td className="py-2.5 pr-2 font-medium text-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 w-3">
                            {idx + 1}
                          </span>
                          <span className="truncate max-w-[100px] sm:max-w-none hover:text-indigo-400 transition-colors cursor-default flex items-center gap-1.5" title={team.name}>
                            <TeamFlag teamName={team.name} className="w-4.5 h-3" />
                            <span className="truncate">{team.name}</span>
                          </span>
                        </div>
                      </td>

                      {/* Qualification Progress Bar */}
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-950/80 rounded-full h-2.5 overflow-hidden border border-slate-800">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${team.group_qualify_rate * 100}%`,
                                backgroundColor: team.color
                              }}
                            ></div>
                          </div>
                          <span className="font-semibold text-slate-300 w-10 text-right tabular-nums">
                            {formatPercent(team.group_qualify_rate)}
                          </span>
                        </div>
                      </td>

                      {/* Champion Rate */}
                      <td className="py-2.5 pl-2 text-right font-bold text-emerald-400 tabular-nums">
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
