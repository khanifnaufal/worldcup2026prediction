import os
import pandas as pd

def main():
    combined_file = "data/raw/all_recent_matches.csv"
    if not os.path.exists(combined_file):
        print(f"[ERROR] Combined file '{combined_file}' not found.")
        print("Please ensure you have moved the downloaded file to 'data/raw/all_recent_matches.csv'.")
        return
        
    print(f"Reading {combined_file}...")
    df = pd.read_csv(combined_file)
    
    # Ensure nullable integer format for gf/ga and float format for xG
    df['gf'] = df['gf'].astype('Int64')
    df['ga'] = df['ga'].astype('Int64')
    
    # Group by team and save individual CSV files
    teams = df['team'].unique()
    print(f"Found matches for {len(teams)} teams. Splitting...")
    
    for team in teams:
        df_team = df[df['team'] == team].copy()
        
        # Safe filename normalization
        # replacing spaces with underscores, ç with c, and ü with u
        team_file_name = team.replace(" ", "_").replace("ç", "c").replace("ü", "u")
        team_output_path = f"data/raw/recent_matches_{team_file_name}.csv"
        
        df_team.to_csv(team_output_path, index=False, encoding="utf-8")
        print(f"  Saved {len(df_team)} matches for {team} to {team_output_path}.")
        
    print("\nSplitting complete! All files saved successfully.")

if __name__ == "__main__":
    main()
