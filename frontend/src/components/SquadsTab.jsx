import React, { useState, useMemo, useEffect } from 'react';
import squadsData from '../data/squads.json';
import { getConfedColor, getTeamConfed, CONFED_COLORS } from '../utils/helpers';
import TeamFlag from './TeamFlag';
import { Search, ArrowUpDown, UserCheck, Shield, ChevronDown, Activity, Award, Star } from 'lucide-react';

export default function SquadsTab({ simulationData, selectedTeam, setSelectedTeam }) {
  // Setup selectors
  const [teamSearch, setTeamSearch] = useState('');
  const [confedFilter, setConfedFilter] = useState('All');
  
  // Roster states
  const [playerSearch, setPlayerSearch] = useState('');
  const [posFilter, setPosFilter] = useState('All');
  const [sortKey, setSortKey] = useState('number');
  const [sortDirection, setSortDirection] = useState('asc');

  // Mobile team dropdown open state
  const [isMobileSelectorOpen, setIsMobileSelectorOpen] = useState(false);

  // Animation flag
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    setAnimated(true);
  }, []);

  // List of all teams from squads data
  const allTeams = useMemo(() => {
    return Object.keys(squadsData).map(name => ({
      name,
      confed: getTeamConfed(name),
      color: getConfedColor(name),
      group: simulationData.teams[name]?.group || 'N/A'
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [simulationData]);

  // Filter team list based on side panel search and confederation filter
  const filteredTeams = useMemo(() => {
    return allTeams.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(teamSearch.toLowerCase());
      const matchesConfed = confedFilter === 'All' || t.confed === confedFilter;
      return matchesSearch && matchesConfed;
    });
  }, [allTeams, teamSearch, confedFilter]);

  // Ensure selected team is valid and default to Argentina if empty
  const activeTeamName = selectedTeam && squadsData[selectedTeam] ? selectedTeam : 'Argentina';
  const activeTeamColor = getConfedColor(activeTeamName);
  const activeTeamConfed = getTeamConfed(activeTeamName);
  const activeTeamGroup = simulationData.teams[activeTeamName]?.group || 'N/A';

  // Get active squad details
  const squad = squadsData[activeTeamName] || { coach: 'N/A', players: [] };
  const coachName = squad.coach || 'Unknown Coach';
  const players = squad.players || [];

  // Calculate squad stats
  const squadStats = useMemo(() => {
    if (!players.length) return { avgAge: 'N/A', totalCaps: 0, totalGoals: 0, topClubs: [], veteran: null, scorer: null };

    const validAges = players.map(p => p.age).filter(a => typeof a === 'number');
    const avgAge = validAges.length ? (validAges.reduce((sum, a) => sum + a, 0) / validAges.length).toFixed(1) : 'N/A';

    const totalCaps = players.reduce((sum, p) => sum + (p.caps || 0), 0);
    const totalGoals = players.reduce((sum, p) => sum + (p.goals || 0), 0);

    const veteran = [...players].sort((a, b) => (b.caps || 0) - (a.caps || 0))[0];
    const scorer = [...players].sort((a, b) => (b.goals || 0) - (a.goals || 0))[0];

    const clubCounts = {};
    players.forEach(p => {
      if (p.club) {
        clubCounts[p.club] = (clubCounts[p.club] || 0) + 1;
      }
    });
    const topClubs = Object.entries(clubCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    return { avgAge, totalCaps, totalGoals, topClubs, veteran, scorer };
  }, [players]);

  // Filter roster players based on search and position
  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      const nameMatch = p.name.toLowerCase().includes(playerSearch.toLowerCase());
      const clubMatch = p.club && p.club.toLowerCase().includes(playerSearch.toLowerCase());
      const matchesSearch = nameMatch || clubMatch;
      const matchesPosition = posFilter === 'All' || p.position === posFilter;
      return matchesSearch && matchesPosition;
    });
  }, [players, playerSearch, posFilter]);

  // Sort filtered roster
  const sortedPlayers = useMemo(() => {
    let result = [...filteredPlayers];
    if (sortKey) {
      result.sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];

        // Handle null/undefined values safely
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'string') {
          return sortDirection === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        } else {
          // numeric sort
          return sortDirection === 'asc' 
            ? valA - valB 
            : valB - valA;
        }
      });
    }
    return result;
  }, [filteredPlayers, sortKey, sortDirection]);

  // Handle header click for sorting
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      // default secondary fields to desc sorting, alphabetical/number to asc
      if (['caps', 'goals', 'age'].includes(key)) {
        setSortDirection('desc');
      } else {
        setSortDirection('asc');
      }
    }
  };

  // Get position label styled badge
  const getPositionBadge = (pos) => {
    let baseClass = "px-2 py-0.5 rounded text-[11px] font-bold border tracking-wider uppercase inline-block ";
    if (pos === 'GK') return <span className={baseClass + "text-red-400 bg-red-950/20 border-red-800/30"}>GK</span>;
    if (pos === 'DF') return <span className={baseClass + "text-blue-400 bg-blue-950/20 border-blue-800/30"}>DF</span>;
    if (pos === 'MF') return <span className={baseClass + "text-emerald-400 bg-emerald-950/20 border-emerald-800/30"}>MF</span>;
    if (pos === 'FW') return <span className={baseClass + "text-gold bg-gold-muted border-gold-border"}>FW</span>;
    return <span className={baseClass + "text-text-muted-alt bg-white/5 border-white/10"}>{pos || 'N/A'}</span>;
  };

  return (
    <div className="space-y-6 fade-in">
      
      {/* Title Header */}
      <div className="space-y-3">
        <h2 className="text-4xl sm:text-5xl font-bebas text-white-alt tracking-wide uppercase">
          WORLD CUP ROSTERS
        </h2>
        <div className="border-b border-gold/10 pb-4">
          <p className="text-sm text-text-muted-alt font-noto">
            Search, sort, and inspect player profiles, club representations, and team compositions.
          </p>
        </div>
      </div>

      {/* Main Grid: Sidebar (selectors) + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================== */}
        {/* MOBILE TEAM SELECTOR DROPDOWN (Shown on < lg) */}
        {/* ========================================== */}
        <div className="lg:hidden relative">
          <button
            onClick={() => setIsMobileSelectorOpen(!isMobileSelectorOpen)}
            className="w-full bg-dark-card border border-gold-border/40 px-4 py-3 rounded-xl flex justify-between items-center text-sm font-semibold hover:border-gold/30 transition-all duration-200"
            style={{ borderLeft: `4px solid ${activeTeamColor}` }}
          >
            <span className="flex items-center gap-3 font-noto">
              <TeamFlag teamName={activeTeamName} className="w-6 h-4 shadow-sm" />
              <span className="font-bebas text-lg tracking-wider text-white-alt uppercase">{activeTeamName}</span>
              <span className="text-xs text-text-muted-alt font-noto uppercase font-bold tracking-wide">
                (Group {activeTeamGroup} · {activeTeamConfed})
              </span>
            </span>
            <ChevronDown className={`w-4 h-4 text-gold transition-transform duration-200 ${isMobileSelectorOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMobileSelectorOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsMobileSelectorOpen(false)} />
              <div className="absolute left-0 right-0 mt-2 bg-[#101010] border border-gold-border rounded-xl shadow-2xl z-40 max-h-96 overflow-y-auto flex flex-col divide-y divide-white/5 scale-up">
                
                {/* Search / Filters in Mobile Dropdown */}
                <div className="p-3 bg-[#0a0a0a] space-y-2 sticky top-0 z-10 border-b border-white/5">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted-alt" />
                    <input
                      type="text"
                      placeholder="Search country..."
                      value={teamSearch}
                      onChange={(e) => setTeamSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-sm bg-[#151515] border border-white/5 rounded-lg text-white-alt placeholder-text-muted-alt focus:outline-none focus:border-gold font-noto"
                    />
                  </div>
                  
                  {/* Confed filters */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {['All', 'UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC'].map(c => (
                      <button
                        key={c}
                        onClick={() => setConfedFilter(c)}
                        className={`px-2.5 py-1 text-xs font-bold rounded tracking-wider ${
                          confedFilter === c 
                            ? 'bg-gold-muted text-gold border border-gold-border' 
                            : 'bg-[#151515] text-text-muted-alt border border-transparent hover:text-white-alt'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Team Items */}
                <div className="py-1">
                  {filteredTeams.length === 0 ? (
                    <div className="p-4 text-center text-xs text-text-muted-alt font-noto">No teams found.</div>
                  ) : (
                    filteredTeams.map(t => {
                      const isSelected = t.name === activeTeamName;
                      return (
                        <button
                          key={t.name}
                          onClick={() => {
                            setSelectedTeam(t.name);
                            setIsMobileSelectorOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center justify-between transition-colors ${
                            isSelected 
                              ? 'bg-gold-muted text-gold' 
                              : 'text-text-muted-alt hover:text-white-alt hover:bg-white/[0.02]'
                          }`}
                        >
                          <span className="flex items-center gap-2 font-noto">
                            <TeamFlag teamName={t.name} className="w-5 h-3.5 shadow-sm" />
                            <span>{t.name}</span>
                          </span>
                          <span className="text-xs uppercase opacity-60 tracking-wider font-mono">
                            Group {t.group}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

              </div>
            </>
          )}
        </div>

        {/* ========================================== */}
        {/* DESKTOP SIDEBAR SELECTOR (Shown on lg) */}
        {/* ========================================== */}
        <div className="hidden lg:block lg:col-span-4 bg-dark-card border border-white/5 rounded-xl p-4 space-y-4 shadow-lg sticky top-20">
          
          <div className="space-y-1">
            <h3 className="font-bebas text-lg tracking-wider text-gold">SELECT TEAM</h3>
            <p className="text-xs text-text-muted-alt font-noto">Choose a nation to load their official roster.</p>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted-alt" />
            <input
              type="text"
              placeholder="Search teams..."
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#101010] border border-gold-border/30 rounded-lg text-white-alt placeholder-text-muted-alt focus:outline-none focus:border-gold transition-colors font-noto"
            />
          </div>

          {/* Confed Pills */}
          <div className="flex flex-wrap gap-1 border-b border-white/5 pb-3 font-noto">
            {['All', 'UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC'].map(c => (
              <button
                key={c}
                onClick={() => setConfedFilter(c)}
                className={`px-2.5 py-1 text-xs font-bold rounded tracking-wider border transition-all ${
                  confedFilter === c 
                    ? 'bg-gold-muted text-gold border-gold-border' 
                    : 'bg-[#0a0a0a] text-text-muted-alt border-transparent hover:text-white-alt hover:bg-white/[0.02]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Scrollable Team List */}
          <div className="max-h-[500px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredTeams.length === 0 ? (
              <div className="text-center py-6 text-xs text-text-muted-alt font-noto">No teams match filters.</div>
            ) : (
              filteredTeams.map(t => {
                const isSelected = t.name === activeTeamName;
                return (
                  <button
                    key={t.name}
                    onClick={() => setSelectedTeam(t.name)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between text-sm font-semibold transition-all border ${
                      isSelected
                        ? 'bg-gold-muted border-gold/40 text-gold shadow-sm'
                        : 'bg-[#0c0c0c] hover:bg-[#141414] border-transparent text-text-muted-alt hover:text-white-alt'
                    }`}
                    style={isSelected ? {} : { borderLeft: `3px solid ${t.color}` }}
                  >
                    <span className="flex items-center gap-2.5 font-noto">
                      <TeamFlag teamName={t.name} className="w-5.5 h-3.5 shadow-sm" />
                      <span className="truncate max-w-[130px]">{t.name}</span>
                    </span>
                    <span className="text-xs text-text-muted-alt/75 font-mono uppercase font-bold pr-1">
                      GP {t.group}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* MAIN ROSTER CONTENT PAGE (Col-span 8) */}
        {/* ========================================== */}
        <div className="lg:col-span-8 space-y-6">

          {/* 1. Team Profile Overview Card */}
          <div 
            className="bg-dark-card border border-white/5 rounded-xl p-5 md:p-6 shadow-lg relative overflow-hidden"
            style={{ borderLeft: `6px solid ${activeTeamColor}` }}
          >
            {/* Background Texture/Accent */}
            <div className="absolute right-0 top-0 bottom-0 opacity-[0.03] select-none pointer-events-none translate-x-12 translate-y-2 select-none">
              <span className="font-bebas text-[140px] leading-none tracking-tighter text-white-alt">
                {activeTeamConfed}
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 border-b border-white/5 pb-4">
              <div className="flex items-center gap-4">
                <TeamFlag teamName={activeTeamName} className="w-14 h-10 shadow-md object-cover rounded border border-white/10" />
                <div className="space-y-0.5">
                  <h3 className="font-bebas text-3xl sm:text-4xl text-white-alt tracking-wide uppercase leading-none">
                    {activeTeamName}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-text-muted-alt font-noto">
                    <span className="px-1.5 py-0.5 rounded text-xs font-bold text-white-alt uppercase" style={{ backgroundColor: activeTeamColor }}>
                      {activeTeamConfed}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-gold font-noto">Group {activeTeamGroup}</span>
                  </div>
                </div>
              </div>

              {/* Coach details */}
              <div className="flex items-center gap-3 bg-[#0a0a0a] border border-white/5 rounded-xl px-4 py-2">
                <UserCheck className="w-4 h-4 text-gold shrink-0" />
                <div className="text-left font-noto">
                  <div className="text-xs text-text-muted-alt uppercase font-bold tracking-wider">HEAD COACH</div>
                  <div className="text-base font-semibold text-white-alt truncate max-w-[160px]" title={coachName}>{coachName}</div>
                </div>
              </div>
            </div>

            {/* Quick Analytics Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5 font-noto text-center">
              
              <div className="bg-[#0c0c0c] border border-white/5 p-3 rounded-lg flex flex-col justify-center">
                <span className="text-[11px] text-text-muted-alt font-bold uppercase tracking-wider">ROSTER SIZE</span>
                <span className="text-2xl font-bebas text-white-alt mt-1 leading-none">{players.length} Players</span>
              </div>

              <div className="bg-[#0c0c0c] border border-white/5 p-3 rounded-lg flex flex-col justify-center">
                <span className="text-[11px] text-text-muted-alt font-bold uppercase tracking-wider">AVERAGE AGE</span>
                <span className="text-2xl font-bebas text-gold mt-1 leading-none">{squadStats.avgAge} Yrs</span>
              </div>

              <div className="bg-[#0c0c0c] border border-white/5 p-3 rounded-lg flex flex-col justify-center">
                <span className="text-[11px] text-text-muted-alt font-bold uppercase tracking-wider">TOTAL CAPS</span>
                <span className="text-2xl font-bebas text-white-alt mt-1 leading-none">{squadStats.totalCaps.toLocaleString()}</span>
              </div>

              <div className="bg-[#0c0c0c] border border-white/5 p-3 rounded-lg flex flex-col justify-center">
                <span className="text-[11px] text-text-muted-alt font-bold uppercase tracking-wider">TOTAL GOALS</span>
                <span className="text-2xl font-bebas text-white-alt mt-1 leading-none">{squadStats.totalGoals.toLocaleString()}</span>
              </div>

            </div>

            {/* Key Players & Top Clubs Info Banner */}
            {players.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5 font-noto text-sm text-text-muted-alt">
                
                {/* Veterans */}
                <div className="space-y-1.5 bg-[#0a0a0a]/50 p-3 rounded-lg border border-[#141414]">
                  <div className="flex items-center gap-1.5 text-gold font-semibold text-xs uppercase tracking-wider">
                    <Star className="w-3.5 h-3.5 shrink-0" />
                    <span>Squad Standouts</span>
                  </div>
                  <div className="space-y-1 text-white-alt/85 text-xs font-noto">
                    {squadStats.veteran && (
                      <div className="flex justify-between">
                        <span>Most Caps: <span className="font-semibold text-white-alt">{squadStats.veteran.name}</span></span>
                        <span className="font-mono text-text-muted-alt font-bold tabular-nums pr-1">({squadStats.veteran.caps} caps)</span>
                      </div>
                    )}
                    {squadStats.scorer && (
                      <div className="flex justify-between">
                        <span>Top Scorer: <span className="font-semibold text-white-alt">{squadStats.scorer.name}</span></span>
                        <span className="font-mono text-text-muted-alt font-bold tabular-nums pr-1">({squadStats.scorer.goals} goals)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Club representation */}
                <div className="space-y-1.5 bg-[#0a0a0a]/50 p-3 rounded-lg border border-[#141414]">
                  <div className="flex items-center gap-1.5 text-gold font-semibold text-xs uppercase tracking-wider">
                    <Award className="w-3.5 h-3.5 shrink-0" />
                    <span>Top Clubs Represented</span>
                  </div>
                  <div className="space-y-1 text-white-alt/85 text-xs font-noto">
                    {squadStats.topClubs.length > 0 ? (
                      squadStats.topClubs.map((club, idx) => (
                        <div key={club.name} className="flex justify-between">
                          <span className="truncate max-w-[190px]">{idx + 1}. {club.name}</span>
                          <span className="font-semibold text-white-alt shrink-0 font-mono tabular-nums pr-1">{club.count} {club.count > 1 ? 'players' : 'player'}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-text-muted-alt italic">Club breakdown unavailable.</div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* 2. Interactive Roster Controls & Table */}
          <div className="bg-dark-card border border-white/5 rounded-xl p-4 md:p-5 space-y-4 shadow-lg">
            
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-noto">
              
              {/* Position Filter Pills */}
              <div className="flex flex-wrap gap-1">
                {['All', 'GK', 'DF', 'MF', 'FW'].map(pos => {
                  const label = pos === 'All' ? 'All Roles' : pos;
                  return (
                    <button
                      key={pos}
                      onClick={() => setPosFilter(pos)}
                      className={`px-3 py-1.5 text-sm font-semibold rounded-lg border transition-all ${
                        posFilter === pos
                          ? 'bg-gold-muted border-gold-border text-gold'
                          : 'bg-[#101010] text-text-muted-alt border-white/5 hover:text-white-alt hover:bg-white/[0.02]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Roster search input */}
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted-alt" />
                <input
                  type="text"
                  placeholder="Filter players / clubs..."
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-[#0c0c0c] border border-white/5 rounded-lg text-white-alt placeholder-text-muted-alt focus:outline-none focus:border-gold transition-colors font-noto"
                />
              </div>

            </div>

            {/* Roster Table */}
            <div className="overflow-x-auto rounded-lg border border-white/5">
              <table className="w-full text-left border-collapse font-noto">
                <thead>
                  <tr className="bg-[#0c0c0c] border-b border-white/5 text-xs text-text-muted-alt font-bold uppercase tracking-wider select-none">
                    
                    <th 
                      onClick={() => handleSort('number')}
                      className="py-3 px-3 cursor-pointer hover:text-white-alt transition-colors w-12 text-center"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>#</span>
                        <ArrowUpDown className="w-2.5 h-2.5 text-gold" />
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort('name')}
                      className="py-3 px-3 cursor-pointer hover:text-white-alt transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Player</span>
                        <ArrowUpDown className="w-2.5 h-2.5 text-gold" />
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort('position')}
                      className="py-3 px-3 cursor-pointer hover:text-white-alt transition-colors w-16 text-center"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Pos</span>
                        <ArrowUpDown className="w-2.5 h-2.5 text-gold" />
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort('age')}
                      className="py-3 px-3 cursor-pointer hover:text-white-alt transition-colors w-16 text-center"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Age</span>
                        <ArrowUpDown className="w-2.5 h-2.5 text-gold" />
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort('caps')}
                      className="py-3 px-3 cursor-pointer hover:text-white-alt transition-colors w-16 text-center"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Caps</span>
                        <ArrowUpDown className="w-2.5 h-2.5 text-gold" />
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort('goals')}
                      className="py-3 px-3 cursor-pointer hover:text-white-alt transition-colors w-16 text-center"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Goals</span>
                        <ArrowUpDown className="w-2.5 h-2.5 text-gold" />
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort('club')}
                      className="py-3 px-3 cursor-pointer hover:text-white-alt transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Club</span>
                        <ArrowUpDown className="w-2.5 h-2.5 text-gold" />
                      </div>
                    </th>

                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-[#141414]/80">
                  {sortedPlayers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-text-muted-alt italic">
                        No players match the search or filter query.
                      </td>
                    </tr>
                  ) : (
                    sortedPlayers.map((player) => (
                      <tr 
                        key={player.name}
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        
                        {/* Number */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-gold tabular-nums text-sm">
                          {player.number !== null ? player.number : '-'}
                        </td>

                        {/* Player name */}
                        <td className="py-3 px-3 text-white-alt font-semibold">
                          {player.name}
                        </td>

                        {/* Position */}
                        <td className="py-3 px-3 text-center">
                          {getPositionBadge(player.position)}
                        </td>

                        {/* Age */}
                        <td className="py-3 px-3 text-center font-mono tabular-nums text-white-alt/85">
                          {player.age !== null ? player.age : '-'}
                        </td>

                        {/* Caps */}
                        <td className="py-3 px-3 text-center font-mono tabular-nums text-text-muted-alt">
                          {player.caps}
                        </td>

                        {/* Goals */}
                        <td className="py-3 px-3 text-center font-mono tabular-nums text-text-muted-alt">
                          {player.goals}
                        </td>

                        {/* Club */}
                        <td className="py-3 px-3 text-text-muted-alt group-hover:text-white-alt transition-colors">
                          {player.club || 'Free Agent'}
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* List count display */}
            <div className="flex justify-between items-center text-xs text-text-muted-alt uppercase font-bold tracking-wider pt-2">
              <span>Showing {sortedPlayers.length} of {players.length} players</span>
              {sortKey && (
                <span>Sorted by {sortKey} ({sortDirection})</span>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
