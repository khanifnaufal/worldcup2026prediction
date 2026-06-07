import csv
import json
import os

def main():
    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/processed/team_features.csv"))
    json_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "team_stats.json"))
    
    print(f"Reading from: {csv_path}")
    print(f"Writing to: {json_path}")
    
    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        return

    stats = {}
    with open(csv_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            team = row['team']
            stats[team] = {
                'fifa_rank': int(row['fifa_rank']) if row.get('fifa_rank') else 999,
                'fifa_points': float(row['fifa_points']) if row.get('fifa_points') else 0.0,
                'avg_gf': float(row['avg_gf']) if row.get('avg_gf') else 0.0,
                'avg_ga': float(row['avg_ga']) if row.get('avg_ga') else 0.0,
                'avg_gd': float(row['avg_gd']) if row.get('avg_gd') else 0.0,
                'wc_appearances': int(row['wc_appearances']) if row.get('wc_appearances') else 0,
                'win_rate': float(row['win_rate']) if row.get('win_rate') else 0.0
            }

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2)
    
    print(f"Successfully extracted stats for {len(stats)} teams!")

if __name__ == '__main__':
    main()
