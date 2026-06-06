/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom dark theme palette
        darkBg: '#0F172A',
        darkCard: '#1E293B',
        darkBorder: '#334155',
        // Confederation colors
        confed: {
          uefa: '#3B82F6',
          conmebol: '#10B981',
          concacaf: '#F59E0B',
          caf: '#EF4444',
          afc: '#8B5CF6',
          ofc: '#6B7280',
        }
      }
    },
  },
  plugins: [],
}
