import React, { useState, useMemo, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LabelList,
} from "recharts";
import { Trophy, Sparkles, TrendingUp } from "lucide-react";
import { getConfedColor, getTeamConfed, formatPercent } from "../utils/helpers";
import TeamFlag from "./TeamFlag";

const useCountUp = (target, duration = 1200, delay = 0) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      const start = Date.now();
      const tick = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        setValue(target * eased);
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timer);
  }, [target, duration, delay]);
  return value;
};

export default function OverviewTab({ simulationData, onSelectTeam }) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [animated, setAnimated] = useState(false);
  const [podiumVisible, setPodiumVisible] = useState({
    third: false,
    second: false,
    first: false,
  });

  // Podium entrance timers (run once on mount)
  useEffect(() => {
    const timer3 = setTimeout(() => {
      setPodiumVisible((prev) => ({ ...prev, third: true }));
    }, 100);
    const timer2 = setTimeout(() => {
      setPodiumVisible((prev) => ({ ...prev, second: true }));
    }, 300);
    const timer1 = setTimeout(() => {
      setPodiumVisible((prev) => ({ ...prev, first: true }));
    }, 500);

    return () => {
      clearTimeout(timer3);
      clearTimeout(timer2);
      clearTimeout(timer1);
    };
  }, []);

  // Chart bar animation trigger (runs on filter change)
  useEffect(() => {
    setAnimated(false);
    const timer = setTimeout(() => {
      setAnimated(true);
    }, 50);
    return () => clearTimeout(timer);
  }, [activeFilter]);

  const { metadata, teams, most_likely_finalist } = simulationData;

  // Process and sort teams
  const allTeams = useMemo(() => {
    return Object.entries(teams)
      .map(([name, data]) => ({
        name,
        ...data,
        confed: getTeamConfed(name),
        color: getConfedColor(name),
      }))
      .sort((a, b) => b.champion_rate - a.champion_rate);
  }, [teams]);

  // Podium teams
  const podium = useMemo(() => {
    if (allTeams.length < 3) return [];
    return [
      allTeams[1], // 2nd Place
      allTeams[0], // 1st Place
      allTeams[2], // 3rd Place
    ];
  }, [allTeams]);

  // Hooks for count up calculations
  const champValue1 = useCountUp(
    podium[0] ? podium[0].champion_rate * 100 : 0,
    1200,
    300,
  );
  const champValue0 = useCountUp(
    podium[1] ? podium[1].champion_rate * 100 : 0,
    1200,
    500,
  );
  const champValue2 = useCountUp(
    podium[2] ? podium[2].champion_rate * 100 : 0,
    1200,
    100,
  );

  // Dark Horses: Turkey, Uruguay, and Croatia
  const darkHorses = useMemo(() => {
    const targets = ["Turkey", "Uruguay", "Croatia"];
    return allTeams
      .filter((t) => targets.includes(t.name))
      .sort((a, b) => b.champion_rate - a.champion_rate);
  }, [allTeams]);

  // Filter teams for the chart
  const filteredTeams = useMemo(() => {
    if (activeFilter === "All") return allTeams;
    return allTeams.filter((t) => t.confed === activeFilter);
  }, [allTeams, activeFilter]);

  // Dynamic height based on number of items to make sure it looks spaced out and readable
  const chartHeight = useMemo(() => {
    return filteredTeams.length * 44;
  }, [filteredTeams]);

  // Dynamic bar size: thicker for fewer teams
  const barSize = useMemo(() => {
    return filteredTeams.length > 20 ? 20 : 28;
  }, [filteredTeams]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-dark-card border border-gold-border p-4 rounded-xl shadow-2xl text-xs max-w-xs font-noto">
          <p className="font-bebas text-lg text-white-alt mb-2 flex items-center gap-2">
            <TeamFlag
              teamName={data.name}
              className="w-7 h-5 rounded-sm shadow-sm"
            />
            {data.name}
          </p>
          <div className="space-y-1.5 border-t border-white/5 pt-2">
            <p className="text-text-muted-alt">
              Group:{" "}
              <span className="text-white-alt font-semibold">{data.group}</span>
            </p>
            <p className="text-text-muted-alt">
              Confederation:{" "}
              <span className="font-semibold" style={{ color: data.color }}>
                {data.confed}
              </span>
            </p>
            <div className="mt-2.5 pt-2.5 border-t border-white/5 space-y-1">
              <p className="text-gold font-bold">
                Champion: {formatPercent(data.champion_rate)}
              </p>
              <p className="text-white-alt/90">
                Reach Final: {formatPercent(data.final_rate)}
              </p>
              <p className="text-white-alt/80">
                Reach Semis: {formatPercent(data.sf_rate)}
              </p>
              <p className="text-white-alt/70">
                Reach Quarters: {formatPercent(data.qf_rate)}
              </p>
              <p className="text-white-alt/60">
                Reach R16: {formatPercent(data.r16_rate)}
              </p>
              <p className="text-white-alt/50">
                Group Qualify: {formatPercent(data.group_qualify_rate)}
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-10 fade-in">
      {/* Hero Section */}
      <div
        className="relative rounded-2xl border border-gold-border p-4 md:p-6 overflow-hidden shadow-2xl text-center flex flex-col justify-center min-h-[500px] lg:h-[calc(100vh-8rem)] py-8 lg:py-4"
        style={{
          backgroundColor: "#080808",
          backgroundImage:
            "repeating-linear-gradient(-45deg, transparent 0px, transparent 40px, rgba(201,168,76,0.025) 40px, rgba(201,168,76,0.025) 41px)",
        }}
      >
        {/* Soccer Field Background */}
        <div className="absolute inset-0 z-0 opacity-12 pointer-events-none select-none">
          <svg
            viewBox="0 0 200 100"
            fill="none"
            stroke="currentColor"
            className="w-full h-full text-gold"
          >
            {/* Outer Boundary */}
            <rect x="4" y="4" width="192" height="92" strokeWidth="0.8" />

            {/* Left Penalty Box */}
            <rect x="4" y="22" width="24" height="56" strokeWidth="0.8" />
            {/* Left Goal Box */}
            <rect x="4" y="38" width="8" height="24" strokeWidth="0.8" />
            {/* Left Penalty Spot */}
            <circle cx="18" cy="50" r="1" fill="currentColor" />
            {/* Left Penalty Arc */}
            <path d="M 28,40 A 12,12 0 0,1 28,60" strokeWidth="0.8" />

            {/* Right Penalty Box */}
            <rect x="172" y="22" width="24" height="56" strokeWidth="0.8" />
            {/* Right Goal Box */}
            <rect x="188" y="38" width="8" height="24" strokeWidth="0.8" />
            {/* Right Penalty Spot */}
            <circle cx="182" cy="50" r="1" fill="currentColor" />
            {/* Right Penalty Arc */}
            <path d="M 172,40 A 12,12 0 0,0 172,60" strokeWidth="0.8" />

            {/* Corner Arcs */}
            <path d="M 4,9 A 5,5 0 0,0 9,4" strokeWidth="0.8" />
            <path d="M 4,91 A 5,5 0 0,1 9,96" strokeWidth="0.8" />
            <path d="M 196,9 A 5,5 0 0,1 191,4" strokeWidth="0.8" />
            <path d="M 196,91 A 5,5 0 0,0 191,96" strokeWidth="0.8" />

            {/* Tactical Plays - Passing Paths & Player Positions */}
            {/* Top Left Attack */}
            <circle
              cx="35"
              cy="18"
              r="2.5"
              strokeWidth="0.8"
              className="animate-pulse"
            />
            <text
              x="32"
              y="13"
              className="text-[3px] font-bebas fill-current"
              stroke="none"
            >
              MF
            </text>
            <path
              d="M 35,18 Q 55,10 75,20"
              strokeDasharray="1.5,1.5"
              strokeWidth="0.5"
            />
            <polygon
              points="75,18 78,22 73,22"
              fill="currentColor"
              transform="rotate(35, 75, 20)"
              className="animate-pulse"
            />

            {/* Bottom Right Attack */}
            <circle
              cx="165"
              cy="82"
              r="2.5"
              strokeWidth="0.8"
              className="animate-pulse"
            />
            <text
              x="162"
              y="90"
              className="text-[3px] font-bebas fill-current"
              stroke="none"
            >
              FW
            </text>
            <path
              d="M 165,82 Q 145,90 125,80"
              strokeDasharray="1.5,1.5"
              strokeWidth="0.5"
            />
            <polygon
              points="125,78 122,82 127,82"
              fill="currentColor"
              transform="rotate(-35, 125, 80)"
              className="animate-pulse"
            />
          </svg>
        </div>

        <div className="relative z-10 flex-grow flex flex-col justify-center py-1 md:py-2 select-none">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-gold-border bg-gold-muted text-gold text-[10px] font-semibold tracking-[0.25em] font-noto uppercase self-center mb-3">
            WE ARE 26
          </div>

          <div className="space-y-0.5">
            <h1 className="text-4xl sm:text-5xl md:text-[56px] font-bebas text-white-alt leading-[0.9] tracking-tight uppercase">
              FIFA WORLD CUP 2026
            </h1>
            <h1 className="text-4xl sm:text-5xl md:text-[56px] font-bebas text-gold leading-[0.9] tracking-tight uppercase">
              PREDICTION
            </h1>
          </div>

          <p className="text-text-muted-alt text-[11px] sm:text-xs max-w-3xl mx-auto font-noto font-light leading-normal my-2 px-2">
            Based on{" "}
            <span className="text-white-alt font-semibold">
              {metadata?.n_simulations?.toLocaleString()}
            </span>{" "}
            Monte Carlo simulations using a{" "}
            <span className="text-white-alt font-semibold">
              {metadata?.model_used}
            </span>{" "}
            model (F1-Score: {metadata?.model_f1_score?.toFixed(4)}).
          </p>

          {/* Most Likely Final Badge */}
          {most_likely_finalist && (
            <div className="inline-block mt-1.5 mb-1.5 border border-gold/30 bg-gold-muted rounded-xl px-3 py-1.5 sm:px-4 shadow-lg self-center max-w-[90%]">
              <span className="text-[9px] text-gold uppercase tracking-[0.2em] block font-bold mb-0.5 font-noto leading-none">
                Most Likely Final
              </span>
              <span className="text-sm sm:text-base md:text-lg font-bebas text-white-alt flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 leading-none mt-1">
                <TeamFlag
                  teamName={most_likely_finalist[0]}
                  className="w-4 h-3 sm:w-5 sm:h-3.5 shadow"
                />
                <span className="truncate max-w-[80px] sm:max-w-none">{most_likely_finalist[0]}</span>
                <span className="text-gold font-noto text-[10px] sm:text-xs lowercase font-normal px-0.5">
                  vs
                </span>
                <TeamFlag
                  teamName={most_likely_finalist[1]}
                  className="w-4 h-3 sm:w-5 sm:h-3.5 shadow"
                />
                <span className="truncate max-w-[80px] sm:max-w-none">{most_likely_finalist[1]}</span>
              </span>
            </div>
          )}
        </div>

        {/* Podium section */}
        {podium.length >= 3 && (
          <div className="mt-2 flex justify-center items-end gap-2 sm:gap-4 md:gap-6 max-w-2xl mx-auto px-1 sm:px-4 relative z-10 select-none">
            {/* 2nd Place (Left) */}
            <div
              onClick={() => onSelectTeam && onSelectTeam(podium[0].name)}
              className={`flex flex-col items-center flex-1 podium-entrance cursor-pointer hover:opacity-90 transition-opacity duration-150 ${podiumVisible.second ? "podium-entrance-active" : ""}`}
            >
              <TeamFlag
                teamName={podium[0].name}
                className="w-10 h-7 sm:w-14 sm:h-9 md:w-16 md:h-11 rounded border border-white/10 shadow-lg mb-2"
              />
              <span
                className="font-bebas text-base sm:text-xl md:text-2xl text-white-alt leading-tight truncate w-full text-center max-w-[75px] sm:max-w-none px-0.5"
                title={podium[0].name}
              >
                {podium[0].name}
              </span>
              <span className="font-bebas text-lg sm:text-2xl md:text-3xl text-gold mt-0.5 leading-none">
                {champValue1.toFixed(1)}%
              </span>
              <span className="font-noto text-[8px] sm:text-[9px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-text-muted-alt mt-1 mb-2">
                RUNNER UP
              </span>
              {/* Vertical platform line */}
              <div className="w-0.5 bg-gold/30 h-6 sm:h-8" />
            </div>

            {/* Divider Line */}
            <div className="w-px h-20 sm:h-28 bg-gold-border self-center opacity-60" />

            {/* 1st Place (Center - Higher) */}
            <div
              onClick={() => onSelectTeam && onSelectTeam(podium[1].name)}
              className={`flex flex-col items-center flex-1 border-t-2 border-gold pt-3 relative podium-entrance cursor-pointer hover:opacity-90 transition-opacity duration-150 ${podiumVisible.first ? "podium-entrance-active" : ""}`}
            >
              <TeamFlag
                teamName={podium[1].name}
                className="w-12 h-8 sm:w-16 sm:h-11 md:w-20 md:h-14 rounded border border-white/10 shadow-lg mb-2"
              />
              <span
                className="font-bebas text-lg sm:text-xl md:text-2xl text-white-alt leading-tight truncate w-full text-center max-w-[85px] sm:max-w-none px-0.5"
                title={podium[1].name}
              >
                {podium[1].name}
              </span>
              <span className="font-bebas text-xl sm:text-3xl md:text-[40px] text-gold mt-0.5 leading-none">
                {champValue0.toFixed(1)}%
              </span>
              <span className="font-noto text-[8px] sm:text-[9px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-text-muted-alt mt-1 mb-2">
                CHAMPION
              </span>
              {/* Vertical platform line */}
              <div className="w-0.5 bg-gold h-10 sm:h-12" />
            </div>

            {/* Divider Line */}
            <div className="w-px h-20 sm:h-28 bg-gold-border self-center opacity-60" />

            {/* 3rd Place (Right) */}
            <div
              onClick={() => onSelectTeam && onSelectTeam(podium[2].name)}
              className={`flex flex-col items-center flex-1 podium-entrance cursor-pointer hover:opacity-90 transition-opacity duration-150 ${podiumVisible.third ? "podium-entrance-active" : ""}`}
            >
              <TeamFlag
                teamName={podium[2].name}
                className="w-10 h-7 sm:w-14 sm:h-9 md:w-16 md:h-11 rounded border border-white/10 shadow-lg mb-2"
              />
              <span
                className="font-bebas text-base sm:text-xl md:text-2xl text-white-alt leading-tight truncate w-full text-center max-w-[75px] sm:max-w-none px-0.5"
                title={podium[2].name}
              >
                {podium[2].name}
              </span>
              <span className="font-bebas text-lg sm:text-2xl md:text-3xl text-gold mt-0.5 leading-none">
                {champValue2.toFixed(1)}%
              </span>
              <span className="font-noto text-[8px] sm:text-[9px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-text-muted-alt mt-1 mb-2">
                SEMI FINAL
              </span>
              {/* Vertical platform line */}
              <div className="w-0.5 bg-gold/15 h-4 sm:h-6" />
            </div>
          </div>
        )}
      </div>

      {/* Horizontal Divider */}
      <div className="h-px w-full bg-gold/10" />

      {/* Grid: Win Probability Chart & Dark Horses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Horizontal Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-dark-card border border-gold-border rounded-xl p-5 md:p-6 shadow-xl space-y-6 flex flex-col justify-start">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bebas text-white-alt flex items-center gap-2 tracking-wide uppercase">
                <TrendingUp className="w-5 h-5 text-gold" />
                CHAMPIONSHIP PROBABILITY
              </h2>
              <p className="text-xs text-text-muted-alt font-noto">
                Hover bar for detailed advancement metrics
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1.5 bg-[#080808] p-1 rounded-lg border border-white/5">
              {["All", "UEFA", "CONMEBOL", "CONCACAF", "CAF", "AFC"].map(
                (filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-2 py-1 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-md transition-all duration-200 ${
                      activeFilter === filter
                        ? "border border-gold bg-gold-muted text-gold"
                        : "border border-transparent text-text-muted-alt hover:text-white-alt"
                    }`}
                  >
                    {filter}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Chart Wrapper with dynamic scrollable viewport */}
          <div
            className="pr-2 rounded-lg border border-white/5 bg-[#080808]/40 px-4 py-2"
            style={{
              height:
                activeFilter === "All" || activeFilter === "UEFA"
                  ? "520px"
                  : filteredTeams.length * 45 + 16 + "px",
              overflowY: "auto",
            }}
          >
            {filteredTeams.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-text-muted-alt text-sm">
                No teams found for this confederation.
              </div>
            ) : (
              <div
                style={{ height: filteredTeams.length * (barSize + 16) + "px" }}
                className="w-full"
                key={activeFilter}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredTeams}
                    layout="vertical"
                    margin={{ top: 0, right: 45, left: 5, bottom: 0 }}
                    height={filteredTeams.length * (barSize + 16)}
                  >
                    <defs>
                      <linearGradient id="grad-top" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#E8C96A" />
                        <stop offset="100%" stopColor="#C9A84C" />
                      </linearGradient>
                      <linearGradient
                        id="grad-UEFA"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop
                          offset="100%"
                          stopColor="#3B82F6"
                          stopOpacity={0.7}
                        />
                      </linearGradient>
                      <linearGradient
                        id="grad-CONMEBOL"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0%" stopColor="#10B981" />
                        <stop
                          offset="100%"
                          stopColor="#10B981"
                          stopOpacity={0.7}
                        />
                      </linearGradient>
                      <linearGradient
                        id="grad-CONCACAF"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop
                          offset="100%"
                          stopColor="#F59E0B"
                          stopOpacity={0.7}
                        />
                      </linearGradient>
                      <linearGradient id="grad-CAF" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#EF4444" />
                        <stop
                          offset="100%"
                          stopColor="#EF4444"
                          stopOpacity={0.7}
                        />
                      </linearGradient>
                      <linearGradient id="grad-AFC" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop
                          offset="100%"
                          stopColor="#8B5CF6"
                          stopOpacity={0.7}
                        />
                      </linearGradient>
                      <linearGradient id="grad-OFC" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6B7280" />
                        <stop
                          offset="100%"
                          stopColor="#6B7280"
                          stopOpacity={0.7}
                        />
                      </linearGradient>
                    </defs>
 
                    <XAxis
                      type="number"
                      hide
                      domain={[0, (dataMax) => dataMax * 1.2]}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#F0EDE8",
                        fontSize: 12,
                        fontFamily: "Noto Sans",
                        fontWeight: 400,
                      }}
                      width={85}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "rgba(201, 168, 76, 0.04)" }}
                    />
                    <Bar
                      dataKey="champion_rate"
                      radius={[0, 4, 4, 0]}
                      barSize={barSize}
                      background={{ fill: "#181818", radius: [0, 4, 4, 0] }}
                      isAnimationActive={false}
                      shape={(props) => {
                        const { x, y, width, height, fill, index } = props;
                        const idx = index || 0;
                        return (
                          <rect
                            x={x}
                            y={y}
                            width={animated ? width : 0}
                            height={height}
                            fill={fill}
                            rx={2}
                            ry={2}
                            style={{
                              transition: `width 0.8s ease-out ${idx * 0.05}s`,
                              willChange: "width",
                            }}
                          />
                        );
                      }}
                    >
                      {filteredTeams.map((entry, index) => {
                        const fillId =
                          index === 0
                            ? "url(#grad-top)"
                            : `url(#grad-${entry.confed})`;
                        return <Cell key={`cell-${index}`} fill={fillId} />;
                      })}
                      <LabelList
                        dataKey="champion_rate"
                        position="right"
                        formatter={(val) => formatPercent(val)}
                        style={{
                          fill: "#C9A84C",
                          fontSize: 13,
                          fontFamily: "Bebas Neue",
                          fontWeight: 600,
                          opacity: animated ? 1 : 0,
                          transition: "opacity 0.5s ease-out 0.8s",
                        }}
                        offset={6}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Surprise Packages / Dark Horses */}
        <div className="bg-dark-card border border-gold-border rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-3xl font-bebas text-white-alt tracking-wide uppercase">
                DARK HORSES
              </h2>
              <p className="text-xs text-text-muted-alt font-noto">
                Teams that could surprise the world
              </p>
            </div>

            <div className="space-y-4">
              {darkHorses.map((team) => (
                <div
                  key={team.name}
                  onClick={() => onSelectTeam && onSelectTeam(team.name)}
                  className="relative overflow-hidden bg-dark-card border border-gold-border/60 p-4 rounded-xl shadow card-hover cursor-pointer"
                  style={{ borderLeft: `3px solid ${team.color}` }}
                >
                  <div className="flex justify-between items-start pl-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bebas text-xl text-white-alt flex items-center gap-2">
                          <TeamFlag
                            teamName={team.name}
                            className="w-7 h-5 rounded-sm shadow-sm"
                          />
                          {team.name}
                        </h3>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-noto font-bold bg-dark-card-alt text-text-muted-alt border border-white/5">
                          {team.confed}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted-alt font-noto">
                        Group{" "}
                        <span className="text-gold font-semibold">
                          {team.group}
                        </span>
                      </p>
                    </div>

                    <div className="text-right flex flex-col">
                      <span className="text-[9px] text-text-muted-alt font-bold uppercase tracking-wider font-noto">
                        Champ Rate
                      </span>
                      <span className="text-2xl font-bebas text-gold leading-none mt-1">
                        {formatPercent(team.champion_rate)}
                      </span>
                    </div>
                  </div>

                  {/* Micro timeline */}
                  <div className="mt-3 pl-2 pt-2 border-t border-white/5 flex justify-between text-[10px] text-text-muted-alt font-noto">
                    <div>
                      QF:{" "}
                      <span className="text-white-alt font-semibold">
                        {formatPercent(team.qf_rate)}
                      </span>
                    </div>
                    <div>
                      SF:{" "}
                      <span className="text-white-alt font-semibold">
                        {formatPercent(team.sf_rate)}
                      </span>
                    </div>
                    <div>
                      Final:{" "}
                      <span className="text-white-alt font-semibold">
                        {formatPercent(team.final_rate)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-gold-muted border border-gold-border text-xs text-gold/90 leading-relaxed font-noto">
            💡 <strong>Dark Horses</strong> (Turkey, Uruguay, Croatia) are
            selected as prominent dark horse contenders outside the top
            tournament favorites, based on their high potential in the
            simulation.
          </div>
        </div>
      </div>
    </div>
  );
}
