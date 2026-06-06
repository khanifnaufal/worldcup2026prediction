import os
import re
import time
import requests
import pandas as pd
from bs4 import BeautifulSoup

# Define tournament years (1930 to 2022, excluding 1942 and 1946 due to WWII)
YEARS = [
    1930, 1934, 1938, 1950, 1954, 1958, 1962, 1966, 1970, 1974,
    1978, 1982, 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014,
    2018, 2022
]

# Standard request headers to avoid block
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

def clean_team_name(element):
    """
    Extracts and cleans team name from the BeautifulSoup element, 
    decomposing flag icon containers to avoid pollution.
    """
    if not element:
        return ""
    
    # Decompose flag icons and images to ensure only clean text is extracted
    for badge in element.find_all(class_=re.compile("flagicon|mw-image-border|mw-file-element")):
        badge.decompose()
        
    text = element.get_text()
    
    # Remove zero-width marks and replace non-breaking spaces
    text = text.replace('\xa0', ' ').replace('\u200e', '').replace('\u200f', '')
    
    # Clean multiple spaces and strip
    return re.sub(r'\s+', ' ', text).strip()

def parse_footballbox_elements(soup, year, default_stage=None):
    """
    Parses all footballbox match containers inside the soup object.
    If default_stage is provided (e.g. 'group'), it uses that stage name.
    Otherwise, it determines the stage dynamically based on the preceding header.
    """
    matches = []
    fb_elements = soup.find_all(class_=re.compile("footballbox"))
    
    for match in fb_elements:
        home_el = match.find(class_="fhome")
        score_el = match.find(class_="fscore")
        away_el = match.find(class_="faway")
        
        home_team = clean_team_name(home_el)
        away_team = clean_team_name(away_el)
        
        score_txt = score_el.get_text(strip=True) if score_el else ""
        
        # Regex to match home and away scores (digits separated by dash/minus/hyphen)
        score_match = re.search(r'(\d+)\s*[\-–−]\s*(\d+)', score_txt)
        if score_match:
            home_score = int(score_match.group(1))
            away_score = int(score_match.group(2))
        else:
            home_score = None
            away_score = None
            
        # Determine the stage
        if default_stage:
            stage = default_stage
        else:
            prev_h = match.find_previous(["h2", "h3", "h4"])
            if prev_h:
                header_text = prev_h.get_text().replace("[edit]", "").strip().lower()
                # 1950 Final round was a round robin stage
                if "group" in header_text or (year == 1950 and "final round" in header_text):
                    stage = "group"
                else:
                    stage = "knockout"
            else:
                stage = "unknown"
                
        matches.append({
            "year": year,
            "stage": stage,
            "home_team": home_team,
            "away_team": away_team,
            "home_score": home_score,
            "away_score": away_score
        })
        
    return matches

def main():
    print("Starting FIFA World Cup historical data scraping (1930 - 2022)...")
    all_data = []
    
    for year in YEARS:
        print(f"Scraping {year} FIFA World Cup...")
        year_matches = []
        
        # Main tournament page URL
        main_url = f"https://en.wikipedia.org/wiki/{year}_FIFA_World_Cup"
        
        try:
            # Fetch main page
            time.sleep(1.0) # Graceful delay
            response = requests.get(main_url, headers=HEADERS, timeout=15)
            if response.status_code != 200:
                print(f"  [ERROR] Failed to fetch main page for {year} (Status: {response.status_code})")
                continue
                
            soup = BeautifulSoup(response.content, "html.parser")
            
            # Scrape matches from the main page
            # For 1930 - 1994, this scrapes all matches.
            # For 1998 - 2022, this scrapes only the knockout stage matches.
            main_matches = parse_footballbox_elements(soup, year)
            year_matches.extend(main_matches)
            
            # If modern tournament (1998 - 2022), scrape group stages from subpages A-H
            if year >= 1998:
                for letter in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']:
                    group_url = f"https://en.wikipedia.org/wiki/{year}_FIFA_World_Cup_Group_{letter}"
                    time.sleep(1.0) # Graceful delay
                    
                    g_response = requests.get(group_url, headers=HEADERS, timeout=15)
                    if g_response.status_code != 200:
                        print(f"  [WARNING] Failed to fetch subpage for Group {letter} (Status: {g_response.status_code})")
                        continue
                        
                    g_soup = BeautifulSoup(g_response.content, "html.parser")
                    group_matches = parse_footballbox_elements(g_soup, year, default_stage="group")
                    year_matches.extend(group_matches)
            
            print(f"  [SUCCESS] Successfully scraped {len(year_matches)} matches for {year}.")
            all_data.extend(year_matches)
            
        except Exception as e:
            print(f"  [ERROR] Exception occurred while scraping {year}: {e}")
            
    # Save the scraped data to CSV
    if all_data:
        df = pd.DataFrame(all_data)
        
        # Convert score columns to nullable integer type 'Int64' so missing values are preserved as NaN instead of floats
        df['home_score'] = df['home_score'].astype('Int64')
        df['away_score'] = df['away_score'].astype('Int64')
        
        # Ensure target directory exists
        os.makedirs("data/raw", exist_ok=True)
        
        output_file = "data/raw/wc_historical.csv"
        df.to_csv(output_file, index=False, encoding='utf-8')
        print(f"\nScraping complete! Saved {len(df)} matches to {output_file}.")
    else:
        print("\nNo data scraped. File not saved.")

if __name__ == "__main__":
    main()
