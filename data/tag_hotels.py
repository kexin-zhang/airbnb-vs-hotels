import json
import numpy as np
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

print(len(relevant_subways))

with open('hotels_features_tagged.json', 'w') as f:
    json.dump(data, f, indent = 2)

with open('subways.json', 'w') as f:
    json.dump(relevant_subways, f, indent = 2)
