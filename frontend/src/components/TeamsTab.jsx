import React, { useState, useMemo } from 'react';
import { Search, Filter } from 'lucide-react';
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
      .sort((a, b) => a.name.localeCompare(b.name)); // Alphabetical sorting
  }, [teams, searchQuery, selectedGroup, selectedConfed]);

  return (
    <div className="space-y-6 fade-in">
      {/* Search & Filter Header Bar */}
      <div className="bg-dark-card border border-white/5 rounded-xl p-4 md:p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted-alt" />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#101010] border border-[#1A1A1A] rounded-lg text-white-alt placeholder-text-muted-alt focus:outline-none focus:border-gold transition-colors font-noto"
          />
        </div>

        {/* Dropdown filters */}
        <div className="flex flex-wrap items-center gap-3 font-noto">
          {/* Confederation filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted-alt flex items-center gap-1">
              <Filter className="w-3 h-3 text-gold" /> Confed:
            </span>
            <select
              value={selectedConfed}
              onChange={(e) => setSelectedConfed(e.target.value)}
              className="bg-[#101010] border border-[#1A1A1A] rounded-lg px-3 py-2 text-xs text-white-alt focus:outline-none focus:border-gold transition-colors cursor-pointer"
            >
              {confedsList.map(conf => (
                <option key={conf} value={conf}>{conf}</option>
              ))}
            </select>
          </div>

          {/* Group filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted-alt">Group:</span>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-[#101010] border border-[#1A1A1A] rounded-lg px-3 py-2 text-xs text-white-alt focus:outline-none focus:border-gold transition-colors cursor-pointer"
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
        <div className="text-center py-12 text-text-muted-alt text-sm bg-dark-card border border-white/5 rounded-xl font-noto">
          No teams match the search or filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredTeams.map((team) => {
            const isHigh = team.champion_rate > 0.05;
            const isMid = team.champion_rate >= 0.01 && team.champion_rate <= 0.05;
            
            let rateColorClass = 'text-text-muted-alt';
            if (isHigh) rateColorClass = 'text-gold';
            else if (isMid) rateColorClass = 'text-white-alt';

            return (
              <div
                key={team.name}
                onClick={() => onSelectTeam(team.name)}
                className="relative group bg-dark-card border border-white/5 hover:border-gold-border hover:bg-[#141414] p-4 pt-5 rounded-xl shadow cursor-pointer transition-all duration-150 hover:-translate-y-[2px] flex flex-col justify-between h-32 overflow-hidden select-none"
              >
                {/* Confederation Color Top Accent strip */}
                <div 
                  className="absolute top-0 left-0 right-0 h-0.5" 
                  style={{ backgroundColor: team.color }}
                />

                <div className="space-y-1">
                  <div className="flex justify-between items-start gap-1">
                    <h3 className="font-semibold text-white-alt text-[15px] leading-tight truncate group-hover:text-gold transition-colors duration-150 flex items-center gap-2 font-noto w-full">
                      <TeamFlag teamName={team.name} className="w-6 h-4 shadow-sm" />
                      <span className="truncate">{team.name}</span>
                    </h3>
                  </div>
                  
                  <p className="text-[11px] text-text-muted-alt font-semibold uppercase tracking-wider font-noto">
                    Group {team.group}
                  </p>
                </div>

                {/* Champion rate badge */}
                <div className="flex justify-between items-end mt-2 pt-2 border-t border-white/5 font-noto">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-text-muted-alt font-medium">
                    CHAMP PROB
                  </span>
                  <span className={`text-28px font-bebas leading-none tabular-nums ${rateColorClass}`}>
                    {team.champion_rate > 0 ? formatPercent(team.champion_rate) : '0%'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
