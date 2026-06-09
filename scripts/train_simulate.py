import os
import json
import joblib
import datetime
import numpy as np
import pandas as pd
from collections import Counter
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.model_selection import cross_validate, cross_val_predict
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder

def main():
    # Set random seed for reproducibility
    np.random.seed(42)
    
    # Create directories if they don't exist
    os.makedirs("models", exist_ok=True)
    os.makedirs("data/output", exist_ok=True)
    
    # -------------------------------------------------------------
    # BAGIAN 1 - TRAINING MODEL
    # -------------------------------------------------------------
    
    # 1. Load match_dataset.csv or fallback to match_features.csv
    match_path = "data/processed/match_dataset.csv"
    if not os.path.exists(match_path):
        match_path = "data/processed/match_features.csv"
        
    print(f"Loading match dataset from {match_path}...")
    match_df = pd.read_csv(match_path)
    
    # Feature columns: semua kolom yang berakhiran '_diff'
    feature_cols = [col for col in match_df.columns if col.endswith('_diff')]
    print(f"Found {len(feature_cols)} feature columns ending with '_diff'.")
    
    X = match_df[feature_cols]
    y = match_df['result']
    
    # Print distribusi class
    print("\nClass distribution in target 'result':")
    print(y.value_counts())
    
    # Prepare XGBoost target encoding (1->2, 0->1, -1->0)
    le = LabelEncoder()
    # Fit on [-1, 0, 1] to ensure consistent mapping: -1 -> 0, 0 -> 1, 1 -> 2
    le.fit([-1, 0, 1])
    y_xgb = le.transform(y)
    
    # 2. Train 3 models
    print("\nTraining models...")
    models_dict = {
        'Random Forest': RandomForestClassifier(n_estimators=200, class_weight='balanced', random_state=42),
        'XGBoost': XGBClassifier(n_estimators=200, random_state=42, use_label_encoder=False, eval_metric='mlogloss'),
        'Logistic Regression': LogisticRegression(class_weight='balanced', max_iter=1000, random_state=42)
    }
    
    best_model_name = None
    best_model_score = -1.0
    best_model_instance = None
    best_y_train = None
    
    # 3. Evaluasi tiap model
    for name, model in models_dict.items():
        print(f"\n{'='*40}\nEvaluating model: {name}\n{'='*40}")
        y_train = y_xgb if name == 'XGBoost' else y
        
        # Cross validation 5-fold
        cv_results = cross_validate(model, X, y_train, cv=5, scoring=['accuracy', 'f1_weighted'])
        mean_acc = cv_results['test_accuracy'].mean()
        mean_f1 = cv_results['test_f1_weighted']
        mean_f1_val = mean_f1.mean()
        
        print(f"Cross-Validation 5-Fold Scores for {name}:")
        print(f"  Accuracy: {mean_acc:.4f} (+/- {cv_results['test_accuracy'].std():.4f})")
        print(f"  F1 Weighted: {mean_f1_val:.4f} (+/- {mean_f1.std():.4f})")
        
        # Out-of-fold predictions for report and confusion matrix
        y_pred = cross_val_predict(model, X, y_train, cv=5)
        
        print("\nClassification Report:")
        print(classification_report(y_train, y_pred, target_names=['away_win', 'draw', 'home_win']))
        
        print("Confusion Matrix:")
        print(confusion_matrix(y_train, y_pred))
        
        # Track the best model based on F1 Weighted
        if mean_f1_val > best_model_score:
            best_model_score = mean_f1_val
            best_model_name = name
            best_model_instance = model
            best_y_train = y_train

    # 4. Pilih model terbaik dan simpan
    print(f"\nBest model selected: {best_model_name} with F1 Weighted CV score of {best_model_score:.4f}")
    
    # Retrain on the entire dataset
    print(f"Retraining {best_model_name} on the entire dataset...")
    best_model_instance.fit(X, best_y_train)
    
    # Save model
    joblib.dump(best_model_instance, "models/best_model.pkl")
    print("Saved best model to models/best_model.pkl")
    
    # Save feature names
    joblib.dump(feature_cols, "models/feature_names.pkl")
    print("Saved feature names to models/feature_names.pkl")
    
    # Save label encoder if XGBoost
    if best_model_name == 'XGBoost':
        joblib.dump(le, "models/label_encoder.pkl")
        print("Saved label encoder to models/label_encoder.pkl")
        
    # 5. Print top 10 feature importance
    print("\nTop 10 Feature Importances:")
    if hasattr(best_model_instance, 'feature_importances_'):
        importances = best_model_instance.feature_importances_
    elif hasattr(best_model_instance, 'coef_'):
        # For multi-class logistic regression, take the mean of absolute values across classes
        importances = np.abs(best_model_instance.coef_).mean(axis=0)
    else:
        importances = np.zeros(len(feature_cols))
        
    feat_importances = pd.Series(importances, index=feature_cols)
    print(feat_importances.nlargest(10))
    
    # Load team features
    team_features_path = "data/processed/team_features.csv"
    print(f"\nLoading team features from {team_features_path}...")
    team_features_df = pd.read_csv(team_features_path)
    
    # Run the simulation
    run_simulation(team_features_df, best_model_instance, feature_cols, best_model_name, best_model_score, n_simulations=10000)

def get_deterministic_goals(t1, t2, outcome, team_features_df):
    home_row = team_features_df[team_features_df['team'] == t1]
    away_row = team_features_df[team_features_df['team'] == t2]
    avg_gf_home = float(home_row['avg_gf'].values[0]) if len(home_row) > 0 else 1.2
    avg_gf_away = float(away_row['avg_gf'].values[0]) if len(away_row) > 0 else 1.2
    avg_gf_home = max(0.1, avg_gf_home) if not np.isnan(avg_gf_home) else 1.2
    avg_gf_away = max(0.1, avg_gf_away) if not np.isnan(avg_gf_away) else 1.2
    
    g_home = int(np.round(avg_gf_home))
    g_away = int(np.round(avg_gf_away))
    
    if outcome == 'home_win':
        if g_home <= g_away:
            g_home = g_away + 1
    elif outcome == 'away_win':
        if g_away <= g_home:
            g_away = g_home + 1
    else:  # draw
        avg_draw = int(np.round((avg_gf_home + avg_gf_away) / 2))
        g_home = avg_draw
        g_away = avg_draw
        
    return g_home, g_away

def generate_most_likely_bracket(groups, team_features_df, model, feature_names):
    # Step 1: Group stage deterministik
    standings = {}
    for group_letter, teams in groups.items():
        for team in teams:
            standings[team] = {
                'points': 0,
                'gf': 0,
                'ga': 0,
                'gd': 0,
                'rank_in_group': 0,
                'group': group_letter
            }
            
    group_stage_matches = {}
    import itertools
    for group_letter, teams in groups.items():
        group_stage_matches[group_letter] = []
        for t1, t2 in itertools.combinations(teams, 2):
            preds = predict_match(t1, t2, team_features_df, model, feature_names)
            p_home = preds['home_win']
            p_draw = preds['draw']
            p_away = preds['away_win']
            
            # Find max prob
            max_prob = max(p_home, p_draw, p_away)
            if max_prob == p_home:
                outcome = 'home_win'
                predicted_winner = t1
            elif max_prob == p_away:
                outcome = 'away_win'
                predicted_winner = t2
            else:
                outcome = 'draw'
                predicted_winner = 'Draw'
                
            # Deterministic goals
            goals_t1, goals_t2 = get_deterministic_goals(t1, t2, outcome, team_features_df)
            
            # Update GF, GA and GD
            standings[t1]['gf'] += goals_t1
            standings[t1]['ga'] += goals_t2
            standings[t1]['gd'] = standings[t1]['gf'] - standings[t1]['ga']
            
            standings[t2]['gf'] += goals_t2
            standings[t2]['ga'] += goals_t1
            standings[t2]['gd'] = standings[t2]['gf'] - standings[t2]['ga']
            
            # Update Points
            if outcome == 'home_win':
                standings[t1]['points'] += 3
            elif outcome == 'draw':
                standings[t1]['points'] += 1
                standings[t2]['points'] += 1
            else:
                standings[t2]['points'] += 3
                
            group_stage_matches[group_letter].append({
                "home": t1,
                "away": t2,
                "home_win_prob": p_home,
                "draw_prob": p_draw,
                "away_win_prob": p_away,
                "predicted_winner": predicted_winner
            })
            
        # Rank teams in this group
        group_standings = []
        for t in teams:
            group_standings.append({
                'team': t,
                'points': standings[t]['points'],
                'gd': standings[t]['gd'],
                'gf': standings[t]['gf']
            })
        group_standings.sort(key=lambda x: (x['points'], x['gd'], x['gf']), reverse=True)
        for rank_idx, team_data in enumerate(group_standings):
            standings[team_data['team']]['rank_in_group'] = rank_idx + 1

    # Get qualified teams
    qualified_32_info = []
    for team, info in standings.items():
        if info['rank_in_group'] <= 2:
            qualified_32_info.append({
                'team': team,
                'group': info['group'],
                'rank': info['rank_in_group']
            })
    best_3rd = get_best_third_place(standings)
    qualified_32_info.extend(best_3rd)

    # Extract winners and runners-up
    winners = {}
    runners_up = {}
    for team, stats in standings.items():
        if stats['rank_in_group'] == 1:
            winners[stats['group']] = team
        elif stats['rank_in_group'] == 2:
            runners_up[stats['group']] = team
            
    qualified_3rd_info = [(t['team'], t['group']) for t in qualified_32_info if standings[t['team']]['rank_in_group'] == 3]
    third_place_assignments = match_third_places(qualified_3rd_info)

    # Knockout stage pairings
    r32_pairings = [
        (runners_up['A'], runners_up['B']),
        (winners['C'], runners_up['F']),
        (winners['E'], third_place_assignments['E']),
        (winners['F'], runners_up['C']),
        (runners_up['E'], runners_up['I']),
        (winners['I'], third_place_assignments['I']),
        (winners['A'], third_place_assignments['A']),
        (winners['L'], third_place_assignments['L']),
        (winners['G'], third_place_assignments['G']),
        (winners['D'], third_place_assignments['D']),
        (winners['H'], runners_up['J']),
        (runners_up['K'], runners_up['L']),
        (winners['B'], third_place_assignments['B']),
        (runners_up['D'], runners_up['G']),
        (winners['J'], runners_up['H']),
        (winners['K'], third_place_assignments['K'])
    ]

    def simulate_deterministic_knockout_match(t1, t2, match_id):
        preds = predict_match(t1, t2, team_features_df, model, feature_names)
        p_home = preds['home_win']
        p_draw = preds['draw']
        p_away = preds['away_win']
        
        max_prob = max(p_home, p_draw, p_away)
        if max_prob == p_home:
            winner = t1
        elif max_prob == p_away:
            winner = t2
        else:
            winner = t1  # Tiebreak: home team wins
            
        return {
            "match_id": match_id,
            "home": t1,
            "away": t2,
            "home_win_prob": p_home,
            "draw_prob": p_draw,
            "away_win_prob": p_away,
            "predicted_winner": winner
        }

    # Simulate R32 (Match 73 to 88)
    r32_results = []
    r32_winners = []
    for idx, (t1, t2) in enumerate(r32_pairings):
        match_id = 73 + idx
        res = simulate_deterministic_knockout_match(t1, t2, match_id)
        r32_results.append(res)
        r32_winners.append(res['predicted_winner'])

    # R16 (Match 89 to 96)
    r16_pairings = [
        (r32_winners[0], r32_winners[2]),
        (r32_winners[1], r32_winners[4]),
        (r32_winners[3], r32_winners[5]),
        (r32_winners[6], r32_winners[7]),
        (r32_winners[10], r32_winners[11]),
        (r32_winners[8], r32_winners[9]),
        (r32_winners[13], r32_winners[15]),
        (r32_winners[12], r32_winners[14])
    ]
    r16_results = []
    r16_winners = []
    for idx, (t1, t2) in enumerate(r16_pairings):
        match_id = 89 + idx
        res = simulate_deterministic_knockout_match(t1, t2, match_id)
        r16_results.append(res)
        r16_winners.append(res['predicted_winner'])

    # QF (Match 97 to 100)
    qf_pairings = [
        (r16_winners[0], r16_winners[1]),
        (r16_winners[2], r16_winners[3]),
        (r16_winners[4], r16_winners[5]),
        (r16_winners[6], r16_winners[7])
    ]
    qf_results = []
    qf_winners = []
    for idx, (t1, t2) in enumerate(qf_pairings):
        match_id = 97 + idx
        res = simulate_deterministic_knockout_match(t1, t2, match_id)
        qf_results.append(res)
        qf_winners.append(res['predicted_winner'])

    # SF (Match 101 to 102)
    sf_pairings = [
        (qf_winners[0], qf_winners[1]),
        (qf_winners[2], qf_winners[3])
    ]
    sf_results = []
    sf_winners = []
    for idx, (t1, t2) in enumerate(sf_pairings):
        match_id = 101 + idx
        res = simulate_deterministic_knockout_match(t1, t2, match_id)
        sf_results.append(res)
        sf_winners.append(res['predicted_winner'])

    # Final (Match 104)
    final_res = simulate_deterministic_knockout_match(sf_winners[0], sf_winners[1], 104)

    return {
        "group_stage": group_stage_matches,
        "r32": r32_results,
        "r16": r16_results,
        "qf": qf_results,
        "sf": sf_results,
        "final": final_res
    }

# -------------------------------------------------------------
# BAGIAN 2 - FUNGSI PREDIKSI
# -------------------------------------------------------------

def predict_match(home_team, away_team, team_features_df, model, feature_names):
    # Verify if teams exist
    if home_team not in team_features_df['team'].values or away_team not in team_features_df['team'].values:
        # print(f"Warning: One of the teams ({home_team} or {away_team}) not found in team features. Returning flat probabilities.")
        return {'home_win': 0.3333, 'draw': 0.3334, 'away_win': 0.3333}
        
    # Ambil fitur kedua tim dari team_features_df
    home_feats = team_features_df[team_features_df['team'] == home_team].iloc[0]
    away_feats = team_features_df[team_features_df['team'] == away_team].iloc[0]
    
    # Hitung diff = home_features - away_features untuk semua fitur
    diff_dict = {}
    for f_name in feature_names:
        base_col = f_name.replace('_diff', '')
        diff_dict[f_name] = [float(home_feats[base_col]) - float(away_feats[base_col])]
        
    diff_df = pd.DataFrame(diff_dict)
    
    # Predict probabilities
    probs = model.predict_proba(diff_df)[0]
    class_to_prob = dict(zip(model.classes_, probs))
    
    # Handle mappings based on classes (XGBoost classes: 0, 1, 2 vs RF/LR: -1, 0, 1)
    if 2 in class_to_prob:  # XGBoost encoded labels
        p_away = class_to_prob.get(0, 0.3333)
        p_draw = class_to_prob.get(1, 0.3334)
        p_home = class_to_prob.get(2, 0.3333)
    else:  # RF/LR raw labels
        p_away = class_to_prob.get(-1, 0.3333)
        p_draw = class_to_prob.get(0, 0.3334)
        p_home = class_to_prob.get(1, 0.3333)
        
    return {'home_win': float(p_home), 'draw': float(p_draw), 'away_win': float(p_away)}

# -------------------------------------------------------------
# BAGIAN 3 - SIMULASI TOURNAMENT
# -------------------------------------------------------------

def sample_goals_matching_outcome(home_team, away_team, outcome, team_features_df):
    home_row = team_features_df[team_features_df['team'] == home_team]
    away_row = team_features_df[team_features_df['team'] == away_team]
    
    avg_gf_home = float(home_row['avg_gf'].values[0]) if len(home_row) > 0 else 1.2
    avg_gf_away = float(away_row['avg_gf'].values[0]) if len(away_row) > 0 else 1.2
    
    # Ensure values are positive floats
    avg_gf_home = max(0.1, avg_gf_home) if not np.isnan(avg_gf_home) else 1.2
    avg_gf_away = max(0.1, avg_gf_away) if not np.isnan(avg_gf_away) else 1.2
    
    for _ in range(100):
        g_home = np.random.poisson(avg_gf_home)
        g_away = np.random.poisson(avg_gf_away)
        if outcome == 'home_win' and g_home > g_away:
            return g_home, g_away
        elif outcome == 'draw' and g_home == g_away:
            return g_home, g_away
        elif outcome == 'away_win' and g_home < g_away:
            return g_home, g_away
            
    # Fallback if matching goals not sampled
    if outcome == 'home_win':
        return 1, 0
    elif outcome == 'draw':
        return 1, 1
    else:
        return 0, 1

def simulate_group_stage(groups, team_features_df, model, feature_names):
    # Initialize standings dictionary
    standings = {}
    for group_letter, teams in groups.items():
        for team in teams:
            standings[team] = {
                'points': 0,
                'gf': 0,
                'ga': 0,
                'gd': 0,
                'rank_in_group': 0,
                'group': group_letter
            }
            
    # Simulate matches for each group (Round Robin)
    import itertools
    for group_letter, teams in groups.items():
        for t1, t2 in itertools.combinations(teams, 2):
            # Predict outcome probabilities
            preds = predict_match(t1, t2, team_features_df, model, feature_names)
            
            # Sample match outcome
            outcome = np.random.choice(
                ['home_win', 'draw', 'away_win'], 
                p=[preds['home_win'], preds['draw'], preds['away_win']]
            )
            
            # Sample goals matching the outcome
            goals_t1, goals_t2 = sample_goals_matching_outcome(t1, t2, outcome, team_features_df)
            
            # Update GF, GA and GD
            standings[t1]['gf'] += goals_t1
            standings[t1]['ga'] += goals_t2
            standings[t1]['gd'] = standings[t1]['gf'] - standings[t1]['ga']
            
            standings[t2]['gf'] += goals_t2
            standings[t2]['ga'] += goals_t1
            standings[t2]['gd'] = standings[t2]['gf'] - standings[t2]['ga']
            
            # Update Points
            if outcome == 'home_win':
                standings[t1]['points'] += 3
            elif outcome == 'draw':
                standings[t1]['points'] += 1
                standings[t2]['points'] += 1
            else:
                standings[t2]['points'] += 3
                
        # Rank teams in this group
        group_teams = teams
        group_standings = []
        for t in group_teams:
            group_standings.append({
                'team': t,
                'points': standings[t]['points'],
                'gd': standings[t]['gd'],
                'gf': standings[t]['gf']
            })
            
        # Sort based on: points -> gd -> gf
        group_standings.sort(key=lambda x: (x['points'], x['gd'], x['gf']), reverse=True)
        
        # Assign rank back to standings
        for rank_idx, team_data in enumerate(group_standings):
            standings[team_data['team']]['rank_in_group'] = rank_idx + 1
            
    return standings

def get_best_third_place(group_standings):
    # Collect all teams that finished 3rd in their groups
    third_placed_teams = []
    for team, stats in group_standings.items():
        if stats['rank_in_group'] == 3:
            third_placed_teams.append({
                'team': team,
                'points': stats['points'],
                'gd': stats['gd'],
                'gf': stats['gf'],
                'group': stats['group']
            })
            
    # Sort them by: points -> gd -> gf
    third_placed_teams.sort(key=lambda x: (x['points'], x['gd'], x['gf']), reverse=True)
    
    # Return the top 8
    return third_placed_teams[:8]

def match_third_places(qualified_3rd_teams):
    # Map the 8 best third-placed teams to group winners (Winner E, I, A, L, G, D, B, K)
    # Using backtracking search under FIFA group restrictions
    winners = ['E', 'I', 'A', 'L', 'G', 'D', 'B', 'K']
    allowed_groups = {
        'E': {'A', 'B', 'C', 'D', 'F'},
        'I': {'C', 'D', 'F', 'G', 'H'},
        'A': {'C', 'E', 'F', 'H', 'I'},
        'L': {'E', 'H', 'I', 'J', 'K'},
        'G': {'A', 'E', 'H', 'I', 'J'},
        'D': {'B', 'E', 'F', 'I', 'J'},
        'B': {'E', 'F', 'G', 'I', 'J'},
        'K': {'D', 'E', 'I', 'J', 'L'}
    }
    
    assignment = {}
    used_teams = set()
    
    def backtrack(winner_idx):
        if winner_idx == len(winners):
            return True
        w_group = winners[winner_idx]
        for team_name, t_group in qualified_3rd_teams:
            if team_name not in used_teams:
                if t_group in allowed_groups[w_group]:
                    assignment[w_group] = team_name
                    used_teams.add(team_name)
                    if backtrack(winner_idx + 1):
                        return True
                    used_teams.remove(team_name)
                    del assignment[w_group]
        return False
        
    if backtrack(0):
        return assignment
    else:
        # Fallback if no valid assignment exists (should not happen, but safe)
        for idx, w_group in enumerate(winners):
            assignment[w_group] = qualified_3rd_teams[idx][0]
        return assignment

def simulate_knockout_match(team1, team2, team_features_df, model, feature_names):
    # First 90 minutes
    preds = predict_match(team1, team2, team_features_df, model, feature_names)
    outcome = np.random.choice(
        ['home_win', 'draw', 'away_win'], 
        p=[preds['home_win'], preds['draw'], preds['away_win']]
    )
    
    if outcome == 'home_win':
        return team1
    elif outcome == 'away_win':
        return team2
    else:
        # Extra time: predict again
        preds_et = predict_match(team1, team2, team_features_df, model, feature_names)
        outcome_et = np.random.choice(
            ['home_win', 'draw', 'away_win'], 
            p=[preds_et['home_win'], preds_et['draw'], preds_et['away_win']]
        )
        if outcome_et == 'home_win':
            return team1
        elif outcome_et == 'away_win':
            return team2
        else:
            # Penalty shootout: 50/50
            return np.random.choice([team1, team2])

def simulate_knockout(qualified_32, group_standings, model, feature_names, team_features_df):
    # Extract winners and runners-up from standings
    winners = {}
    runners_up = {}
    for team, stats in group_standings.items():
        if stats['rank_in_group'] == 1:
            winners[stats['group']] = team
        elif stats['rank_in_group'] == 2:
            runners_up[stats['group']] = team
            
    # Get third place assignments
    qualified_3rd_info = [(t['team'], t['group']) for t in qualified_32 if group_standings[t['team']]['rank_in_group'] == 3]
    third_place_assignments = match_third_places(qualified_3rd_info)
    
    # 1. Round of 32 Pairings (Official FIFA WC 2026 Bracket layout)
    # Match 73 to 88
    r32_pairings = [
        (runners_up['A'], runners_up['B']),                               # Match 73 (0)
        (winners['C'], runners_up['F']),                                  # Match 74 (1)
        (winners['E'], third_place_assignments['E']),                     # Match 75 (2)
        (winners['F'], runners_up['C']),                                  # Match 76 (3)
        (runners_up['E'], runners_up['I']),                               # Match 77 (4)
        (winners['I'], third_place_assignments['I']),                     # Match 78 (5)
        (winners['A'], third_place_assignments['A']),                     # Match 79 (6)
        (winners['L'], third_place_assignments['L']),                     # Match 80 (7)
        (winners['G'], third_place_assignments['G']),                     # Match 81 (8)
        (winners['D'], third_place_assignments['D']),                     # Match 82 (9)
        (winners['H'], runners_up['J']),                                  # Match 83 (10)
        (runners_up['K'], runners_up['L']),                               # Match 84 (11)
        (winners['B'], third_place_assignments['B']),                     # Match 85 (12)
        (runners_up['D'], runners_up['G']),                               # Match 86 (13)
        (winners['J'], runners_up['H']),                                  # Match 87 (14)
        (winners['K'], third_place_assignments['K'])                      # Match 88 (15)
    ]
    
    # Simulate Round of 32
    r32_winners = [simulate_knockout_match(t1, t2, team_features_df, model, feature_names) for t1, t2 in r32_pairings]
    
    # 2. Round of 16 Pairings (Match 89 to 96)
    r16_pairings = [
        (r32_winners[0], r32_winners[2]),                                 # Match 89 (0)
        (r32_winners[1], r32_winners[4]),                                 # Match 90 (1)
        (r32_winners[3], r32_winners[5]),                                 # Match 91 (2)
        (r32_winners[6], r32_winners[7]),                                 # Match 92 (3)
        (r32_winners[10], r32_winners[11]),                               # Match 93 (4)
        (r32_winners[8], r32_winners[9]),                                 # Match 94 (5)
        (r32_winners[13], r32_winners[15]),                               # Match 95 (6)
        (r32_winners[12], r32_winners[14])                                # Match 96 (7)
    ]
    
    # Simulate Round of 16
    r16_winners = [simulate_knockout_match(t1, t2, team_features_df, model, feature_names) for t1, t2 in r16_pairings]
    
    # 3. Quarterfinals (Match 97 to 100)
    qf_pairings = [
        (r16_winners[0], r16_winners[1]),                                 # Match 97 (0)
        (r16_winners[2], r16_winners[3]),                                 # Match 98 (1)
        (r16_winners[4], r16_winners[5]),                                 # Match 99 (2)
        (r16_winners[6], r16_winners[7])                                  # Match 100 (3)
    ]
    
    # Simulate Quarterfinals
    qf_winners = [simulate_knockout_match(t1, t2, team_features_df, model, feature_names) for t1, t2 in qf_pairings]
    
    # 4. Semifinals (Match 101 to 102)
    sf_pairings = [
        (qf_winners[0], qf_winners[1]),                                   # Match 101 (0)
        (qf_winners[2], qf_winners[3])                                    # Match 102 (1)
    ]
    
    # Simulate Semifinals
    sf_winners = [simulate_knockout_match(t1, t2, team_features_df, model, feature_names) for t1, t2 in sf_pairings]
    
    # 5. Final & Third-Place Match
    champion = simulate_knockout_match(sf_winners[0], sf_winners[1], team_features_df, model, feature_names)
    
    return {
        'qualified_32': [t['team'] for t in qualified_32],
        'r32_pairings': r32_pairings,
        'r16_pairings': r16_pairings,
        'r16_winners': r16_winners,
        'qf_pairings': qf_pairings,
        'qf_winners': qf_winners,
        'sf_pairings': sf_pairings,
        'sf_winners': sf_winners,
        'final_pairing': (sf_winners[0], sf_winners[1]),
        'champion': champion
    }

def run_simulation(team_features_df, model, feature_names, model_name, model_f1, n_simulations=10000):
    groups = {
        'A': ['Mexico', 'South Africa', 'South Korea', 'Czechia'],
        'B': ['Canada', 'Bosnia and Herzegovina', 'Qatar', 'Switzerland'],
        'C': ['Brazil', 'Morocco', 'Haiti', 'Scotland'],
        'D': ['United States', 'Paraguay', 'Australia', 'Turkey'],
        'E': ['Germany', 'Curacao', 'Ivory Coast', 'Ecuador'],
        'F': ['Netherlands', 'Japan', 'Sweden', 'Tunisia'],
        'G': ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
        'H': ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'],
        'I': ['France', 'Senegal', 'Iraq', 'Norway'],
        'J': ['Argentina', 'Algeria', 'Austria', 'Jordan'],
        'K': ['Portugal', 'DR Congo', 'Uzbekistan', 'Colombia'],
        'L': ['England', 'Croatia', 'Ghana', 'Panama']
    }
    
    # Map teams to groups
    team_to_group = {}
    for g_letter, teams in groups.items():
        for t in teams:
            team_to_group[t] = g_letter
            
    # Initialize trackers
    # For each team, track counts for each stage
    stats = {}
    for g_letter, teams in groups.items():
        for t in teams:
            stats[t] = {
                'group_qualify_count': 0,
                'r32_count': 0,
                'r16_count': 0,
                'qf_count': 0,
                'sf_count': 0,
                'final_count': 0,
                'champion_count': 0
            }
            
    # Track opponents per round per team
    path_tracker = {team: {
        'r32_opponents': [],
        'r16_opponents': [],
        'qf_opponents': [],
        'sf_opponents': [],
        'final_opponents': []
    } for team in stats.keys()}
            
    print(f"\nRunning {n_simulations} tournament simulations...")
    
    for sim_idx in range(1, n_simulations + 1):
        # Print progress
        if sim_idx % 1000 == 0:
            print(f"  Simulated {sim_idx}/{n_simulations} tournaments...")
            
        # 1. Simulate Group Stage
        group_standings = simulate_group_stage(groups, team_features_df, model, feature_names)
        
        # 2. Get qualifiers (top 2 from each group + 8 best 3rd placed teams)
        qualified_32_info = []
        for team, info in group_standings.items():
            if info['rank_in_group'] <= 2:
                qualified_32_info.append({
                    'team': team,
                    'group': info['group'],
                    'rank': info['rank_in_group']
                })
                
        # Best third place
        best_3rd = get_best_third_place(group_standings)
        qualified_32_info.extend(best_3rd)
        
        # 3. Simulate Knockout Stage
        knockout_results = simulate_knockout(qualified_32_info, group_standings, model, feature_names, team_features_df)
        
        # Track opponents per round
        qualified_32_set = set(knockout_results['qualified_32'])
        
        # R32 opponents
        for t1, t2 in knockout_results['r32_pairings']:
            if t1 in path_tracker:
                path_tracker[t1]['r32_opponents'].append(t2)
            if t2 in path_tracker:
                path_tracker[t2]['r32_opponents'].append(t1)
                
        # R16 opponents
        for t1, t2 in knockout_results['r16_pairings']:
            if t1 in path_tracker:
                path_tracker[t1]['r16_opponents'].append(t2)
            if t2 in path_tracker:
                path_tracker[t2]['r16_opponents'].append(t1)
                
        # QF opponents
        for t1, t2 in knockout_results['qf_pairings']:
            if t1 in path_tracker:
                path_tracker[t1]['qf_opponents'].append(t2)
            if t2 in path_tracker:
                path_tracker[t2]['qf_opponents'].append(t1)
                
        # SF opponents
        for t1, t2 in knockout_results['sf_pairings']:
            if t1 in path_tracker:
                path_tracker[t1]['sf_opponents'].append(t2)
            if t2 in path_tracker:
                path_tracker[t2]['sf_opponents'].append(t1)
                
        # Final opponents
        t1, t2 = knockout_results['final_pairing']
        if t1 in path_tracker:
            path_tracker[t1]['final_opponents'].append(t2)
        if t2 in path_tracker:
            path_tracker[t2]['final_opponents'].append(t1)
        
        # 4. Update Stats
        # Group qualifiers (they all play in R32)
        for t in knockout_results['qualified_32']:
            stats[t]['group_qualify_count'] += 1
            stats[t]['r32_count'] += 1
            
        # R16 winners
        for t in knockout_results['r16_winners']:
            stats[t]['r16_count'] += 1
            
        # QF winners
        for t in knockout_results['qf_winners']:
            stats[t]['qf_count'] += 1
            
        # SF winners
        for t in knockout_results['sf_winners']:
            stats[t]['sf_count'] += 1
            
        # Finalists (the 2 teams in the Final)
        # sf_winners contains the two teams that reached the final
        for t in knockout_results['sf_winners']:
            stats[t]['final_count'] += 1
            
        # Champion
        stats[knockout_results['champion']]['champion_count'] += 1

    # Calculate rates and format team results
    team_results = {}
    for team, counts in stats.items():
        team_results[team] = {
            'group': team_to_group[team],
            'champion_rate': counts['champion_count'] / n_simulations,
            'final_rate': counts['final_count'] / n_simulations,
            'sf_rate': counts['sf_count'] / n_simulations,
            'qf_rate': counts['qf_count'] / n_simulations,
            'r16_rate': counts['r16_count'] / n_simulations,
            'r32_rate': counts['r32_count'] / n_simulations,
            'group_qualify_rate': counts['group_qualify_count'] / n_simulations
        }
        
    # Build most_likely_path for each team
    for team in stats.keys():
        group_letter = team_to_group[team]
        group_opponents = [t for t in groups[group_letter] if t != team]
        
        path = [
            {
                "round": "Group Stage",
                "opponents": group_opponents,
                "qualify_rate": float(team_results[team]['group_qualify_rate'])
            }
        ]
        
        rounds_info = [
            ("R32", "r32_opponents", "r32_rate"),
            ("R16", "r16_opponents", "r16_rate"),
            ("QF", "qf_opponents", "qf_rate"),
            ("SF", "sf_opponents", "sf_rate"),
            ("Final", "final_opponents", "final_rate")
        ]
        
        for round_name, tracker_key, rate_key in rounds_info:
            reach_rate = team_results[team][rate_key]
            if reach_rate > 0:
                opp_list = path_tracker[team][tracker_key]
                if opp_list:
                    counter = Counter(opp_list)
                    most_likely_opponent = counter.most_common(1)[0][0]
                else:
                    most_likely_opponent = "None"
                    
                path.append({
                    "round": round_name,
                    "most_likely_opponent": most_likely_opponent,
                    "reach_rate": float(reach_rate)
                })
                
        team_results[team]['most_likely_path'] = path
        
    # Get most likely champion, finalists and semifinalists
    sorted_by_champion = sorted(team_results.items(), key=lambda x: x[1]['champion_rate'], reverse=True)
    sorted_by_finalist = sorted(team_results.items(), key=lambda x: x[1]['final_rate'], reverse=True)
    sorted_by_sf = sorted(team_results.items(), key=lambda x: x[1]['sf_rate'], reverse=True)
    
    most_likely_champion = sorted_by_champion[0][0]
    most_likely_finalist = [sorted_by_finalist[0][0], sorted_by_finalist[1][0]]
    most_likely_semifinalists = [sorted_by_sf[0][0], sorted_by_sf[1][0], sorted_by_sf[2][0], sorted_by_sf[3][0]]
    
    # -------------------------------------------------------------
    # BAGIAN 4 - OUTPUT
    # -------------------------------------------------------------
    
    # Generate most likely bracket
    bracket_res = generate_most_likely_bracket(groups, team_features_df, model, feature_names)

    output_json = {
        'metadata': {
            'n_simulations': n_simulations,
            'model_used': model_name,
            'model_f1_score': float(model_f1),
            'generated_at': datetime.datetime.utcnow().isoformat() + 'Z'
        },
        'teams': team_results,
        'most_likely_champion': most_likely_champion,
        'most_likely_finalist': most_likely_finalist,
        'most_likely_semifinalists': most_likely_semifinalists,
        'bracket': bracket_res
    }
    
    output_path = "data/output/simulation_results.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_json, f, indent=2)
        
    print(f"\nSaved simulation results to {output_path}")
    
    # Print summary reports
    print("\n" + "="*50)
    print("SIMULATION SUMMARY")
    print("="*50)
    print(f"Top 10 Teams by Champion Rate:")
    for rank, (team, data) in enumerate(sorted_by_champion[:10], 1):
        print(f"  {rank}. {team}: {data['champion_rate']*100:.2f}%")
        
    print(f"\nTop 10 Teams by Finalist Rate:")
    for rank, (team, data) in enumerate(sorted_by_finalist[:10], 1):
        print(f"  {rank}. {team}: {data['final_rate']*100:.2f}%")
        
    print(f"\nModel Used: {model_name}")
    print(f"Model F1-Weighted Cross-Validation Score: {model_f1:.4f}")
    print("="*50)

if __name__ == "__main__":
    main()
