import requests
import json, csv, time

url = 'https://api.sandbox.amadeus.com/v1.2/hotels/search-circle'

payload = {
	'apikey': 'LYnMGAajPtInzPDn6RFA6D1jZqUFFABj',
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

outfile = open("../tripadvisor_scraper/nyc_listings_latlon5.csv", "a")
fieldnames = ["name", "date_scraped", "check_in","check_out","adults","rooms", "address", "lat", "lon", "provider","reviews","rating","price", "range" ,"amenities", "tripadvisor rank", "star rating","url"]
writer = csv.DictWriter(outfile, fieldnames=fieldnames)
writer.writeheader()

with open("../tripadvisor_scraper/nyc_listings_all.csv") as f:
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

			with open("x8.json", "w") as f:
				json.dump(out, f)

		else:
			line["lat"] = None
			line["lon"] = None

		print(line["lat"], line["lon"])
		writer.writerow(line)
		outfile.flush()
		time.sleep(.5)

print(len(out))