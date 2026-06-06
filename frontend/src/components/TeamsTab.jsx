import React, { useState, useMemo } from 'react';
import { Search, Filter, Shield } from 'lucide-react';
import { getConfedColor, getTeamConfed, formatPercent } from '../utils/helpers';
import TeamFlag from './TeamFlag';

export default function TeamsTab({ simulationData, onSelectTeam }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [selectedConfed, setSelectedConfed] = useState('All');

  const { teams } = simulationData;

  const groupsList = ['All', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const confedsList = ['All', 'UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC'];

  // Filter and sort teams list
  const filteredTeams = useMemo(() => {
    return Object.entries(teams)
      .map(([name, data]) => ({
        name,
        ...data,
        confed: getTeamConfed(name),
        color: getConfedColor(name)
      }))
      .filter(team => {
        const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGroup = selectedGroup === 'All' || team.group === selectedGroup;
        const matchesConfed = selectedConfed === 'All' || team.confed === selectedConfed;
        return matchesSearch && matchesGroup && matchesConfed;
      })
      .sort((a, b) => a.name.localeCompare(b.name)); // Alphabetical sorting for scanning directory
  }, [teams, searchQuery, selectedGroup, selectedConfed]);

  return (
    <div className="space-y-6 fade-in">
      {/* Search & Filter Header Bar */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 md:p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 transition-colors"
          />
        </div>

        {/* Dropdown filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Confederation filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-455 text-slate-400 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Confed:
            </span>
            <select
              value={selectedConfed}
              onChange={(e) => setSelectedConfed(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {confedsList.map(conf => (
                <option key={conf} value={conf}>{conf}</option>
              ))}
            </select>
          </div>

          {/* Group filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Group:</span>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {groupsList.map(g => (
                <option key={g} value={g}>{g === 'All' ? 'All' : `Group ${g}`}</option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Grid of Teams */}
      {filteredTeams.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm bg-[#1E293B] border border-slate-800 rounded-xl">
          No teams match the search or filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredTeams.map((team) => (
            <div
              key={team.name}
              onClick={() => onSelectTeam(team.name)}
              className="relative group bg-[#1E293B] border border-slate-800/80 hover:border-indigo-500/40 p-4 rounded-xl shadow cursor-pointer transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-32 overflow-hidden select-none"
            >
              {/* Confederation Color Left Accent bar */}
              <div 
                className="absolute top-0 left-0 bottom-0 w-1" 
                style={{ backgroundColor: team.color }}
              />

              <div className="space-y-1">
                <div className="flex justify-between items-start gap-1">
                  <h3 className="font-extrabold text-white text-xs md:text-sm truncate group-hover:text-indigo-400 transition-colors duration-200 flex items-center gap-1.5">
                    <TeamFlag teamName={team.name} className="w-4.5 h-3" />
                    <span className="truncate">{team.name}</span>
                  </h3>
                </div>
                
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Group {team.group}
                </p>
              </div>

              {/* Champion rate badge */}
              <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-800/40">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                  Champ Prob
                </span>
                <span className="text-xs font-black text-emerald-400 tabular-nums">
                  {team.champion_rate > 0 ? formatPercent(team.champion_rate) : '0%'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
