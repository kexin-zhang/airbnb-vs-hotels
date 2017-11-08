import json

seen = {}

for fname in ["bronx.json", "brooklyn.json", "queens.json", "staten.json"]:
	with open("output/" + fname) as f:
		data = json.load(f)

	for item in data:
		if item["url"] not in seen:
			seen[item["url"]] = item
		else:
			if not seen[item["url"]]["price"] and item["price"]:
				seen[item["url"]] = item

x = [seen[key] for key in seen]
with open("additional_listings.json", "w") as out:
	json.dump(x, out)