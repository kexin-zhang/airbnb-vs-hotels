import json
import numpy as np
import pandas as pd
from scipy.spatial.distance import cdist

with open('subway.geojson', 'r') as f:
    subway_json = json.load(f)['features']

locations = []
location_map = {}

for i, f in enumerate(subway_json):
    long, lat = f['geometry']['coordinates']
    locations.append((lat, long))
    location_map[(lat, long)] = f

locations = np.array(locations)

def get_nearest(lat, long):
    smallest = np.argmin(cdist(locations, [[lat, long]]))
    loc = locations[smallest]
    return location_map[tuple(loc)]


relevant_subways = {}

with open('hotels_features.json', 'r') as f:
    data = json.load(f)
    for hotel in data:
        lat, long = float(hotel['lat']), float(hotel['lon'])
        nearest = get_nearest(lat, long)
        id = nearest['properties']['objectid']
        hotel['location_cell'] = id
        relevant_subways[id] = nearest

hotel_subs = set(relevant_subways.keys())

with open('hotels_features_tagged.json', 'w') as f:
    json.dump(data, f, indent = 2)

#tag airbnb datasets (not included)
air_df = pd.read_csv('listings.csv', index_col = None, low_memory=False)
#preprocess some columns
air_df['price'] = air_df.price.str.slice(1)
air_df['price'] = air_df.price.str.replace(',', '').astype(float)
air_df['weekly_price'] = air_df.weekly_price.str.slice(1)
air_df['weekly_price'] = air_df.weekly_price.str.replace(',', '').astype(float)
air_df['monthly_price'] = air_df.monthly_price.str.slice(1)
air_df['monthly_price'] = air_df.monthly_price.str.replace(',', '').astype(float)
air_df = air_df[['id', 'name', 'listing_url', 'price',
                 'beds', 'amenities', 'longitude', 'latitude',
                 'summary', 'state']]

coords = air_df[['latitude', 'longitude']].values

nearest_ids = []

for lat, long in coords:
    nearest = get_nearest(lat, long)
    id = nearest['properties']['objectid']
    nearest_ids.append(id)
    relevant_subways[id] = nearest

air_df['location_cell'] = nearest_ids

with open('subways.json', 'w') as f:
    json.dump(relevant_subways, f, indent = 2)

air_df.to_csv('listings_taggged.csv', index=False)


air_subs = set(nearest_ids)
print(len(relevant_subways))
print(len(hotel_subs & air_subs))
