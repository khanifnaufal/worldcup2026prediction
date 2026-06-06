import React from 'react';
import { TEAM_ISO_CODES } from '../utils/helpers';

export default function TeamFlag({ teamName, className = "w-5 h-3.5" }) {
  const code = TEAM_ISO_CODES[teamName];
  if (!code) return <span className="text-[10px]">🏳️</span>;
  return (
    <img 
      src={`https://flagcdn.com/w40/${code}.png`} 
      alt={teamName} 
      className={`inline-block object-cover rounded-sm shadow-sm flex-shrink-0 ${className}`}
      style={{ verticalAlign: 'middle' }}
      onError={(e) => {
        // If flagcdn fails, fallback to a blank flag emoji
        e.target.style.display = 'none';
      }}
    />
  );
}
