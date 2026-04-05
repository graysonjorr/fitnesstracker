import csv
from supabase import create_client

SUPABASE_URL = 'https://hgsxczqrskdvfowqnkdb.supabase.co'
SUPABASE_KEY = 'sb_publishable_WZQb9MsIkGmGs_8t_K6_nA_0tQIN6Nt'

NUMERIC_COLS = {
    'protein_per_100g', 'fat_per_100g', 'carbs_per_100g', 'calories_per_100g',
    'sugar_per_100g', 'fiber_per_100g', 'calcium_per_100g', 'iron_per_100g',
    'potassium_per_100g', 'sodium_per_100g', 'vitamin_a_per_100g', 'vitamin_d_per_100g',
    'vitamin_c_per_100g', 'cholesterol_per_100g', 'saturated_fat_per_100g', 'serving_size'
}

client = create_client(SUPABASE_URL, SUPABASE_KEY)

rows = []
with open('food_data/processed_foods.csv', newline='', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        cleaned = {}
        for k, v in row.items():
            if v == '':
                cleaned[k] = None
            elif k in NUMERIC_COLS:
                cleaned[k] = float(v)
            else:
                cleaned[k] = v
        rows.append(cleaned)

print(f'Importing {len(rows)} foods...')

BATCH = 500
for i in range(0, len(rows), BATCH):
    batch = rows[i:i + BATCH]
    client.table('foods').insert(batch).execute()
    print(f'  Inserted {min(i + BATCH, len(rows))}/{len(rows)}')

print('Done!')
