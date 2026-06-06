import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList } from 'recharts';
import { Trophy, Sparkles, TrendingUp } from 'lucide-react';
import { getConfedColor, getTeamConfed, formatPercent } from '../utils/helpers';
import TeamFlag from './TeamFlag';

export default function OverviewTab({ simulationData }) {
  const [activeFilter, setActiveFilter] = useState('All');

  const { metadata, teams, most_likely_finalist } = simulationData;

  // Process and sort teams
  const allTeams = useMemo(() => {
    return Object.entries(teams).map(([name, data]) => ({
      name,
      ...data,
      confed: getTeamConfed(name),
      color: getConfedColor(name)
    })).sort((a, b) => b.champion_rate - a.champion_rate);
  }, [teams]);

  // Podium teams
  const podium = useMemo(() => {
    if (allTeams.length < 3) return [];
    return [
      allTeams[1], // 2nd Place
      allTeams[0], // 1st Place
      allTeams[2]  // 3rd Place
    ];
  }, [allTeams]);

  // Dark Horses: Top 3 teams by champion rate excluding the top 4 favorites
  const darkHorses = useMemo(() => {
    if (allTeams.length < 7) return [];
    const favorites = allTeams.slice(0, 4).map(t => t.name);
    return allTeams
      .filter(t => !favorites.includes(t.name) && t.champion_rate > 0)
      .slice(0, 3);
  }, [allTeams]);

  // Filter teams for the chart
  const filteredTeams = useMemo(() => {
    if (activeFilter === 'All') return allTeams;
    return allTeams.filter(t => t.confed === activeFilter);
  }, [allTeams, activeFilter]);

  // Dynamic height based on number of items to make sure it looks spaced out and readable
  const chartHeight = useMemo(() => {
    return Math.max(300, filteredTeams.length * 28);
  }, [filteredTeams]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
          <p className="font-bold text-white mb-1 flex items-center gap-1.5">
            <TeamFlag teamName={data.name} className="w-4.5 h-3" />
            {data.name}
          </p>
          <p className="text-slate-300">Group: <span className="text-indigo-400 font-semibold">{data.group}</span></p>
          <p className="text-slate-300">Confederation: <span className="font-semibold" style={{ color: data.color }}>{data.confed}</span></p>
          <div className="mt-2 pt-2 border-t border-slate-700 space-y-1">
            <p className="text-emerald-400 font-medium">Champion: {formatPercent(data.champion_rate)}</p>
            <p className="text-blue-400">Reach Final: {formatPercent(data.final_rate)}</p>
            <p className="text-indigo-400">Reach Semis: {formatPercent(data.sf_rate)}</p>
            <p className="text-amber-400">Reach Quarters: {formatPercent(data.qf_rate)}</p>
            <p className="text-purple-400">Reach R16: {formatPercent(data.r16_rate)}</p>
            <p className="text-slate-400">Group Qualify: {formatPercent(data.group_qualify_rate)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 fade-in">
      {/* Hero Section */}
      <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-8 overflow-hidden shadow-2xl text-center">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl translate-y-1/2"></div>

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            AI Simulation Engine
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
            FIFA World Cup 2026 Prediction
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
            Based on <span className="text-slate-200 font-semibold">{metadata?.n_simulations?.toLocaleString()}</span> Monte Carlo simulations using a <span className="text-slate-200 font-semibold">{metadata?.model_used}</span> model (F1-Score: {metadata?.model_f1_score?.toFixed(4)}).
          </p>

          {/* Most Likely Final Badge */}
          {most_likely_finalist && (
            <div className="inline-block mt-4 bg-slate-900/60 border border-slate-800/80 rounded-xl px-5 py-2.5 shadow-lg">
              <span className="text-xs text-slate-400 uppercase tracking-widest block font-medium mb-0.5">Most Likely Final</span>
              <span className="text-base font-bold text-indigo-300 flex items-center justify-center gap-2">
                <TeamFlag teamName={most_likely_finalist[0]} className="w-5 h-3.5" />
                {most_likely_finalist[0]}
                <span className="text-slate-500 font-normal">vs</span>
                <TeamFlag teamName={most_likely_finalist[1]} className="w-5 h-3.5" />
                {most_likely_finalist[1]}
              </span>
            </div>
          )}
        </div>

        {/* Podium section */}
        {podium.length >= 3 && (
          <div className="mt-12 flex justify-center items-end gap-3 max-w-xl mx-auto px-4">
            {/* 2nd Place */}
            <div className="flex flex-col items-center flex-1 group">
              <span className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1 truncate max-w-[95px] md:max-w-none" title={podium[0].name}>
                <TeamFlag teamName={podium[0].name} className="w-4 h-3" />
                <span className="truncate">{podium[0].name}</span>
              </span>
              <span className="text-sm font-bold text-slate-300 mb-2">{formatPercent(podium[0].champion_rate)}</span>
              <div className="w-full h-24 md:h-32 bg-gradient-to-t from-slate-800 to-slate-700/80 rounded-t-xl flex flex-col justify-between p-3 border-t-2 border-slate-400/50 shadow-lg group-hover:scale-102 transition-transform duration-300">
                <div className="w-7 h-7 rounded-full bg-slate-600/50 flex items-center justify-center text-xs font-bold text-slate-300 mx-auto shadow">2</div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Runner Up</div>
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center flex-1 -translate-y-2 group">
              <Trophy className="w-8 h-8 text-yellow-400 animate-bounce mb-1" />
              <span className="text-sm font-bold text-white mb-1 flex items-center gap-1 truncate max-w-[110px] md:max-w-none" title={podium[1].name}>
                <TeamFlag teamName={podium[1].name} className="w-4.5 h-3.5" />
                <span className="truncate">{podium[1].name}</span>
              </span>
              <span className="text-base font-black text-yellow-400 mb-2">{formatPercent(podium[1].champion_rate)}</span>
              <div className="w-full h-32 md:h-44 bg-gradient-to-t from-yellow-950/60 to-yellow-800/40 rounded-t-xl flex flex-col justify-between p-3 border-t-4 border-yellow-500 shadow-2xl relative group-hover:scale-102 transition-transform duration-300">
                <div className="absolute inset-0 bg-yellow-500/5 rounded-t-xl blur-lg"></div>
                <div className="w-9 h-9 rounded-full bg-yellow-500/20 border border-yellow-400/30 flex items-center justify-center text-sm font-black text-yellow-400 mx-auto shadow-inner relative z-10">1</div>
                <div className="text-xs uppercase font-extrabold tracking-widest text-yellow-400 relative z-10">Champion</div>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center flex-1 group">
              <span className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1 truncate max-w-[95px] md:max-w-none" title={podium[2].name}>
                <TeamFlag teamName={podium[2].name} className="w-4 h-3" />
                <span className="truncate">{podium[2].name}</span>
              </span>
              <span className="text-sm font-bold text-slate-300 mb-2">{formatPercent(podium[2].champion_rate)}</span>
              <div className="w-full h-20 md:h-26 bg-gradient-to-t from-slate-800 to-slate-700/80 rounded-t-xl flex flex-col justify-between p-3 border-t-2 border-amber-600/50 shadow-lg group-hover:scale-102 transition-transform duration-300">
                <div className="w-7 h-7 rounded-full bg-amber-800/40 flex items-center justify-center text-xs font-bold text-amber-500 mx-auto shadow">3</div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Semi Final</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Win Probability Chart & Dark Horses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Horizontal Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-[#1E293B] border border-slate-800 rounded-xl p-5 md:p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                Win Probability Chart
              </h2>
              <p className="text-xs text-slate-400">Hover for detailed advancement rates</p>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1.5 bg-slate-900/60 p-1 rounded-lg border border-slate-800/80">
              {['All', 'UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all duration-200 ${
                    activeFilter === filter
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Wrapper with fixed height scrollable viewport */}
          <div className="overflow-y-auto max-h-[500px] pr-2 rounded-lg border border-slate-900 bg-slate-900/40 p-4">
            {filteredTeams.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                No teams found for this confederation.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart
                  data={filteredTeams}
                  layout="vertical"
                  margin={{ top: 5, right: 45, left: 10, bottom: 5 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }}
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(51, 65, 85, 0.2)' }} />
                  <Bar dataKey="champion_rate" radius={[0, 4, 4, 0]} barSize={14}>
                    {filteredTeams.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <LabelList
                      dataKey="champion_rate"
                      position="right"
                      formatter={(val) => formatPercent(val)}
                      style={{ fill: '#CBD5E1', fontSize: 9, fontWeight: 700 }}
                      offset={8}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Surprise Packages / Dark Horses */}
        <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Surprise Packages 🎯
              </h2>
              <p className="text-xs text-slate-400">Top rates excluding main favorites</p>
            </div>

            <div className="space-y-4">
              {darkHorses.map((team, idx) => (
                <div
                  key={team.name}
                  className="relative group overflow-hidden bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 p-4 rounded-xl shadow transition-all duration-300"
                >
                  {/* Confederation Color Left Accent bar */}
                  <div
                    className="absolute top-0 left-0 bottom-0 w-1.5"
                    style={{ backgroundColor: team.color }}
                  ></div>

                  <div className="flex justify-between items-start pl-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors duration-200 flex items-center gap-1.5">
                          <TeamFlag teamName={team.name} className="w-4 h-3" />
                          {team.name}
                        </h3>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-800 text-slate-400 border border-slate-700/50">
                          {team.confed}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Group <span className="text-indigo-300 font-semibold">{team.group}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-medium">Champion Rate</p>
                      <p className="text-base font-black text-emerald-400">
                        {formatPercent(team.champion_rate)}
                      </p>
                    </div>
                  </div>

                  {/* Micro timeline on hover/always */}
                  <div className="mt-3 pl-2 pt-2 border-t border-slate-800 flex justify-between text-[10px] text-slate-500">
                    <div>QF: <span className="text-slate-300">{formatPercent(team.qf_rate)}</span></div>
                    <div>SF: <span className="text-slate-300">{formatPercent(team.sf_rate)}</span></div>
                    <div>Final: <span className="text-slate-300">{formatPercent(team.final_rate)}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-indigo-950/20 border border-indigo-900/30 text-xs text-indigo-300/90 leading-relaxed">
            💡 <strong>Dark Horses</strong> are selected dynamically based on their high simulation winning probabilities, excluding the top 4 favorites who represent the clear tournament heavyweights.
          </div>
        </div>
      </div>
    </div>
  );
}
