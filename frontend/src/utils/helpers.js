export const CONFEDERATION = {
  UEFA: ["Germany","France","England","Spain","Portugal","Netherlands",
         "Belgium","Croatia","Switzerland","Austria","Sweden","Norway",
         "Scotland","Czechia","Bosnia and Herzegovina","Turkey","Uzbekistan"],
  CONMEBOL: ["Brazil","Argentina","Colombia","Uruguay","Ecuador",
              "Paraguay","Chile","Peru","Bolivia","Venezuela"],
  CONCACAF: ["Mexico","United States","Canada","Panama","Haiti","Curacao"],
  CAF: ["Morocco","Senegal","Algeria","Ivory Coast","Egypt","Ghana",
        "Tunisia","South Africa","DR Congo","Cape Verde"],
  AFC: ["Japan","South Korea","Iran","Saudi Arabia","Australia",
        "Iraq","Jordan","Qatar"],
  OFC: ["New Zealand"]
};

export const CONFED_COLORS = {
  UEFA: '#3B82F6',       // Blue
  CONMEBOL: '#10B981',   // Green
  CONCACAF: '#F59E0B',   // Yellow
  CAF: '#EF4444',        // Red
  AFC: '#8B5CF6',        // Purple
  OFC: '#6B7280'         // Grey
};

export const TEAM_ISO_CODES = {
  "Germany": "de",
  "France": "fr",
  "England": "gb-eng",
  "Spain": "es",
  "Portugal": "pt",
  "Netherlands": "nl",
  "Belgium": "be",
  "Croatia": "hr",
  "Switzerland": "ch",
  "Austria": "at",
  "Sweden": "se",
  "Norway": "no",
  "Scotland": "gb-sct",
  "Czechia": "cz",
  "Bosnia and Herzegovina": "ba",
  "Turkey": "tr",
  "Uzbekistan": "uz",
  "Brazil": "br",
  "Argentina": "ar",
  "Colombia": "co",
  "Uruguay": "uy",
  "Ecuador": "ec",
  "Paraguay": "py",
  "Chile": "cl",
  "Peru": "pe",
  "Bolivia": "bo",
  "Venezuela": "ve",
  "Mexico": "mx",
  "United States": "us",
  "Canada": "ca",
  "Panama": "pa",
  "Haiti": "ht",
  "Curacao": "cw",
  "Morocco": "ma",
  "Senegal": "sn",
  "Algeria": "dz",
  "Ivory Coast": "ci",
  "Egypt": "eg",
  "Ghana": "gh",
  "Tunisia": "tn",
  "South Africa": "za",
  "DR Congo": "cd",
  "Cape Verde": "cv",
  "Japan": "jp",
  "South Korea": "kr",
  "Iran": "ir",
  "Saudi Arabia": "sa",
  "Australia": "au",
  "Iraq": "iq",
  "Jordan": "jo",
  "Qatar": "qa",
  "New Zealand": "nz"
};

export function getTeamFlagUrl(teamName) {
  const code = TEAM_ISO_CODES[teamName];
  if (!code) return '';
  return `https://flagcdn.com/w40/${code}.png`;
}

export function getTeamConfed(teamName) {
  for (const [confed, teams] of Object.entries(CONFEDERATION)) {
    if (teams.includes(teamName)) {
      return confed;
    }
  }
  return 'UEFA'; // Fallback
}

export function getConfedColor(teamName) {
  const confed = getTeamConfed(teamName);
  return CONFED_COLORS[confed] || '#6B7280';
}

export function formatPercent(val) {
  if (val === undefined || val === null) return '0.0%';
  return `${(val * 100).toFixed(1)}%`;
}
