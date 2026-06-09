# ⚽ World Cup 2026 Winner Prediction 

An interactive prediction engine to simulate and forecast the winner of the 2026 FIFA World Cup using machine learning and Monte Carlo simulations (10,000+ runs), paired with a premium interactive React dashboard. The application features a dedicated, sortable WC-2026 squads browser compiled by scraping Wikipedia and utilizing a Kaggle dataset.

---

## 🗂️ Project Structure

```
worldcup2026/
├── data/
│   ├── raw/
│   │   ├── wc_historical.csv          # Scraping results from Wikipedia (WC 1930–2022)
│   │   ├── results.csv                # Kaggle: all international results 1872–2026
│   │   └── former_names.csv           # Kaggle: old name → current name mapping
│   ├── processed/
│   │   ├── team_features.csv          # 48 teams × 26 features
│   │   └── match_features.csv         # Match-level dataset for training
│   └── output/
│       ├── squads.json                # Scraped official squads & rosters for 48 teams
│       └── simulation_results.json    # Results of 10,000 simulations
├── frontend/                          # Interactive React + Vite frontend application
│   ├── public/                        # Static assets
│   ├── src/
│   │   ├── components/                # Dashboard tabs (Overview, Groups, Bracket, Teams, Squads)
│   │   ├── data/                      # Simulation + squads data imported in frontend
│   │   └── utils/                     # Helper files (flags, configurations)
│   ├── package.json
│   └── vite.config.js
├── models/
│   ├── best_model.pkl                 # Selected Logistic Regression model
│   └── feature_names.pkl              # Feature names used by the model
├── scraper/
│   ├── scrape_wikipedia.py            # WC historical scraper from Wikipedia
│   └── scrape_squads.py               # WC-2026 squads & rosters Wikipedia scraper
└── scripts/                           # Data processing & modeling pipeline scripts
    ├── process_kaggle.py              # Kaggle dataset processing & mapping
    ├── engineer_features.py           # Feature engineering & preprocessing
    ├── train_simulate.py              # Model training & Monte Carlo simulation
    ├── split_matches.py               # Split recent matches per team (helper)
    └── README.md                      # Guide on running script pipeline
```

---

## 📦 Data Sources

### 1. Wikipedia (Historical Matches Scraped)
- **Target**: FIFA World Cup match results from 1930 to 2022.
- **Libraries**: `requests`, `BeautifulSoup4`
- **Output**: `data/raw/wc_historical.csv`
- **Columns**: `year`, `stage`, `home_team`, `away_team`, `home_score`, `away_score`

### 2. Wikipedia (2026 Squads Scraped)
- **Target**: Official roster lists, players, shirt numbers, positions, ages, caps, goals, and clubs for all 48 participating World Cup 2026 nations.
- **Libraries**: `requests`, `BeautifulSoup4`
- **Output**: `data/output/squads.json`

### 3. Kaggle — International Football Results
- **Dataset**: [martj42/international-football-results-from-1872-to-2017](https://www.kaggle.com/datasets/martj42/international-football-results-from-1872-to-2017)
- **Note**: This dataset is updated up to 2026 by its maintainer.
- **Content**: 49,000+ international match results including friendlies, qualifiers, and tournaments.
- **Used Files**: `results.csv`, `former_names.csv`

### 4. FIFA Ranking (Hardcoded)
- **Source**: FIFA.com as of June 10, 2026.
- **Features**: `fifa_rank`, `fifa_points` for the 48 qualified World Cup 2026 teams.

> **Why not scrape FBref or Transfermarkt?**
> FBref is protected by Cloudflare and Transfermarkt uses CAPTCHA. The Kaggle dataset provides a comprehensive history of friendly, qualifier, and tournament matches, which is fully sufficient for this project.

---

## 🔧 Pipeline

> ⚠️ **Important:** All scripts inside the `scripts/` directory must be executed from the **project root** (`worldcup2026/`), not from inside the `scripts/` directory itself.

### Step 1 — Scraping Wikipedia
```bash
# Scrape historical match outcomes (1930–2022)
python scraper/scrape_wikipedia.py

# Scrape World Cup 2026 official squads and coaching staffs
python scraper/scrape_squads.py
```
Scrapes matches and squad configurations from Wikipedia. Employs `time.sleep` between requests and robust error handling for table parsing, normalizing names (e.g., matching Wikipedia's "Czech Republic" to "Czechia").

### Step 2 — Processing Kaggle Dataset
```bash
python scripts/process_kaggle.py
```
- Loads `results.csv` and `former_names.csv`.
- Standardizes team names (e.g., `"IR Iran"` → `"Iran"`, `"Korea Republic"` → `"South Korea"`).
- Filters matches from 2018–2025 involving the 48 World Cup 2026 teams.
- Transforms the data to a per-team perspective (2 rows per match: home and away perspectives).
- Outputs: `all_recent_matches.csv`, `friendly_matches.csv`, and `competitive_matches.csv`.

**Result**: 7,150 rows, 0 null values, covering all 48 teams.

### Step 3 — Feature Engineering
```bash
python scripts/engineer_features.py
```
Generates 26 features per team:

| Category | Features |
|---|---|
| Overall form | `win_rate`, `draw_rate`, `loss_rate`, `avg_gf`, `avg_ga`, `avg_gd` |
| Competitive form | `comp_win_rate`, `comp_avg_gf`, `comp_avg_ga` |
| Recent form (2022–2025) | `recent_win_rate`, `recent_avg_gf`, `recent_avg_ga` |
| Weighted form score | `form_score` (weights: 0.2 / 0.3 / 0.5 per period) |
| Venue performance | `home_win_rate`, `away_win_rate`, `neutral_win_rate` |
| WC historical | `wc_appearances`, `wc_win_rate`, `wc_avg_gf`, `wc_avg_ga`, `wc_best_stage`, `wc_avg_best_stage` |
| FIFA Ranking | `fifa_rank`, `fifa_points` |

The match-level dataset is built by calculating the **feature difference** between the two teams for each historical World Cup match (1990–2022).

### Step 4 — Model Training & Simulation
```bash
python scripts/train_simulate.py
```

**Evaluated Models** (5-fold cross-validation):

| Model | Accuracy | F1-Weighted |
|---|---|---|
| Logistic Regression ✅ | 0.5237 | **0.5263** |
| Random Forest | 0.5291 | 0.5063 |
| XGBoost | 0.4729 | 0.4588 |

**Logistic Regression** was selected based on the highest F1-Weighted score.

**Top 5 Feature Importances**:
1. `wc_avg_gf_diff` (0.4234)
2. `neutral_win_rate_diff` (0.3305)
3. `wc_avg_ga_diff` (0.3127)
4. `recent_avg_ga_diff` (0.2413)
5. `wc_win_rate_diff` (0.2281)

**Monte Carlo Simulation** — 10,000 runs:
- Simulates the group stage (12 groups, round-robin).
- Advances the top 2 teams from each group + the 8 best third-placed teams (total of 32 teams).
- Simulates the single-elimination knockout stage: R32 → R16 → QF → SF → Final.
- Uses match win/draw/loss probabilities predicted by the model.

---

## 🏆 Prediction Results (10,000 Simulations)

### Top 10 Champion Rates

| Rank | Team | Champion Rate | Group |
|---|---|---|---|
| 1 | <img src="https://flagcdn.com/w20/br.png" width="20" alt="Brazil"> Brazil | 22.50% | C |
| 2 | <img src="https://flagcdn.com/w20/de.png" width="20" alt="Germany"> Germany | 13.60% | E |
| 3 | <img src="https://flagcdn.com/w20/fr.png" width="20" alt="France"> France | 12.70% | I |
| 4 | <img src="https://flagcdn.com/w20/ar.png" width="20" alt="Argentina"> Argentina | 9.56% | J |
| 5 | <img src="https://flagcdn.com/w20/gb-eng.png" width="20" alt="England"> England | 6.07% | L |
| 6 | <img src="https://flagcdn.com/w20/es.png" width="20" alt="Spain"> Spain | 6.03% | H |
| 7 | <img src="https://flagcdn.com/w20/tr.png" width="20" alt="Turkey"> Turkey | 5.29% | D |
| 8 | <img src="https://flagcdn.com/w20/nl.png" width="20" alt="Netherlands"> Netherlands | 4.67% | F |
| 9 | <img src="https://flagcdn.com/w20/pt.png" width="20" alt="Portugal"> Portugal | 4.58% | K |
| 10 | <img src="https://flagcdn.com/w20/uy.png" width="20" alt="Uruguay"> Uruguay | 3.64% | H |

**Most Likely Champion**: <img src="https://flagcdn.com/w20/br.png" width="20" alt="Brazil"> Brazil  
**Most Likely Final**: <img src="https://flagcdn.com/w20/br.png" width="20" alt="Brazil"> Brazil vs <img src="https://flagcdn.com/w20/de.png" width="20" alt="Germany"> Germany  
**Most Likely Semifinalists**: <img src="https://flagcdn.com/w20/br.png" width="20" alt="Brazil"> Brazil, <img src="https://flagcdn.com/w20/de.png" width="20" alt="Germany"> Germany, <img src="https://flagcdn.com/w20/fr.png" width="20" alt="France"> France, <img src="https://flagcdn.com/w20/ar.png" width="20" alt="Argentina"> Argentina

---

## ⚙️ Setup & Installation

### 🐍 Backend & Model Setup

```bash
# Clone the repository
git clone https://github.com/khanifnaufal/worldcup2026.git
cd worldcup2026

# Create a virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Mac/Linux

# Install dependencies
pip install requests beautifulsoup4 pandas numpy scikit-learn xgboost joblib

# Run the data & simulation pipeline
python scraper/scrape_wikipedia.py
python scraper/scrape_squads.py
python scripts/process_kaggle.py
python scripts/engineer_features.py
python scripts/train_simulate.py

# Sync scraped squads data to frontend
copy data\output\squads.json frontend\src\data\squads.json
```

> **Note**: Make sure to download `results.csv` and `former_names.csv` from [Kaggle](https://www.kaggle.com/datasets/martj42/international-football-results-from-1872-to-2017) and place them in the `data/raw/` directory before running the pipeline.

### ⚛️ Frontend Setup & Run

Once the pipeline generates `simulation_results.json` and `squads.json` is copied, the React dashboard displays it:

```bash
# Navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install

# Run the dashboard locally
npm run dev
```

The app will start on [http://localhost:5173](http://localhost:5173).

---

## 📊 Model Observations

An accuracy of ~52% is **expected** in sports match prediction. Even advanced industry models (such as FiveThirtyEight) typically achieve accuracy rates between 55% and 65%. Key constraints include:
- Limited training data (552 historical World Cup matches).
- Lack of real-time match data (injuries, team lineups, player forms, weather).
- Draws are highly difficult to predict solely from aggregate historical team-level statistics.

However, the simulation output remains **fully aligned with football intuition**, placing strong historical powerhouses (Brazil, Germany, France, Argentina) at the top of the charts.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Scraping | Python, requests, BeautifulSoup4 |
| Data Processing | pandas, numpy |
| Machine Learning | scikit-learn, XGBoost |
| Simulation | Monte Carlo (numpy random) |
| Visualization | React, Recharts, Tailwind CSS (v4), Lucide Icons, FlagCDN |

---

## 👤 Author

**Hazem** — [@khanifnaufal](https://github.com/khanifnaufal)
