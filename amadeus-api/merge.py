import json, hashlib

added = set()
data = []

for item in ["out.json", "out3.json", "out4.json", "out5.json", "out6.json"]:
    with open(item) as f:
        x = json.load(f)
    x = x["results"]
    print item, len(x)
    for result in x:
        hashStr = result["address"]["line1"] + result["address"]["city"] + result["property_name"]
        nameHash = hashlib.sha1(hashStr)
        if nameHash not in added:
            data.append(result)
            added.add(nameHash)

print len(data)
with open("data_final.json", "w") as out:
    out.write(json.dumps(data, indent=4))