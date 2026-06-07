import React from 'react';
import TeamFlag from './TeamFlag';

export default function MarqueeSeparator({ teams, onSelectTeam }) {
  // Duplicate the teams list to make the marquee scrolling seamless
  const duplicatedTeams = [...teams, ...teams];

  return (
    <div className="relative w-full overflow-hidden bg-[#F5F4F0] border-y border-gold/30 py-2.5 select-none mt-2 mb-8 shadow-[0_4px_20px_rgba(0,0,0,0.45),inset_0_0_15px_rgba(255,255,255,0.7)]">
      {/* Subtle gold gradient background shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-gold/5 pointer-events-none" />
      
      {/* Fade mask on edges for a high-end look */}
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-dark-bg to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-dark-bg to-transparent z-10 pointer-events-none" />
      
      <div className="flex w-max animate-marquee pause-marquee gap-5 items-center">
        {duplicatedTeams.map((team, idx) => (
          <React.Fragment key={`${team.name}-${idx}`}>
            <div 
              onClick={() => onSelectTeam && onSelectTeam(team.name)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectTeam && onSelectTeam(team.name);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`View details for ${team.name}`}
              className="flex items-center gap-2.5 px-3 py-1 rounded-full hover:bg-gold/15 active:scale-95 transition-all duration-150 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/40"
            >
              <TeamFlag 
                teamName={team.name} 
                className="w-5.5 h-3.5 rounded-sm shadow-sm border border-black/10 transition-transform duration-200 group-hover:scale-105" 
              />
              <span className="font-bebas text-base sm:text-lg tracking-wider text-[#101010] group-hover:text-[#b8902e] transition-colors duration-200">
                {team.name}
              </span>
            </div>
            <span className="text-gold text-[10px] pointer-events-none font-noto opacity-80 select-none">
              ✦
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
