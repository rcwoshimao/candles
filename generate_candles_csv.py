#!/usr/bin/env python3
"""
Generate CSV file for bulk importing candles into Supabase.
Usage: python generate_candles_csv.py [--count N] [--output filename.csv]
"""

import csv
import json
import random
import uuid
from datetime import datetime, timedelta
from argparse import ArgumentParser
from typing import List, Tuple

# Load emotions from the emotions.json file
def load_emotions() -> List[str]:
    """Load all leaf-level emotions from emotions.json"""
    try:
        with open('src/lib/emotions.json', 'r') as f:
            emotions_data = json.load(f)
        
        leaf_emotions = []
        for parent in emotions_data.values():
            for mid_level in parent.values():
                leaf_emotions.extend(mid_level)
        
        return leaf_emotions
    except FileNotFoundError:
        # Fallback to common emotions if file not found
        return [
            "inspired", "hopeful", "intimate", "sensitive", "thankful", "loving",
            "creative", "courageous", "valued", "respected", "confident", "successful",
            "inquisitive", "curious", "joyful", "free", "cheeky", "aroused",
            "energetic", "eager", "awe", "astonished", "perplexed", "disillusioned",
            "dismayed", "shocked", "unfocused", "sleepy", "overwhelmed", "worried",
            "rushed", "pressured", "apathetic", "indifferent", "helpless", "frightened",
            "inadequate", "inferior", "worthless", "insignificant", "excluded", "persecuted",
            "nervous", "exposed", "betrayed", "resentful", "disrespected", "ridiculed",
            "indignant", "violated", "furious", "jealous", "provoked", "hostile",
            "infuriated", "annoyed", "withdrawn", "numb", "skeptical", "dismissive",
            "judgemental", "embarrassed", "appalled", "revolted", "nauseated", "detestable",
            "horrified", "hesitant", "disappointed", "remorseful", "ashamed", "inferior",
            "empty", "powerless", "grief", "fragile", "victimized", "abandoned", "isolated"
        ]


def generate_position(center: Tuple[float, float] = None, spread: float = 50.0, 
                     worldwide: bool = False) -> Tuple[float, float]:
    """
    Generate a random latitude/longitude position.
    
    Args:
        center: Optional center point (lat, lng). Only used if worldwide=False.
        spread: How far to spread markers from center in degrees. Only used if worldwide=False.
        worldwide: If True, sample randomly from entire world bounds (ignores center/spread).
                   Uses map bounds: latitude [-85, 85], longitude [-180, 180]
    
    Returns:
        Tuple of (latitude, longitude)
    """
    if worldwide:
        # Sample uniformly from entire world bounds (matching MapComponent worldBounds)
        # Leaflet Web Mercator valid bounds: Southwest [-85.0511287798, -180] to Northeast [85.0511287798, 180]
        # Using standard geographic bounds for practical purposes: [-90, 90] lat, [-180, 180] lng
        WORLD_LAT_MIN = -90
        WORLD_LAT_MAX = 90
        WORLD_LNG_MIN = -180
        WORLD_LNG_MAX = 180
        
        lat = random.uniform(WORLD_LAT_MIN, WORLD_LAT_MAX)
        lng = random.uniform(WORLD_LNG_MIN, WORLD_LNG_MAX)
    else:
        # Original centered approach
        if center is None:
            center = (38.9072, -77.0369)  # Washington DC default
        
        # Generate random offset within spread
        lat_offset = random.uniform(-spread, spread)
        lng_offset = random.uniform(-spread, spread)
        
        lat = center[0] + lat_offset
        lng = center[1] + lng_offset
        
        # Clamp to valid latitude/longitude bounds (standard geographic bounds)
        lat = max(-90, min(90, lat))
        lng = max(-180, min(180, lng))
    
    return (lat, lng)


def generate_timestamp(days_back: int = 30) -> str:
    """
    Generate a random ISO timestamp within the last N days.
    
    Args:
        days_back: How many days back to generate timestamps from.
    
    Returns:
        ISO format timestamp string
    """
    now = datetime.utcnow()
    random_days = random.randint(0, days_back)
    random_hours = random.randint(0, 23)
    random_minutes = random.randint(0, 59)
    random_seconds = random.randint(0, 59)
    
    timestamp = now - timedelta(days=random_days, hours=random_hours, 
                               minutes=random_minutes, seconds=random_seconds)
    
    return timestamp.isoformat() + 'Z'


def generate_user_id() -> str:
    """Generate a random UUID for user_id"""
    return str(uuid.uuid4())


def format_position_array(lat: float, lng: float) -> str:
    """
    Format position as PostgreSQL double precision array format.
    Supabase expects: {lat,lng} (PostgreSQL array literal format).
    """
    # Use double braces to escape in f-string: {{ becomes {, }} becomes }
    return f'{{{lat},{lng}}}'


def generate_candles_csv(count: int = 1000, output_file: str = 'candles_import.csv', 
                         days_back: int = 30, center: Tuple[float, float] = None, 
                         spread: float = 50.0, worldwide: bool = False):
    """
    Generate CSV file with candle data for Supabase bulk import.
    
    Args:
        count: Number of candles to generate
        output_file: Output CSV filename
        days_back: How many days back to generate timestamps
        center: Center point (lat, lng) for position generation (only used if worldwide=False)
        spread: Spread radius in degrees from center (only used if worldwide=False)
        worldwide: If True, sample positions randomly from entire world (uses map bounds: lat [-85,85], lng [-180,180])
    """
    emotions = load_emotions()
    
    print(f"Generating {count} candles...")
    print(f"Using {len(emotions)} unique emotions")
    print(f"Output file: {output_file}")
    if worldwide:
        print(f"Mode: WORLDWIDE (sampling from entire world bounds: lat [-85, 85], lng [-180, 180])")
    else:
        print(f"Mode: CENTERED (center: {center if center else 'default'}, spread: {spread}°)")
    
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        # CSV columns based on Supabase markers table
        # Note: id and created_at are auto-generated, so we don't include them
        fieldnames = ['position', 'emotion', 'timestamp', 'user_timestamp', 'user_id']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        writer.writeheader()
        
        for i in range(count):
            lat, lng = generate_position(center, spread, worldwide)
            emotion = random.choice(emotions)
            timestamp = generate_timestamp(days_back)
            user_timestamp = timestamp  # Same timestamp for consistency
            user_id = generate_user_id()
            
            # Format position as "{lat,lng}" for PostgreSQL double precision array
            position_str = format_position_array(lat, lng)
            
            writer.writerow({
                'position': position_str,
                'emotion': emotion,
                'timestamp': timestamp,
                'user_timestamp': user_timestamp,
                'user_id': user_id
            })
            
            if (i + 1) % 100 == 0:
                print(f"Generated {i + 1} candles...")
    
    print(f"\n✓ Successfully generated {count} candles in {output_file}")
    print(f"\nTo import into Supabase:")
    print(f"1. Go to Supabase Dashboard > Table Editor > markers")
    print(f"2. Click 'Import data from CSV'")
    print(f"3. Select {output_file}")
    print(f"4. Map columns: position, emotion, timestamp, user_timestamp, user_id")
    print(f"5. Note: You may need to disable RLS temporarily for bulk import")
    print(f"   OR use SQL: COPY markers (position, emotion, timestamp, user_timestamp, user_id)")
    print(f"      FROM '{output_file}' WITH (FORMAT csv, HEADER true);")


if __name__ == '__main__':
    parser = ArgumentParser(description='Generate CSV file for bulk importing candles into Supabase')
    parser.add_argument('--count', type=int, default=1000, 
                       help='Number of candles to generate (default: 1000)')
    parser.add_argument('--output', type=str, default='candles_import.csv',
                       help='Output CSV filename (default: candles_import.csv)')
    parser.add_argument('--days-back', type=int, default=30,
                       help='Generate timestamps within last N days (default: 30)')
    parser.add_argument('--center-lat', type=float, default=38.9072,
                       help='Center latitude for position generation (default: 38.9072 - Washington DC)')
    parser.add_argument('--center-lng', type=float, default=-77.0369,
                       help='Center longitude for position generation (default: -77.0369 - Washington DC)')
    parser.add_argument('--spread', type=float, default=50.0,
                       help='Spread radius in degrees from center (default: 50.0)')
    parser.add_argument('--worldwide', action='store_true',
                       help='Sample positions randomly from entire world bounds (lat [-85,85], lng [-180,180]). Overrides center/spread.')
    
    args = parser.parse_args()
    
    center = (args.center_lat, args.center_lng)
    
    generate_candles_csv(
        count=args.count,
        output_file=args.output,
        days_back=args.days_back,
        center=center,
        spread=args.spread,
        worldwide=args.worldwide
    )
