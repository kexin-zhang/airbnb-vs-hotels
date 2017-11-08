import json

with open("additional_listings.json") as f:
	original = json.load(f)
	original = original['data']

seen = set([item['url'] for item in original])

with open("addi.json") as f:
	more = json.load(f)

additional = {}

for item in more:
	if item['url'] and item['url'] not in seen:
		if item['url'] not in additional:
			additional[item['url']] = item
		else:
			curr = additional[item['url']] 
			if not curr['price'] and item['price']:
				additional[item['url']] = item

dump2 = [additional[key] for key in additional] + original
print(len(dump2))
with open("nyc_listingsv2.json", "w") as out:
	json.dump(dump2, out)