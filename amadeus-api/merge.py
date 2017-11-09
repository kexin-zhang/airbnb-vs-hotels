import json, hashlib

added = set()
data = []

for item in ["data_final.json", "x5.json", "x6.json"]:
    with open(item) as f:
        x = json.load(f)
    print len(x)
    for result in x:
        try:
            if result["address"]["region"] == "NY":
                hashStr = result["property_name"]
                nameHash = hashlib.sha256(hashStr)
                if nameHash not in added:
                    data.append(result)
                    added.add(nameHash)
        except:
            pass

print len(data)
with open("conglomerate.json", "w") as out:
    json.dump(data, out)