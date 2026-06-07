import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, Swords, Award, Star, Flame } from 'lucide-react';
import { getConfedColor, getTeamConfed, formatPercent } from '../utils/helpers';
import TeamFlag from './TeamFlag';

// Helper for Poisson probability
function poisson(lambda, k) {
  let factorial = 1;
  for (let i = 1; i <= k; i++) factorial *= i;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial;
}

export default function MatchDetailModal({ match, teamStats, onClose }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!match) return null;

  const { home, away, home_win_prob, draw_prob, away_win_prob, predicted_winner, isKnockout } = match;

  const homeColor = getConfedColor(home);
  const awayColor = getConfedColor(away);

  // Get statistics from teamStats JSON
  const homeStats = teamStats[home] || { fifa_rank: 999, fifa_points: 0, avg_gf: 1.2, avg_ga: 1.2, wc_appearances: 0, win_rate: 0.3 };
  const awayStats = teamStats[away] || { fifa_rank: 999, fifa_points: 0, avg_gf: 1.2, avg_ga: 1.2, wc_appearances: 0, win_rate: 0.3 };

  // H2H Comparison Metrics
  const comparisonMetrics = useMemo(() => {
    const metrics = [
      {
        label: 'FIFA Ranking',
        homeVal: homeStats.fifa_rank,
        awayVal: awayStats.fifa_rank,
        homeDisplay: `#${homeStats.fifa_rank}`,
        awayDisplay: `#${awayStats.fifa_rank}`,
        // Lower rank is better
        homeBetter: homeStats.fifa_rank < awayStats.fifa_rank,
        awayBetter: awayStats.fifa_rank < homeStats.fifa_rank,
        barPercentage: (() => {
          // Normalize rank comparison (assume max rank is 150)
          const h = Math.max(1, 150 - homeStats.fifa_rank);
          const a = Math.max(1, 150 - awayStats.fifa_rank);
          return (h / (h + a)) * 100;
        })()
      },
      {
        label: 'Attack (Avg Goals Scored)',
        homeVal: homeStats.avg_gf,
        awayVal: awayStats.avg_gf,
        homeDisplay: homeStats.avg_gf.toFixed(2),
        awayDisplay: awayStats.avg_gf.toFixed(2),
        homeBetter: homeStats.avg_gf > awayStats.avg_gf,
        awayBetter: awayStats.avg_gf > homeStats.avg_gf,
        barPercentage: (homeStats.avg_gf / (homeStats.avg_gf + awayStats.avg_gf)) * 100
      },
      {
        label: 'Defense (Avg Goals Conceded)',
        homeVal: homeStats.avg_ga,
        awayVal: awayStats.avg_ga,
        homeDisplay: homeStats.avg_ga.toFixed(2),
        awayDisplay: awayStats.avg_ga.toFixed(2),
        // Lower goals conceded is better
        homeBetter: homeStats.avg_ga < awayStats.avg_ga,
        awayBetter: awayStats.avg_ga < homeStats.avg_ga,
        barPercentage: (() => {
          const hInv = 1 / Math.max(0.1, homeStats.avg_ga);
          const aInv = 1 / Math.max(0.1, awayStats.avg_ga);
          return (hInv / (hInv + aInv)) * 100;
        })()
      },
      {
        label: 'Overall Win Rate',
        homeVal: homeStats.win_rate,
        awayVal: awayStats.win_rate,
        homeDisplay: formatPercent(homeStats.win_rate),
        awayDisplay: formatPercent(awayStats.win_rate),
        homeBetter: homeStats.win_rate > awayStats.win_rate,
        awayBetter: awayStats.win_rate > homeStats.win_rate,
        barPercentage: (homeStats.win_rate / (homeStats.win_rate + awayStats.win_rate)) * 100
      },
      {
        label: 'World Cup Appearances',
        homeVal: homeStats.wc_appearances,
        awayVal: awayStats.wc_appearances,
        homeDisplay: `${homeStats.wc_appearances} times`,
        awayDisplay: `${awayStats.wc_appearances} times`,
        homeBetter: homeStats.wc_appearances > awayStats.wc_appearances,
        awayBetter: awayStats.wc_appearances > homeStats.wc_appearances,
        barPercentage: homeStats.wc_appearances + awayStats.wc_appearances > 0 
          ? (homeStats.wc_appearances / (homeStats.wc_appearances + awayStats.wc_appearances)) * 100 
          : 50
      }
    ];
    return metrics;
  }, [homeStats, awayStats]);

  // Compute Poisson Scoreline Distribution calibrated to model output
  const scorelinePredictions = useMemo(() => {
    // Expected goals calculation
    const lambdaH = Math.max(0.2, Math.min(4.5, homeStats.avg_gf * (awayStats.avg_ga / 1.3)));
    const lambdaA = Math.max(0.2, Math.min(4.5, awayStats.avg_gf * (homeStats.avg_ga / 1.3)));

    const jointProbs = [];
    let sumHomeWin = 0;
    let sumDraw = 0;
    let sumAwayWin = 0;

    // Calculate uncalibrated Poisson joint probabilities
    for (let x = 0; x <= 5; x++) {
      for (let y = 0; y <= 5; y++) {
        const p = poisson(lambdaH, x) * poisson(lambdaA, y);
        jointProbs.push({ x, y, p });
        if (x > y) sumHomeWin += p;
        else if (x === y) sumDraw += p;
        else sumAwayWin += p;
      }
    }

    // Model probabilities (fallbacks if values are missing)
    const mHome = home_win_prob;
    const mDraw = draw_prob !== undefined ? draw_prob : 0;
    const mAway = away_win_prob;

    // Calibrate Poisson predictions to exactly match the ML model's win/draw/loss predictions
    const calibrated = jointProbs.map(item => {
      let cp = 0;
      if (item.x > item.y) {
        cp = sumHomeWin > 0 ? item.p * (mHome / sumHomeWin) : 0;
      } else if (item.x === item.y) {
        cp = sumDraw > 0 ? item.p * (mDraw / sumDraw) : 0;
      } else {
        cp = sumAwayWin > 0 ? item.p * (mAway / sumAwayWin) : 0;
      }
      return {
        score: `${item.x} - ${item.y}`,
        prob: cp,
        type: item.x > item.y ? 'home' : item.x === item.y ? 'draw' : 'away'
      };
    });

    // Sort by probability descending and return top 5
    return calibrated.sort((a, b) => b.prob - a.prob).slice(0, 5);
  }, [homeStats, awayStats, home_win_prob, draw_prob, away_win_prob]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred Backdrop Scrim */}
      <div 
        className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal Card Box */}
      <div className="relative bg-[#101010] border border-gold-border rounded-2xl w-full max-w-[560px] md:max-w-[850px] max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col z-10 scale-up custom-scrollbar">
        
        {/* Header section with match stage */}
        <div className="relative p-5 border-b border-white/5 flex justify-between items-center bg-[#080808]/40">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-gold" />
            <div>
              <h2 className="text-xl font-bebas text-white-alt tracking-wider leading-none uppercase">
                {isKnockout ? 'Knockout Stage Match Details' : 'Group Stage Match Details'}
              </h2>
              <span className="text-[10px] text-text-muted-alt font-noto uppercase tracking-widest mt-1 block">
                {isKnockout ? 'Single-Elimination Path' : `Group Stage Matchup`}
              </span>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="text-gold hover:text-white-alt transition-colors text-3xl font-light leading-none p-1 -mt-2 -mr-1 cursor-pointer"
            title="Close"
          >
            &times;
          </button>
        </div>

        {/* Modal Content Grid */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Column: Matchup & Probabilities */}
          <div className="space-y-5 flex flex-col justify-between">
            {/* Matchup Header */}
            <div className="bg-[#080808]/40 border border-white/5 p-4 rounded-xl flex items-center justify-between text-center gap-3">
              {/* Home Team */}
              <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                <TeamFlag teamName={home} className="w-12 h-8 rounded border border-white/10 shadow-md" />
                <span className="text-sm font-bold text-white-alt truncate w-full font-noto">{home}</span>
                <span className="text-[9px] uppercase tracking-wider text-text-muted-alt font-semibold font-noto" style={{ color: homeColor }}>
                  {getTeamConfed(home)}
                </span>
              </div>

              {/* VS separator */}
              <div className="flex-shrink-0 flex flex-col items-center">
                <span className="font-bebas text-gold text-2xl tracking-widest select-none bg-[#141414] px-3 py-1 rounded-lg border border-gold-border/20">VS</span>
              </div>

              {/* Away Team */}
              <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                <TeamFlag teamName={away} className="w-12 h-8 rounded border border-white/10 shadow-md" />
                <span className="text-sm font-bold text-white-alt truncate w-full font-noto">{away}</span>
                <span className="text-[9px] uppercase tracking-wider text-text-muted-alt font-semibold font-noto" style={{ color: awayColor }}>
                  {getTeamConfed(away)}
                </span>
              </div>
            </div>

            {/* Model Predictions / Probability breakdown */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bebas text-gold tracking-widest uppercase border-b border-white/5 pb-1 mb-1 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-gold fill-gold" />
                  Model Win Probability
                </h3>
                <p className="text-[10px] text-text-muted-alt font-noto">Machine learning simulated win/draw/loss expectations</p>
              </div>

              {/* Probabilities displays */}
              <div className="grid grid-cols-3 gap-2 text-center font-noto">
                <div className={`p-2.5 rounded-xl border bg-dark-bg/60 transition-all ${predicted_winner === home ? 'border-gold bg-gold-muted/10' : 'border-white/5'}`}>
                  <span className="text-[9px] font-bold text-text-muted-alt uppercase tracking-wider block">HOME WIN</span>
                  <span className="text-xl font-bebas text-white-alt mt-1 block tracking-wide">{formatPercent(home_win_prob)}</span>
                </div>
                
                {draw_prob !== undefined && (
                  <div className={`p-2.5 rounded-xl border bg-dark-bg/60 transition-all ${predicted_winner === 'Draw' ? 'border-gold bg-gold-muted/10' : 'border-white/5'}`}>
                    <span className="text-[9px] font-bold text-text-muted-alt uppercase tracking-wider block">DRAW</span>
                    <span className="text-xl font-bebas text-white-alt mt-1 block tracking-wide">{formatPercent(draw_prob)}</span>
                  </div>
                )}

                <div className={`p-2.5 rounded-xl border bg-dark-bg/60 transition-all ${predicted_winner === away ? 'border-gold bg-gold-muted/10' : 'border-white/5'}`}>
                  <span className="text-[9px] font-bold text-text-muted-alt uppercase tracking-wider block">AWAY WIN</span>
                  <span className="text-xl font-bebas text-white-alt mt-1 block tracking-wide">{formatPercent(away_win_prob)}</span>
                </div>
              </div>

              {/* Visual Multi-Segment Probability Bar */}
              <div className="w-full bg-[#080808] rounded-full h-3 overflow-hidden border border-white/5 flex">
                <div 
                  className="h-full transition-all duration-300"
                  style={{ width: `${home_win_prob * 100}%`, backgroundColor: homeColor }}
                  title={`${home}: ${formatPercent(home_win_prob)}`}
                />
                {draw_prob !== undefined && (
                  <div 
                    className="h-full transition-all duration-300 bg-gray-600"
                    style={{ width: `${draw_prob * 100}%` }}
                    title={`Draw: ${formatPercent(draw_prob)}`}
                  />
                )}
                <div 
                  className="h-full transition-all duration-300"
                  style={{ width: `${away_win_prob * 100}%`, backgroundColor: awayColor }}
                  title={`${away}: ${formatPercent(away_win_prob)}`}
                />
              </div>

              {/* Predicted Winner text */}
              <div className="bg-[#080808]/60 border border-white/5 rounded-xl p-3 flex items-center justify-between text-xs font-noto">
                <span className="text-text-muted-alt font-medium flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-gold" />
                  Simulated Winner Prediction:
                </span>
                <span className="font-extrabold text-gold uppercase tracking-wider flex items-center gap-1.5">
                  {predicted_winner === 'Draw' ? (
                    'DRAW EXPECTED'
                  ) : (
                    <>
                      <TeamFlag teamName={predicted_winner} className="w-4 h-3 rounded-sm shadow-sm" />
                      {predicted_winner}
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Scoreline probabilities header & lists */}
            <div className="space-y-2.5">
              <div>
                <h3 className="text-sm font-bebas text-gold tracking-widest uppercase border-b border-white/5 pb-1 mb-1 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-gold fill-gold" />
                  Predicted Scorelines
                </h3>
                <p className="text-[10px] text-text-muted-alt font-noto">Top 5 calibrated scoreline outcomes based on Poisson simulations</p>
              </div>

              <div className="space-y-2">
                {scorelinePredictions.map((pred, index) => {
                  let barColor = 'bg-gray-600';
                  if (pred.type === 'home') barColor = 'bg-[#C9A84C]';
                  else if (pred.type === 'away') barColor = 'bg-[#c0c0c0]';

                  return (
                    <div key={index} className="bg-[#080808]/40 border border-white/5 hover:border-gold-border/20 p-2 rounded-xl flex items-center justify-between gap-3 text-xs font-noto">
                      <div className="w-16 font-bebas text-[15px] text-white-alt tracking-wider text-center bg-[#101010] py-0.5 rounded border border-white/5 shadow-sm">
                        {pred.score}
                      </div>

                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 bg-[#080808] rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${barColor}`}
                            style={{ 
                              width: animated ? `${pred.prob * 3.5 * 100}%` : '0%', // Scale bar for readability
                              transition: `width 0.8s ease-out ${index * 0.05}s`
                            }}
                          />
                        </div>
                        <span className="font-bebas text-[14px] text-gold w-10 text-right leading-none tabular-nums">
                          {formatPercent(pred.prob)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: H2H Statistics Comparison */}
          <div className="space-y-3.5 bg-[#080808]/30 border border-white/5 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bebas text-gold tracking-widest uppercase border-b border-white/5 pb-1 mb-1 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-gold fill-gold" />
                Head-To-Head Statistics
              </h3>
              <p className="text-[10px] text-text-muted-alt font-noto">Historical metrics and team performance comparison</p>
            </div>

            <div className="space-y-4 flex-grow flex flex-col justify-around py-2">
              {comparisonMetrics.map((metric, idx) => (
                <div key={idx} className="space-y-1.5 font-noto">
                  {/* Values Row */}
                  <div className="flex justify-between items-baseline text-xs font-semibold">
                    <span className={`w-14 truncate ${metric.homeBetter ? 'text-gold font-extrabold' : 'text-text-muted-alt font-normal'}`}>
                      {metric.homeDisplay}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-text-muted-alt/80 font-bold select-none text-center flex-1">
                      {metric.label}
                    </span>
                    <span className={`w-14 truncate text-right ${metric.awayBetter ? 'text-gold font-extrabold' : 'text-text-muted-alt font-normal'}`}>
                      {metric.awayDisplay}
                    </span>
                  </div>

                  {/* Dual-Sided Bar Indicator */}
                  <div className="w-full bg-[#101010] h-1.5 rounded-full overflow-hidden border border-white/5 relative flex">
                    <div 
                      className="h-full rounded-l-full transition-all duration-500"
                      style={{ 
                        width: animated ? `${metric.barPercentage}%` : '50%',
                        backgroundColor: homeColor 
                      }}
                    />
                    <div className="w-px h-full bg-[#161616]" />
                    <div 
                      className="h-full rounded-r-full transition-all duration-500"
                      style={{ 
                        width: animated ? `${100 - metric.barPercentage}%` : '50%',
                        backgroundColor: awayColor 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Note at bottom of statistics */}
            <div className="text-[9px] text-text-muted-alt/75 border-t border-white/5 pt-3 leading-relaxed mt-2 font-noto">
              ℹ️ <strong>Head-To-Head calculation note:</strong> Metrics are simulated based on historical games since 2018. Goals predictions use Poisson variables representing average goals scored/conceded relative to opponent defensive coefficients.
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#080808]/60 border-t border-white/5 flex justify-between items-center text-[9px] text-text-muted-alt font-semibold px-6 font-noto">
          <span>FIFA World Cup 2026 Simulation</span>
          <span>Poisson Score Calibration</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
