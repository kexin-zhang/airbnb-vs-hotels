import csv, json, requests, time
from datetime import datetime, timedelta

def query(hotel_ids, check_in, check_out):
    fname = "hotels{}_to_{}.json".format(check_in, check_out)
    output = []
    for code in hotel_ids:
        payload = {
            'apikey': 'LYnMGAajPtInzPDn6RFA6D1jZqUFFABj',
            'check_in': check_in,
            'check_out': check_out,
            'all_rooms': True,
            'show_sold_out': True
        }
        url = "https://api.sandbox.amadeus.com/v1.2/hotels/{}".format(code)
        r = requests.get(url, params=payload)
        results = r.json()
        if results and "rooms" in results:
            output.append({
                    "property_code": code,
                    "amenities": results["amenities"],
                    "address": results["address"],
                    "awards": results["awards"]
                })
            #print(len(results["rooms"]))
        else:
            print("DIDNT GET ROOMS FOR {}".format(code))

        time.sleep(1.2)

    with open("temp.json", "w") as out:
        out.write(json.dumps(output, indent=2))
    # print(output)

with open("../data/hotels_identifiers.csv") as f:
    reader = csv.DictReader(f)
    hotel_ids = [row["amadeus_code"] for row in reader]

curr = datetime.today()
while curr < datetime.strptime("2018-01-01", "%Y-%m-%d"):
    check_in = datetime.strftime(curr, "%Y-%m-%d")
    check_out = datetime.strftime(curr + timedelta(days=1), "%Y-%m-%d")
    print(check_in, check_out)
    query(hotel_ids, check_in, check_out)
    curr += timedelta(days=10)

