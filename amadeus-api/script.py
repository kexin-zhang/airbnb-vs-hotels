import requests
import json

url = 'https://api.sandbox.amadeus.com/v1.2/hotels/search-circle'

coords = [
	[40.7831, -73.9712], # manhattan
	[40.6782, -73.9442], # brooklyn
	[40.7282, -73.7949], # queens
	[40.8448, -73.8648], # bronx
	[40.5795, -74.1502]  # staten island
]

payload = {
	'apikey': 'LYnMGAajPtInzPDn6RFA6D1jZqUFFABj',
	'latitude': 37.7749,
	'longitude': -122.4194,
	'radius': 30,
	'check_in': '2017-12-15',
	'check_out': '2017-12-16',
	# 'number_of_results': 160,
	'all_rooms': True,
	'show_sold_out': True
}

r = requests.get(url, params=payload)

with open("sf.json", "w") as out:
	out.write(json.dumps(r.json(), indent=4))