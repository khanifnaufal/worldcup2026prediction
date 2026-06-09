"""
scrape_squads.py
----------------
Scrapes 2026 FIFA World Cup squad data from Wikipedia.

Target URL : https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads
Output file: data/raw/squads.json

Usage:
    python scraper/scrape_squads.py

Requirements:
    pip install requests beautifulsoup4
"""

import json
import os
import re
import sys
import time

import requests
from bs4 import BeautifulSoup

# ──────────────────────────────────────────────────────────────────────────────
# Fix Windows console encoding so Unicode team/player names print cleanly
# ──────────────────────────────────────────────────────────────────────────────
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# ──────────────────────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────────────────────

TARGET_URL = "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}

OUTPUT_FILE = os.path.join("data", "output", "squads.json")

# Map Wikipedia team names → names used in simulation_results.json
# (Wikipedia WC-2026 page already uses standardised names for most teams,
#  but keep the mapping as a safety net for any edge cases.)
NAME_MAPPING = {
    "IR Iran":        "Iran",
    "Korea Republic": "South Korea",
    "Türkiye":        "Turkey",
    "Congo DR":       "DR Congo",
    "Cote d'Ivoire":  "Ivory Coast",
    "Côte d'Ivoire":  "Ivory Coast",
    "Curacao":        "Curacao",
    "Curaçao":        "Curacao",
    "Czech Republic": "Czechia",
}

# H2 section IDs/text that are NOT team groups (skip them)
NON_TEAM_H2 = re.compile(
    r"group|references|external|notes|see also|contents",
    re.IGNORECASE,
)


# ──────────────────────────────────────────────────────────────────────────────
# Text utilities
# ──────────────────────────────────────────────────────────────────────────────

def clean_text(text: str) -> str:
    """Normalise whitespace and strip common Unicode noise."""
    if not text:
        return ""
    text = (
        text.replace("\xa0", " ")   # non-breaking space
            .replace("\u200e", "")  # LTR mark
            .replace("\u200f", "")  # RTL mark
            .replace("\u200b", "")  # zero-width space
            .replace("\u00ad", "")  # soft hyphen
    )
    return re.sub(r"\s+", " ", text).strip()


def get_cell_text(cell) -> str:
    """
    Return clean plain text from a <td>/<th>, stripping flag icons,
    images, sort-keys, and reference superscripts.
    """
    from bs4 import BeautifulSoup as BS
    clone = BS(str(cell), "html.parser")

    # Remove flag icons, images, hidden spans, sort keys, refs
    for tag in clone.find_all(
        class_=re.compile(
            r"flagicon|mw-image-border|mw-file-element|"
            r"sortkey|mw-editsection|noprint|reference"
        )
    ):
        tag.decompose()
    for tag in clone.find_all(["img", "sup"]):
        tag.decompose()

    return clean_text(clone.get_text())


def clean_player_name(raw: str) -> str:
    """Strip captain asterisk (*) and other noise from a player name."""
    name = clean_text(raw)
    name = name.strip("*").strip()
    # Remove trailing parenthetical like "(c)" or "(captain)"
    name = re.sub(r"\s*\([^)]{1,20}\)\s*$", "", name).strip()
    return name


def extract_age(cell_text: str):
    """
    Extract age integer from a Wikipedia date-of-birth cell.

    Wikipedia WC-2026 uses: "(2000-05-17)May 17, 2000 (aged 26)"
    Also handles older format: "1 January 1990 (age 31)"
    """
    # Primary: matches both "(age N)" and "(aged N)"
    m = re.search(r"\(aged?\s+(\d+)\)", cell_text, re.IGNORECASE)
    if m:
        return int(m.group(1))
    # Fallback: standalone 2-digit number in parens
    m2 = re.search(r"\((\d{2})\)", cell_text)
    if m2:
        return int(m2.group(1))
    return None


def safe_int(value: str, default: int = 0):
    """Convert string to int; return *default* on failure."""
    try:
        cleaned = re.sub(r"[^\d]", "", str(value).strip())
        return int(cleaned) if cleaned else default
    except (ValueError, TypeError):
        return default


# ──────────────────────────────────────────────────────────────────────────────
# Column detection
# ──────────────────────────────────────────────────────────────────────────────

def detect_columns(header_row) -> dict:
    """
    Map logical column name → 0-based index from a wikitable header row.
    Handles colspan by expanding into multiple indices.
    """
    cols = {}
    idx = 0
    for th in header_row.find_all(["th", "td"]):
        txt = clean_text(th.get_text()).lower()
        span = int(th.get("colspan", 1))

        if re.match(r"^no\.?$|^#$|^num", txt):
            cols.setdefault("number", idx)
        elif re.match(r"^pos\.?$|position", txt):
            cols.setdefault("position", idx)
        elif re.match(r"^player$|^name$", txt):
            cols.setdefault("name", idx)
        elif re.search(r"date of birth|dob|\bborn\b", txt):
            cols.setdefault("dob", idx)
        elif re.match(r"^caps?$|appearances", txt):
            cols.setdefault("caps", idx)
        elif re.match(r"^goals?$", txt):
            cols.setdefault("goals", idx)
        elif re.match(r"^club$|club\s*/\s*team|^team$", txt):
            cols.setdefault("club", idx)

        idx += span

    return cols


# ──────────────────────────────────────────────────────────────────────────────
# Squad-table parser
# ──────────────────────────────────────────────────────────────────────────────

def parse_squad_table(table) -> list:
    """Parse a Wikipedia squad wikitable → list of player dicts."""
    players = []
    rows = table.find_all("tr")
    if not rows:
        return players

    # Find header row
    col_map = {}
    data_start = 0
    for i, row in enumerate(rows):
        if row.find("th"):
            col_map = detect_columns(row)
            data_start = i + 1
            break

    if not col_map:
        return players

    for row in rows[data_start:]:
        cells = row.find_all(["td", "th"])
        if len(cells) < 3:
            continue  # sub-header or empty row

        def get(col_name):
            idx = col_map.get(col_name)
            if idx is None or idx >= len(cells):
                return ""
            return get_cell_text(cells[idx])

        name = clean_player_name(get("name"))
        if not name:
            continue  # skip rows without a player name

        # Position: Wikipedia embeds a sort-key digit prefix, e.g. "1GK", "2DF"
        # Strip any leading digits to get the clean position code.
        raw_pos = get("position").upper().strip()
        position = re.sub(r"^\d+", "", raw_pos).strip() or None

        players.append({
            "number":   safe_int(get("number"), default=None),
            "position": position,
            "name":     name,
            "age":      extract_age(get("dob")),
            "caps":     safe_int(get("caps"),  default=0),
            "goals":    safe_int(get("goals"), default=0),
            "club":     clean_text(get("club")) or None,
        })

    return players


# ──────────────────────────────────────────────────────────────────────────────
# Coach extraction
# ──────────────────────────────────────────────────────────────────────────────

def extract_coach(siblings) -> str | None:
    """
    Search paragraphs in *siblings* for a coach name.

    Wikipedia WC-2026 uses this pattern in a <p> tag:
        "Coach: Javier Aguirre"      (most common)
        "Coach:  Hugo Broos"         (double space)
        "Manager: Name"              (rare fallback)
        "Head coach: Name"           (rare fallback)

    The siblings list may contain a <link> tag (Variant B) whose text()
    includes paragraphs from other teams — we only look at direct <p> siblings.
    """
    # Regex matches any of: Coach / Manager / Head coach / Head Coach
    COACH_RE = re.compile(
        r"^(?:Coach|Manager|Head\s*[Cc]oach)\s*[:\-–]\s*(.+)",
        re.IGNORECASE,
    )

    for tag in siblings:
        if not hasattr(tag, "name") or tag.name is None:
            continue

        # Stop at the squad wikitable (direct or inside link)
        if tag.name == "table":
            classes = tag.get("class") or []
            if any("wikitable" in c for c in classes):
                break
        if tag.name == "link":
            # Don't recurse into link tag for coach — it contains other teams
            break

        # Only look at direct <p> siblings
        if tag.name == "p":
            tag_text = clean_text(tag.get_text())
            m = COACH_RE.match(tag_text)
            if m:
                # Take the first logical chunk (before double-space / newline)
                raw_coach = re.split(r"\s{2,}|\n|\[", m.group(1))[0]
                return clean_text(raw_coach) or None

    return None




# ──────────────────────────────────────────────────────────────────────────────
# Main scraping logic
# ──────────────────────────────────────────────────────────────────────────────

def scrape_squads() -> tuple:
    """
    Fetch the Wikipedia squads page and parse all 48 team sections.

    Wikipedia WC-2026 structure (confirmed via inspection):

        <div class="mw-heading mw-heading3">
            <h3 id="Brazil">Brazil</h3>
        </div>
        <p>Coach info paragraph…</p>
        <table class="wikitable sortable"> … squad … </table>
        <div class="mw-heading mw-heading3">
            <h3 id="Germany">Germany</h3>
        </div>
        …

    Strategy: collect all `div.mw-heading3` elements.
    For each, collect siblings until the next `div.mw-heading2/3` or end.
    Find the wikitable among those siblings and parse it.
    """
    print(f"Fetching: {TARGET_URL}\n")
    response = requests.get(TARGET_URL, headers=HEADERS, timeout=30)
    response.raise_for_status()
    time.sleep(2)

    soup = BeautifulSoup(response.content, "html.parser")

    squads = {}
    failed_teams = []

    # Every team heading is wrapped in a div.mw-heading.mw-heading3
    team_heading_divs = soup.find_all(
        "div", class_=lambda c: c and "mw-heading3" in c
    )

    for hdiv in team_heading_divs:
        h3 = hdiv.find("h3")
        if not h3:
            continue

        raw_team_name = clean_text(h3.get_text())

        # ── Collect sibling elements until next heading div ──
        siblings = []
        for sib in hdiv.find_next_siblings():
            # Stop at next h2 or h3 heading wrapper
            sib_cls = sib.get("class") or []
            if "mw-heading2" in sib_cls or "mw-heading3" in sib_cls:
                break
            siblings.append(sib)

        # ── Find the squad wikitable ──
        # Two layout variants exist on this Wikipedia page:
        #
        # Variant A (most teams):
        #   <div class="mw-heading3"><h3>Brazil</h3></div>
        #   <p>...</p>
        #   <table class="wikitable ..."> ... </table>   ← direct sibling
        #
        # Variant B (some teams):
        #   <div class="mw-heading3"><h3>Mexico</h3></div>
        #   <p>...</p>
        #   <link rel="mw-deduplicated-inline-style" ...>
        #     <table class="wikitable ..."> ... </table>  ← child of <link>!
        #
        # BS4 nests the <table> inside the <link> because the browser-parsed
        # Wikipedia HTML has no closing </link> before the <table>.
        squad_table = None
        for sib in siblings:
            if not hasattr(sib, "name"):
                continue

            # Variant A: table is a direct sibling
            if sib.name == "table":
                classes = sib.get("class") or []
                if any("wikitable" in c for c in classes):
                    squad_table = sib
                    break

            # Variant B: table is nested inside a <link> tag
            if sib.name == "link":
                nested = sib.find("table", class_=re.compile(r"wikitable"))
                if nested:
                    squad_table = nested
                    break

        if squad_table is None:
            # Not a team section (no squad table) — skip silently
            continue

        # Standardise name
        team_name = NAME_MAPPING.get(raw_team_name, raw_team_name)

        # Extract coach from pre-table siblings
        coach = extract_coach(iter(siblings))

        # Parse players
        players = parse_squad_table(squad_table)

        if not players:
            print(f"  [WARNING] Skipping '{team_name}' — table found but no players parsed.")
            failed_teams.append(team_name)
            continue

        squads[team_name] = {
            "coach":   coach,
            "players": players,
        }

        print(
            f"  Scraping {team_name}... "
            f"{len(players)} players found, "
            f"Coach: {coach or 'N/A'}"
        )

    return squads, failed_teams


# ──────────────────────────────────────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────────────────────────────────────

def main():
    squads, failed_teams = scrape_squads()

    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(squads, f, ensure_ascii=False, indent=2)

    # ── Summary ──
    total_players = sum(len(v["players"]) for v in squads.values())

    print("\n" + "=" * 60)
    print("SCRAPING SUMMARY")
    print("=" * 60)
    print(f"  Teams successfully scraped : {len(squads)}")
    print(f"  Total players              : {total_players}")
    if failed_teams:
        print(f"  Teams skipped / failed     : {len(failed_teams)}")
        for t in failed_teams:
            print(f"    - {t}")
    else:
        print("  Teams skipped / failed     : 0")
    print(f"\n  Output saved to: {OUTPUT_FILE}")
    print("=" * 60)


if __name__ == "__main__":
    main()
