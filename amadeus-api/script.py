import requests
import json

url = 'https://api.sandbox.amadeus.com/v1.2/hotels/search-circle'

payload = {
	'apikey': 'LYnMGAajPtInzPDn6RFA6D1jZqUFFABj',
	'latitude': '40.7589',
	'longitude': '-73.9851',
	'radius': '15',
	'check_in': '2017-12-15',
	'check_out': '2017-12-16',
	'number_of_results': 160,
	'all_rooms': True,
	'show_sold_out': True
}

r = requests.get(url, params=payload)

with open("out.json", "w") as out:
	json.dump(r.json(), out)