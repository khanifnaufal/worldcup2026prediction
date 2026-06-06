import os
import pandas as pd
import numpy as np

def main():
    # Define paths
    results_path = "data/raw/results.csv"
    former_names_path = "data/raw/former_names.csv"
    
    # 48 World Cup 2026 teams
    wc_2026_teams = [
        "Canada", "Mexico", "United States", "Australia", "Iran", "Iraq", "Japan",
        "Jordan", "Qatar", "Saudi Arabia", "South Korea", "Uzbekistan", "Algeria",
        "Cape Verde", "DR Congo", "Egypt", "Ghana", "Ivory Coast", "Morocco",
        "Senegal", "South Africa", "Tunisia", "Curacao", "Haiti", "Panama",
        "Argentina", "Brazil", "Colombia", "Ecuador", "Paraguay", "Uruguay",
        "New Zealand", "Austria", "Belgium", "Bosnia and Herzegovina", "Croatia",
        "Czechia", "England", "France", "Germany", "Netherlands", "Norway",
        "Portugal", "Scotland", "Spain", "Sweden", "Switzerland", "Turkey"
    ]
    wc_set = set(wc_2026_teams)

    # 1. Load datasets
    print("Loading datasets...")
    if not os.path.exists(results_path):
        print(f"[ERROR] results.csv not found at {results_path}")
        return
    if not os.path.exists(former_names_path):
        print(f"[ERROR] former_names.csv not found at {former_names_path}")
        return

    df = pd.read_csv(results_path)
    former_df = pd.read_csv(former_names_path)

    # 2. Standardize team names
    print("Standardizing team names...")
    # Map former names to current names using the CSV file
    name_mapping = dict(zip(former_df['former'], former_df['current']))
    
    # Apply former names mapping first
    df['home_team'] = df['home_team'].replace(name_mapping)
    df['away_team'] = df['away_team'].replace(name_mapping)

    # Manual mapping for common variations and WC 2026 list consistency
    manual_mapping = {
        "IR Iran": "Iran",
        "Korea Republic": "South Korea",
        "Republic of Ireland": "Ireland",
        "Türkiye": "Turkey",
        "Congo DR": "DR Congo",
        "Cote d'Ivoire": "Ivory Coast",
        "USA": "United States",
        "Czech Republic": "Czechia",
        "Curaçao": "Curacao"
    }
    df['home_team'] = df['home_team'].replace(manual_mapping)
    df['away_team'] = df['away_team'].replace(manual_mapping)

    # 3. Filter data
    print("Filtering data...")
    # Filter date range: 2018-01-01 to 2025-12-31 inclusive
    df = df[(df['date'] >= '2018-01-01') & (df['date'] <= '2025-12-31')]

    # Drop rows with null/empty scores
    df = df.dropna(subset=['home_score', 'away_score'])

    # Keep matches involving at least one WC 2026 team
    df = df[df['home_team'].isin(wc_set) | df['away_team'].isin(wc_set)]

    # 4. Transform to per-team format (2 rows per match: home and away perspectives)
    print("Transforming matches to per-team perspective...")
    # Determine venue based on neutral column
    is_neutral = df['neutral'].astype(bool)
    home_venue = np.where(is_neutral, 'neutral', 'home')
    away_venue = np.where(is_neutral, 'neutral', 'away')

    # Determine results (W/D/L)
    home_result = np.select(
        [df['home_score'] > df['away_score'], df['home_score'] == df['away_score']],
        ['W', 'D'],
        default='L'
    )
    away_result = np.select(
        [df['away_score'] > df['home_score'], df['away_score'] == df['home_score']],
        ['W', 'D'],
        default='L'
    )

    # Build home and away dataframes
    home_perspective = pd.DataFrame({
        'team': df['home_team'],
        'date': df['date'],
        'competition': df['tournament'],
        'opponent': df['away_team'],
        'venue': home_venue,
        'result': home_result,
        'gf': df['home_score'].astype(int),
        'ga': df['away_score'].astype(int),
        'is_friendly': df['tournament'] == 'Friendly'
    })

    away_perspective = pd.DataFrame({
        'team': df['away_team'],
        'date': df['date'],
        'competition': df['tournament'],
        'opponent': df['home_team'],
        'venue': away_venue,
        'result': away_result,
        'gf': df['away_score'].astype(int),
        'ga': df['home_score'].astype(int),
        'is_friendly': df['tournament'] == 'Friendly'
    })

    # Combine perspective rows
    combined_df = pd.concat([home_perspective, away_perspective], ignore_index=True)

    # Sort matches chronologically
    combined_df = combined_df.sort_values(by=['date', 'team']).reset_index(drop=True)

    # 5. Save output CSV files
    print("Saving output files...")
    os.makedirs("data/raw", exist_ok=True)
    
    # Save all recent matches
    all_matches_path = "data/raw/all_recent_matches.csv"
    combined_df.to_csv(all_matches_path, index=False, encoding="utf-8")
    
    # Save friendly matches only
    friendly_matches_path = "data/raw/friendly_matches.csv"
    friendly_df = combined_df[combined_df['is_friendly'] == True]
    friendly_df.to_csv(friendly_matches_path, index=False, encoding="utf-8")
    
    # Save competitive matches only
    competitive_matches_path = "data/raw/competitive_matches.csv"
    competitive_df = combined_df[combined_df['is_friendly'] == False]
    competitive_df.to_csv(competitive_matches_path, index=False, encoding="utf-8")

    print(f"Saved {len(combined_df)} rows to {all_matches_path}")
    print(f"Saved {len(friendly_df)} rows to {friendly_matches_path}")
    print(f"Saved {len(competitive_df)} rows to {competitive_matches_path}")

    # 6. Print Summary Statistics
    print("\n" + "="*50)
    print("SUMMARY STATISTICS")
    print("="*50)
    
    # We will print stats specifically for the 48 World Cup 2026 teams
    wc_stats_df = combined_df[combined_df['team'].isin(wc_set)]

    # Total matches per team (sort ascending)
    matches_per_team = wc_stats_df['team'].value_counts().sort_values(ascending=True)
    print("\n--- Total Matches per WC 2026 Team (Sort Ascending) ---")
    for team, count in matches_per_team.items():
        print(f"{team}: {count} matches")

    # Jumlah friendly vs kompetitif per tim
    print("\n--- Friendly vs Competitive Matches per WC 2026 Team ---")
    friendly_counts = wc_stats_df[wc_stats_df['is_friendly'] == True]['team'].value_counts()
    competitive_counts = wc_stats_df[wc_stats_df['is_friendly'] == False]['team'].value_counts()
    
    # Sort teams alphabetically for friendly vs competitive list
    for team in sorted(wc_2026_teams):
        f_count = friendly_counts.get(team, 0)
        c_count = competitive_counts.get(team, 0)
        print(f"{team}: Friendly = {f_count}, Competitive = {c_count}")

    # Tim dengan data paling sedikit (top 5)
    print("\n--- Top 5 WC 2026 Teams with Least Data (Fewest Matches) ---")
    top_5_least = matches_per_team.head(5)
    for team, count in top_5_least.items():
        print(f"{team}: {count} matches")

    # Total keseluruhan rows
    print("\n--- Total Dataset Statistics ---")
    print(f"Total rows in all_recent_matches.csv: {len(combined_df)}")
    print(f"Total rows in friendly_matches.csv: {len(friendly_df)}")
    print(f"Total rows in competitive_matches.csv: {len(competitive_df)}")
    print("="*50)

if __name__ == "__main__":
    main()
