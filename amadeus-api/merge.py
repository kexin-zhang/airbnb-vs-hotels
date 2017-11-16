import json, hashlib

added = set()
data = []

for item in ["data_final.json", "x5.json", "x6.json", "x7.json", "x8.json"]:
    with open(item) as f:
        x = json.load(f)
    print(len(x))
    for result in x:
        if result["property_code"] not in added:
            added.add(result["property_code"])
            data.append(result)

print(len(data))
with open("conglomerate3.json", "w") as out:
    json.dump(data, out)