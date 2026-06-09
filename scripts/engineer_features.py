import os
import pandas as pd
import numpy as np

def main():
    # Define paths
    recent_matches_path = "data/raw/all_recent_matches.csv"
    wc_historical_path = "data/raw/wc_historical.csv"
    former_names_path = "data/raw/former_names.csv"
    
    # Target outputs
    team_features_output_path = "data/processed/team_features.csv"
    match_features_output_path = "data/processed/match_features.csv"
    
    # Ensure processed directory exists
    os.makedirs("data/processed", exist_ok=True)

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
    if not os.path.exists(recent_matches_path):
        print(f"[ERROR] {recent_matches_path} not found.")
        return
    if not os.path.exists(wc_historical_path):
        print(f"[ERROR] {wc_historical_path} not found.")
        return
    if not os.path.exists(former_names_path):
        print(f"[ERROR] {former_names_path} not found.")
        return

    all_recent_df = pd.read_csv(recent_matches_path)
    wc_hist_raw = pd.read_csv(wc_historical_path)
    former_df = pd.read_csv(former_names_path)

    # 2. Standardize team names in wc_historical.csv
    print("Standardizing team names in historical World Cup data...")
    name_mapping = dict(zip(former_df['former'], former_df['current']))
    
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
        "Curaçao": "Curacao",
        "Zaire": "DR Congo",
        "West Germany": "Germany"
    }
    
    # Copy and clean wc_historical
    wc_hist = wc_hist_raw.copy()
    wc_hist['home_team'] = wc_hist['home_team'].replace(name_mapping).replace(manual_mapping)
    wc_hist['away_team'] = wc_hist['away_team'].replace(name_mapping).replace(manual_mapping)
    wc_hist = wc_hist.dropna(subset=['home_score', 'away_score'])

    # Determine unique teams in both datasets for comprehensive lookup
    all_teams = set(wc_2026_teams) | set(all_recent_df['team'].unique()) | set(wc_hist['home_team'].unique()) | set(wc_hist['away_team'].unique())
    print(f"Total unique teams to process: {len(all_teams)}")

    # 3. Calculate Team-Level Features from all_recent_matches.csv
    print("Engineering recent match features...")
    recent_features_list = []
    
    for team in all_teams:
        team_recent = all_recent_df[all_recent_df['team'] == team]
        
        if len(team_recent) == 0:
            # Placeholder for teams with no recent match data
            recent_features_list.append({
                'team': team,
                'total_matches': 0, 'win_rate': 0.0, 'draw_rate': 0.0, 'loss_rate': 0.0,
                'avg_gf': 0.0, 'avg_ga': 0.0, 'avg_gd': 0.0,
                'comp_win_rate': 0.0, 'comp_avg_gf': 0.0, 'comp_avg_ga': 0.0,
                'recent_win_rate': 0.0, 'recent_avg_gf': 0.0, 'recent_avg_ga': 0.0,
                'form_score': 0.0,
                'home_win_rate': 0.0, 'away_win_rate': 0.0, 'neutral_win_rate': 0.0
            })
            continue

        # A. Overall recent form
        total_matches = len(team_recent)
        win_rate = (team_recent['result'] == 'W').mean()
        draw_rate = (team_recent['result'] == 'D').mean()
        loss_rate = (team_recent['result'] == 'L').mean()
        avg_gf = team_recent['gf'].mean()
        avg_ga = team_recent['ga'].mean()
        avg_gd = (team_recent['gf'] - team_recent['ga']).mean()

        # B. Competitive only form
        comp_df = team_recent[team_recent['is_friendly'] == False]
        if len(comp_df) > 0:
            comp_win_rate = (comp_df['result'] == 'W').mean()
            comp_avg_gf = comp_df['gf'].mean()
            comp_avg_ga = comp_df['ga'].mean()
        else:
            comp_win_rate, comp_avg_gf, comp_avg_ga = 0.0, 0.0, 0.0

        # C. Recent form weighted (2022-2025)
        recent_df = team_recent[team_recent['date'] >= '2022-01-01']
        if len(recent_df) > 0:
            recent_win_rate = (recent_df['result'] == 'W').mean()
            recent_avg_gf = recent_df['gf'].mean()
            recent_avg_ga = recent_df['ga'].mean()
        else:
            recent_win_rate, recent_avg_gf, recent_avg_ga = 0.0, 0.0, 0.0

        # D. Form score
        p1 = team_recent[(team_recent['date'] >= '2018-01-01') & (team_recent['date'] <= '2020-12-31')]
        p2 = team_recent[(team_recent['date'] >= '2021-01-01') & (team_recent['date'] <= '2022-12-31')]
        p3 = team_recent[(team_recent['date'] >= '2023-01-01') & (team_recent['date'] <= '2025-12-31')]
        
        wr1 = (p1['result'] == 'W').mean() if len(p1) > 0 else None
        wr2 = (p2['result'] == 'W').mean() if len(p2) > 0 else None
        wr3 = (p3['result'] == 'W').mean() if len(p3) > 0 else None
        
        num, den = 0.0, 0.0
        if wr1 is not None:
            num += 0.2 * wr1
            den += 0.2
        if wr2 is not None:
            num += 0.3 * wr2
            den += 0.3
        if wr3 is not None:
            num += 0.5 * wr3
            den += 0.5
        
        form_score = num / den if den > 0 else 0.0

        # E. Home/Away performance
        home_df = team_recent[team_recent['venue'] == 'home']
        away_df = team_recent[team_recent['venue'] == 'away']
        neutral_df = team_recent[team_recent['venue'] == 'neutral']
        
        home_win_rate = (home_df['result'] == 'W').mean() if len(home_df) > 0 else 0.0
        away_win_rate = (away_df['result'] == 'W').mean() if len(away_df) > 0 else 0.0
        neutral_win_rate = (neutral_df['result'] == 'W').mean() if len(neutral_df) > 0 else 0.0

        recent_features_list.append({
            'team': team,
            'total_matches': total_matches,
            'win_rate': win_rate,
            'draw_rate': draw_rate,
            'loss_rate': loss_rate,
            'avg_gf': avg_gf,
            'avg_ga': avg_ga,
            'avg_gd': avg_gd,
            'comp_win_rate': comp_win_rate,
            'comp_avg_gf': comp_avg_gf,
            'comp_avg_ga': comp_avg_ga,
            'recent_win_rate': recent_win_rate,
            'recent_avg_gf': recent_avg_gf,
            'recent_avg_ga': recent_avg_ga,
            'form_score': form_score,
            'home_win_rate': home_win_rate,
            'away_win_rate': away_win_rate,
            'neutral_win_rate': neutral_win_rate
        })

    recent_features_df = pd.DataFrame(recent_features_list)

    # 4. Calculate Historical World Cup Features from wc_historical.csv
    print("Engineering historical World Cup features...")
    # Dynamic tournament stage encoding
    team_year_stages = {}

    # Standardized list of tournament winners
    winner_dict = {
        1930: "Uruguay", 1934: "Italy", 1938: "Italy", 1950: "Uruguay",
        1954: "Germany", 1958: "Brazil", 1962: "Brazil", 1966: "England",
        1970: "Brazil", 1974: "Germany", 1978: "Argentina", 1982: "Italy",
        1986: "Argentina", 1990: "Germany", 1994: "Brazil", 1998: "France",
        2002: "Brazil", 2006: "Italy", 2010: "Spain", 2014: "Germany",
        2018: "France", 2022: "Argentina"
    }

    years = sorted(wc_hist['year'].unique())
    for yr in years:
        df_yr = wc_hist[wc_hist['year'] == yr]
        
        # All teams participating in this year start at group stage (1)
        teams_yr = set(df_yr['home_team'].unique()) | set(df_yr['away_team'].unique())
        for t in teams_yr:
            team_year_stages[(yr, t)] = 1
            
        # 1974 & 1978: Second group stage matches are matches 25-36 (0-indexed 24-35)
        if yr in [1974, 1978]:
            second_group = df_yr.iloc[24:36]
            for _, row in second_group.iterrows():
                team_year_stages[(yr, row['home_team'])] = max(team_year_stages.get((yr, row['home_team']), 1), 3)
                team_year_stages[(yr, row['away_team'])] = max(team_year_stages.get((yr, row['away_team']), 1), 3)
                
        # 1982: Second group stage matches are matches 37-48 (0-indexed 36-47)
        if yr == 1982:
            second_group = df_yr.iloc[36:48]
            for _, row in second_group.iterrows():
                team_year_stages[(yr, row['home_team'])] = max(team_year_stages.get((yr, row['home_team']), 1), 3)
                team_year_stages[(yr, row['away_team'])] = max(team_year_stages.get((yr, row['away_team']), 1), 3)
                
        # 1950: Final round-robin group stage
        if yr == 1950:
            team_year_stages[(1950, 'Uruguay')] = 6
            team_year_stages[(1950, 'Brazil')] = 5
            team_year_stages[(1950, 'Sweden')] = 4
            team_year_stages[(1950, 'Spain')] = 4
            
        # Knockout stage bracket traceback
        ko_yr = df_yr[df_yr['stage'] == 'knockout'].reset_index(drop=True)
        num_ko = len(ko_yr)
        if num_ko > 0:
            for i in range(num_ko):
                # Slice from this match to the end of knockout stage
                sub_ko = ko_yr.iloc[i:]
                unique_teams = set(sub_ko['home_team'].unique()) | set(sub_ko['away_team'].unique())
                n_teams = len(unique_teams)
                
                # Encode stage based on remaining team count in this section of bracket
                if n_teams <= 2:
                    match_stage = 5
                elif n_teams <= 4:
                    match_stage = 4
                elif n_teams <= 8:
                    match_stage = 3
                else:
                    match_stage = 2
                    
                row = ko_yr.iloc[i]
                team_year_stages[(yr, row['home_team'])] = max(team_year_stages.get((yr, row['home_team']), 1), match_stage)
                team_year_stages[(yr, row['away_team'])] = max(team_year_stages.get((yr, row['away_team']), 1), match_stage)
                
        # Overwrite the tournament winner to stage 6
        if yr in winner_dict:
            w_team = winner_dict[yr]
            if (yr, w_team) in team_year_stages:
                team_year_stages[(yr, w_team)] = 6

    # Convert match results to per-team rows to calculate historical stats
    wc_matches_perspectives = []
    for _, row in wc_hist.iterrows():
        h_team = row['home_team']
        a_team = row['away_team']
        h_score = int(row['home_score'])
        a_score = int(row['away_score'])
        yr = row['year']
        
        wc_matches_perspectives.append({
            'team': h_team, 'year': yr, 'gf': h_score, 'ga': a_score,
            'result': 'W' if h_score > a_score else ('D' if h_score == a_score else 'L')
        })
        wc_matches_perspectives.append({
            'team': a_team, 'year': yr, 'gf': a_score, 'ga': h_score,
            'result': 'W' if a_score > h_score else ('D' if a_score == h_score else 'L')
        })

    wc_persp_df = pd.DataFrame(wc_matches_perspectives)
    
    # Calculate historical WC stats per team
    wc_features_list = []
    for team in all_teams:
        team_wc = wc_persp_df[wc_persp_df['team'] == team]
        
        if len(team_wc) == 0:
            # Teams with no historical World Cup appearances
            wc_features_list.append({
                'team': team,
                'wc_appearances': 0, 'wc_win_rate': 0.0,
                'wc_avg_gf': 0.0, 'wc_avg_ga': 0.0,
                'wc_best_stage': 0, 'wc_avg_best_stage': 0.0
            })
            continue
            
        wc_appearances = team_wc['year'].nunique()
        wc_win_rate = (team_wc['result'] == 'W').mean()
        wc_avg_gf = team_wc['gf'].mean()
        wc_avg_ga = team_wc['ga'].mean()
        
        # Best stage and average best stage
        stages = [team_year_stages.get((yr, team), 1) for yr in team_wc['year'].unique()]
        wc_best_stage = max(stages) if stages else 0
        wc_avg_best_stage = np.mean(stages) if stages else 0.0
        
        wc_features_list.append({
            'team': team,
            'wc_appearances': wc_appearances,
            'wc_win_rate': wc_win_rate,
            'wc_avg_gf': wc_avg_gf,
            'wc_avg_ga': wc_avg_ga,
            'wc_best_stage': wc_best_stage,
            'wc_avg_best_stage': wc_avg_best_stage
        })

    wc_features_df = pd.DataFrame(wc_features_list)

    # 5. Merge Features
    print("Merging features...")
    # Add FIFA Ranking info first
    fifa_ranking = {
        "Argentina":              {"rank": 1,  "points": 1874.81},
        "Spain":                  {"rank": 2,  "points": 1873.02},
        "France":                 {"rank": 3,  "points": 1869.43},
        "England":                {"rank": 4,  "points": 1825.97},
        "Portugal":               {"rank": 5,  "points": 1763.83},
        "Brazil":                 {"rank": 6,  "points": 1762.66},
        "Morocco":                {"rank": 7,  "points": 1757.29},
        "Netherlands":            {"rank": 8,  "points": 1751.09},
        "Belgium":                {"rank": 9,  "points": 1739.54},
        "Germany":                {"rank": 10, "points": 1731.30},
        "Croatia":                {"rank": 11, "points": 1712.24},
        "Colombia":               {"rank": 13, "points": 1695.99},
        "Mexico":                 {"rank": 14, "points": 1687.48},
        "Senegal":                {"rank": 15, "points": 1686.41},
        "United States":          {"rank": 16, "points": 1675.71},
        "Uruguay":                {"rank": 17, "points": 1673.07},
        "Japan":                  {"rank": 18, "points": 1661.58},
        "Switzerland":            {"rank": 19, "points": 1650.75},
        "Iran":                   {"rank": 20, "points": 1619.58},
        "Turkey":                 {"rank": 22, "points": 1601.99},
        "Austria":                {"rank": 23, "points": 1597.41},
        "Ecuador":                {"rank": 24, "points": 1596.48},
        "South Korea":            {"rank": 25, "points": 1591.63},
        "Australia":              {"rank": 27, "points": 1578.65},
        "Algeria":                {"rank": 28, "points": 1571.04},
        "Egypt":                  {"rank": 29, "points": 1565.56},
        "Canada":                 {"rank": 30, "points": 1560.61},
        "Norway":                 {"rank": 31, "points": 1555.59},
        "Ivory Coast":            {"rank": 33, "points": 1540.87},
        "Panama":                 {"rank": 34, "points": 1540.59},
        "Scotland":               {"rank": 43, "points": 1499.92},
        "DR Congo":               {"rank": 45, "points": 1479.68},
        "Tunisia":                {"rank": 46, "points": 1479.09},
        "Uzbekistan":             {"rank": 50, "points": 1461.21},
        "Paraguay":               {"rank": 40, "points": 1503.50},
        "Czechia":                {"rank": 39, "points": 1505.74},
        "Sweden":                 {"rank": 38, "points": 1509.79},
        "Ghana":                  {"rank": 55, "points": 1430.00},
        "South Africa":           {"rank": 60, "points": 1410.00},
        "Bosnia and Herzegovina": {"rank": 58, "points": 1420.00},
        "Saudi Arabia":           {"rank": 56, "points": 1425.00},
        "Iraq":                   {"rank": 62, "points": 1400.00},
        "Jordan":                 {"rank": 68, "points": 1370.00},
        "Qatar":                  {"rank": 72, "points": 1350.00},
        "Cape Verde":             {"rank": 75, "points": 1330.00},
        "New Zealand":            {"rank": 95, "points": 1220.00},
        "Haiti":                  {"rank": 105, "points": 1180.00},
        "Curacao":                {"rank": 88, "points": 1250.00},
        # Other teams in match records
        "Italy":                  {"rank": 10, "points": 1720.00},
        "Chile":                  {"rank": 40, "points": 1500.00},
        "Nigeria":                {"rank": 36, "points": 1520.00},
        "Denmark":                {"rank": 21, "points": 1610.00},
        "Russia":                 {"rank": 35, "points": 1515.00},
        "Romania":                {"rank": 47, "points": 1475.00},
        "Ireland":                {"rank": 60, "points": 1410.00},
        "Serbia":                 {"rank": 32, "points": 1530.00},
        "Ukraine":                {"rank": 24, "points": 1590.00},
        "Greece":                 {"rank": 49, "points": 1465.00},
        "Slovakia":               {"rank": 48, "points": 1470.00},
        "Wales":                  {"rank": 29, "points": 1565.00},
        "Iceland":                {"rank": 70, "points": 1360.00},
        "Peru":                   {"rank": 32, "points": 1535.00},
        "North Korea":            {"rank": 110, "points": 1160.00},
        "China PR":               {"rank": 88, "points": 1250.00},
        "Honduras":               {"rank": 78, "points": 1320.00},
        "Trinidad and Tobago":    {"rank": 100, "points": 1200.00},
        "Togo":                   {"rank": 115, "points": 1150.00},
        "Angola":                 {"rank": 85, "points": 1260.00},
        "Slovenia":               {"rank": 54, "points": 1435.00},
        "Yugoslavia":             {"rank": 30, "points": 1550.00},
        "Czechoslovakia":         {"rank": 30, "points": 1550.00},
        "Soviet Union":           {"rank": 30, "points": 1550.00},
        "Bolivia":                {"rank": 85, "points": 1260.00},
        "Costa Rica":             {"rank": 52, "points": 1450.00},
        "United Arab Emirates":   {"rank": 69, "points": 1365.00},
        "Cameroon":               {"rank": 51, "points": 1455.00}
    }
    
    fifa_list = []
    for team in all_teams:
        if team in fifa_ranking:
            fifa_list.append({
                'team': team,
                'fifa_rank': fifa_ranking[team]['rank'],
                'fifa_points': fifa_ranking[team]['points']
            })
        else:
            # Safe default
            fifa_list.append({
                'team': team,
                'fifa_rank': 120,
                'fifa_points': 1150.0
            })
    fifa_df = pd.DataFrame(fifa_list)
    
    features_all_df = pd.merge(recent_features_df, wc_features_df, on='team')
    features_all_df = pd.merge(features_all_df, fifa_df, on='team')

    # Save exactly the 48 World Cup 2026 teams
    team_features_df = features_all_df[features_all_df['team'].isin(wc_2026_teams)].reset_index(drop=True)
    
    # Reorder columns to make 'team' the first column
    feature_cols = [
        'team', 'total_matches', 'win_rate', 'draw_rate', 'loss_rate',
        'avg_gf', 'avg_ga', 'avg_gd', 'comp_win_rate', 'comp_avg_gf',
        'comp_avg_ga', 'recent_win_rate', 'recent_avg_gf', 'recent_avg_ga',
        'form_score', 'home_win_rate', 'away_win_rate', 'neutral_win_rate',
        'wc_appearances', 'wc_win_rate', 'wc_avg_gf', 'wc_avg_ga',
        'wc_best_stage', 'wc_avg_best_stage', 'fifa_rank', 'fifa_points'
    ]
    team_features_df = team_features_df[feature_cols]
    team_features_df.to_csv(team_features_output_path, index=False, encoding="utf-8")
    print(f"Saved team-level features to {team_features_output_path} (shape: {team_features_df.shape})")

    # 6. Build Match-Level Dataset for Model Training (year >= 1990)
    print("Building match-level training dataset...")
    wc_train_matches = wc_hist[wc_hist['year'] >= 1990].reset_index(drop=True)
    
    # We will build diff features: home_team - away_team
    diff_records = []
    
    # Feature columns to calculate difference
    metric_cols = [c for c in feature_cols if c != 'team']
    
    # Create lookup dictionary of all teams' features for fast lookup
    all_features_lookup = features_all_df.set_index('team').to_dict('index')

    # Empty feature vector default in case a historical opponent has no records in features_all_df
    default_features = {col: 0.0 for col in metric_cols}

    for _, row in wc_train_matches.iterrows():
        yr = row['year']
        stage = row['stage']
        h_team = row['home_team']
        a_team = row['away_team']
        h_score = int(row['home_score'])
        a_score = int(row['away_score'])
        
        # Lookup features
        h_feats = all_features_lookup.get(h_team, default_features)
        a_feats = all_features_lookup.get(a_team, default_features)
        
        record = {
            'year': yr,
            'stage': stage,
            'home_team': h_team,
            'away_team': a_team
        }
        
        # Calculate differences (home - away)
        for col in metric_cols:
            record[f"{col}_diff"] = h_feats[col] - a_feats[col]
            
        # Target result: 1 = home win, 0 = draw, -1 = away win
        if h_score > a_score:
            record['result'] = 1
        elif h_score == a_score:
            record['result'] = 0
        else:
            record['result'] = -1
            
        diff_records.append(record)

    match_features_df = pd.DataFrame(diff_records)
    match_features_df.to_csv(match_features_output_path, index=False, encoding="utf-8")
    print(f"Saved match-level training dataset to {match_features_output_path} (shape: {match_features_df.shape})")
    
    print("\nFeature engineering complete! Both files successfully saved.")

if __name__ == "__main__":
    main()
