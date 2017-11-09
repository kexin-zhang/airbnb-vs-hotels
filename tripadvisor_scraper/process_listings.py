import json
import csv

with open("additional_listings.json") as f:
	listings = json.load(f)

with open("additional.json") as f:
	features = json.load(f)

lookup = {
	item["url"] : item for item in listings
}

output = []
for item in features:
	listing = lookup[item["url"]]
	listing.update(item)
	listing["check_in"] = "2017-12-09"
	listing["check_out"] = "2017-12-10"
	listing["adults"] = 2
	listing["rooms"] = 1
	listing["date_scraped"] = "2017-11-07"
	listing.pop('features', None)
	output.append(listing)

with open("nyc_listings_additional.csv", "w") as out:
	fieldnames = ["name", "date_scraped", "check_in","check_out","adults","rooms", "address", "provider","reviews","rating","price", "range" ,"amenities", "tripadvisor rank", "star rating","url"]
	writer = csv.DictWriter(out, fieldnames=fieldnames)
	writer.writeheader()
	for item in output:
		writer.writerow(item)