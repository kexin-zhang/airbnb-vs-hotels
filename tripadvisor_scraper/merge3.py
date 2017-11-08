import csv

seen = set()

out = open("nyc_listings_all.csv", "w")
fieldnames = ["name", "date_scraped", "check_in","check_out","adults","rooms", "address", "provider","reviews","rating","price", "range" ,"amenities", "tripadvisor rank", "star rating","url"]
writer = csv.DictWriter(out, fieldnames=fieldnames)
writer.writeheader()

with open("nyc_listings2.csv") as f:
	reader = csv.DictReader(f)
	for row in reader:
		seen.add(row["url"])
		row["date_scraped"] = "2017-11-01"
		writer.writerow(row)

with open("nyc_listings_additional.csv") as f:
	reader = csv.DictReader(f)
	for row in reader:
		if row["url"] not in seen:
			seen.add(row["url"])
			writer.writerow(row)

out.close()