# Scripts

Pipeline scripts untuk preprocessing data, feature engineering, training model, dan simulasi turnamen.

## Cara Menjalankan

> ⚠️ **Penting:** Semua script harus dijalankan dari **root project** (`worldcup2026/`), bukan dari dalam folder `scripts/`.

```bash
# Dari root project:
python scripts/process_kaggle.py
python scripts/split_matches.py
python scripts/engineer_features.py
python scripts/train_simulate.py
```

## Urutan Pipeline

| # | Script | Input | Output | Deskripsi |
|---|--------|-------|--------|-----------|
| 1 | `process_kaggle.py` | `data/raw/results.csv`<br>`data/raw/former_names.csv` | `data/raw/all_recent_matches.csv`<br>`data/raw/friendly_matches.csv`<br>`data/raw/competitive_matches.csv` | Memproses dataset Kaggle hasil pertandingan internasional |
| 2 | `split_matches.py` | `data/raw/all_recent_matches.csv` | `data/raw/recent_matches_<team>.csv` | Split data per tim |
| 3 | `engineer_features.py` | `data/raw/all_recent_matches.csv`<br>`data/raw/wc_historical.csv`<br>`data/raw/former_names.csv` | `data/processed/team_features.csv`<br>`data/processed/match_features.csv` | Feature engineering untuk model ML |
| 4 | `train_simulate.py` | `data/processed/match_features.csv`<br>`data/processed/team_features.csv` | `models/best_model.pkl`<br>`data/output/simulation_results.json` | Training model & simulasi WC 2026 |

## Scraper (folder `scraper/`)

| Script | Output | Deskripsi |
|--------|--------|-----------|
| `scraper/scrape_wikipedia.py` | `data/raw/wc_historical.csv` | Scraping data historis WC 1930–2022 dari Wikipedia |
| `scraper/scrape_squads.py` | `data/output/squads.json` | Scraping data squad WC 2026 dari Wikipedia |
