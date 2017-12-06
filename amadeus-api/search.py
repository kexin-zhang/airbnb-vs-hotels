import requests
import json, csv, time
import os

url = 'https://api.sandbox.amadeus.com/v1.2/hotels/search-circle'

payload = {
	'apikey': os.environ['AMADEUS_KEY'],
	'latitude': 37.7749,
	'longitude': -122.4194,
	'radius': 1,
	'check_in': '2017-12-15',
	'check_out': '2017-12-16',
	#'number_of_results': 5,
	'all_rooms': True,
	'show_sold_out': True
}

seen = set()
out = []

with open("../data/tripadvisor_output.csv") as f:
	reader = csv.DictReader(f)
	for line in reader:
		osm_payload = {
			"q": line["address"].split(",")[0] + " New York",
			"format": "json"
		}
		r1 = requests.get("http://nominatim.openstreetmap.org/search", params=osm_payload)
		resp = r1.json()
		if resp and len(resp) > 0:
			line["lat"] = resp[0]["lat"]
			line["lon"] = resp[0]["lon"]

			payload["latitude"] = resp[0]["lat"]
			payload["longitude"] = resp[0]["lon"]

			r = requests.get(url, params=payload)

			results = r.json()
			if "results" in results and results["results"]:
				out.extend(results["results"])
			else:
				print("500")

			with open("searh_results.json", "w") as f:
				json.dump(out, f)

		else:
			line["lat"] = None
			line["lon"] = None

		print(line["lat"], line["lon"])
		time.sleep(.5)

print(len(out))