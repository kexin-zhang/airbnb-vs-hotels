import json, csv
from fuzzywuzzy import fuzz
import ast

with open("amadeus-api/conglomerate.json") as f:
    data = json.load(f)
    # for i in range(len(data)):
    #     addr = data[i]["address"]
    #     try:
    #         data[i]["address_revised"] = "{0}, {1}, {2} {3}".format(addr["line1"], addr["city"], addr["region"], addr["postal_code"])
    #     except KeyError as e:
    #         pass

output = []
with open("tripadvisor_scraper/nyc_listings_all.csv") as f:
    reader = csv.DictReader(f)
    for row in reader:
        addr = row["address"].split(",")[0]
        max_index = -1
        max_ratio = 0
        for i in range(len(data)):
            if "line1" in data[i]["address"]:
                ratio = fuzz.ratio(addr, data[i]["address"]["line1"])
                if ratio > max_ratio:
                    max_ratio = ratio
                    max_index = i
        name_ratio = fuzz.ratio(data[max_index]["property_name"], row["name"])
        if (max_ratio >= 83 and name_ratio >= 83) or name_ratio >= 95 or max_ratio == 100:
            print(data[max_index]["property_name"], row["name"], max_ratio)
            print(data[max_index]["address"]["line1"], row["address"])
            row["tripadvisor_address"] = row["address"]
            row["tripadvisor_amenities"] = ast.literal_eval(row["amenities"])
            row.update(data[max_index])
            output.append(row)

with open("data_merged.json", "w") as out:
    out.write(json.dumps(output, indent=2))
