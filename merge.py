import json, csv
from fuzzywuzzy import fuzz
import ast

with open("amadeus-api/data_final_merged.json") as f:
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
        name = row["name"]
        max_index = -1
        max_ratio = 0
        max_name_index = -1
        max_name_ratio = 0
        for i in range(len(data)):
            if "line1" in data[i]["address"]:
                ratio = fuzz.ratio(addr, data[i]["address"]["line1"])
                if ratio > max_ratio:
                    max_ratio = ratio
                    max_index = i
                name_ratio = fuzz.ratio(name, data[i]["property_name"])
                if name_ratio > max_name_ratio:
                    max_name_ratio = name_ratio
                    max_name_index = i
        if max_index == max_name_index:
            x = {
                "amadeus_name": data[max_index]["property_name"],
                "tripadvisor_name": row["name"],
                "amadeus_code": data[max_index]["property_code"],
                "tripadvisor_url": row["url"],
                "amadeus_address": data[max_index]["address"]["line1"],
                "tripadvisor_address": row["address"],
                "lat": data[max_index]["location"]["latitude"],
                "lon": data[max_index]["location"]["longitude"]
            }
            print(x["amadeus_name"], x["tripadvisor_name"])
            print(x["amadeus_address"], x["tripadvisor_address"])
            output.append(x)
        else:
            if max_name_ratio > max_ratio:
                max_index = max_name_index
            cur_max_name_ratio = fuzz.ratio(data[max_index]["property_name"], row["name"])
            if (max_ratio >= 82 and cur_max_name_ratio >= 82) or cur_max_name_ratio >= 92 or max_ratio >= 94:
                x = {
                    "amadeus_name": data[max_index]["property_name"],
                    "tripadvisor_name": row["name"],
                    "amadeus_code": data[max_index]["property_code"],
                    "tripadvisor_url": row["url"],
                    "amadeus_address": data[max_index]["address"]["line1"],
                    "tripadvisor_address": row["address"],
                    "lat": data[max_index]["location"]["latitude"],
                    "lon": data[max_index]["location"]["longitude"]
                }
                print(x["amadeus_name"], x["tripadvisor_name"])
                print(x["amadeus_address"], x["tripadvisor_address"])
                output.append(x)

print(len(output))
headers = ["amadeus_name", "tripadvisor_name", "amadeus_code", "tripadvisor_url", "amadeus_address", "tripadvisor_address", "lat", "lon"]
with open("another_1.csv", "w") as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerows(output)

        # name_ratio = fuzz.ratio(data[max_index]["property_name"], row["name"])
        # if (max_ratio >= 80 and name_ratio >= 80) or name_ratio >= 90 or max_ratio >= 94:
        #     print(data[max_index]["property_name"], row["name"], max_ratio)
        #     print(data[max_index]["address"]["line1"], row["address"])
        #     row["tripadvisor_address"] = row["address"]
        #     row["tripadvisor_amenities"] = ast.literal_eval(row["amenities"])
        #     row.update(data[max_index])
        #     output.append(row)

# with open("data_merged_additional2.json", "w") as out:
#     out.write(json.dumps(output, indent=2))
