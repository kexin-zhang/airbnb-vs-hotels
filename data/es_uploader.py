import csv
import json
from pprint import pprint

from elasticsearch import Elasticsearch, helpers, RequestsHttpConnection
from requests_aws4auth import AWS4Auth

ENDPOINT = "https://search-cx4242-airbnb-vs-hotels-lxzlxz6rpewpzksb46papky6he.us-east-1.es.amazonaws.com"
# CREDENTIALS_FILE = 'credentials.csv'
#
# credentials = []
# with open(CREDENTIALS_FILE) as csvfile:
#     reader = csv.DictReader(csvfile)
#     for row in reader:
#         credentials.append(row)
#
# REGION = 'us-east-1'
# ACCESS_KEY = credentials[0].get('Access key ID')
# SECRET_KEY = credentials[0].get('Secret access key')
# awsauth = AWS4Auth(ACCESS_KEY, SECRET_KEY, REGION, 'es')
#
# es = Elasticsearch(hosts=[ENDPOINT], http_auth=awsauth, connection_class=RequestsHttpConnection)

es = Elasticsearch(hosts=[ENDPOINT])

def load_hotel_data(es):
    files = [
        {
            'filename': 'hotels2017-11-16_to_2017-11-17.json',
            'start_date': '2017-11-16',
            'end_date': '2017-11-17'
        },
        {
            'filename': 'hotels2017-11-26_to_2017-11-27.json',
            'start_date': '2017-11-26',
            'end_date': '2017-11-27'
        },
        {
            'filename': 'hotels2017-12-06_to_2017-12-07.json',
            'start_date': '2017-12-06',
            'end_date': '2017-12-07'
        },
        {
            'filename': 'hotels2017-12-16_to_2017-12-17.json',
            'start_date': '2017-12-16',
            'end_date': '2017-12-17'
        },
        {
            'filename': 'hotels2017-12-26_to_2017-12-27.json',
            'start_date': '2017-12-26',
            'end_date': '2017-12-27'
        }
    ]
    for file in files:
        data = json.load(open(file.get('filename')))

        actions = []

        for doc in data:
            doc['start_date'] = file.get('start_date')
            doc['end_date'] = file.get('end_date')
            actions.append({
                '_index': 'hotels',
                '_type': 'listings',
                '_source': doc
                })

        helpers.bulk(es, actions)


def load_hotels_features(es):
    filename = 'hotels_features.json'

    data = json.load(open(filename))
    actions = []

    for doc in data:
        actions.append({
            '_index': 'hotels',
            '_type': 'features',
            '_source': doc
        })
    helpers.bulk(es, actions)


def load_hotels_features_tagged(es):
    filename = 'hotels_features_tagged.json'

    data = json.load(open(filename))
    actions = []

    for doc in data:
        actions.append({
            '_index': 'hotels',
            '_type': 'features_tagged',
            '_source': doc
        })
    helpers.bulk(es, actions)


def load_hotels_identifiers(es):
    filename = 'hotels_identifiers.csv'

    data = []

    with open(filename) as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            data.append(row)

    actions = []

    for doc in data:
        actions.append({
            '_index': 'hotels',
            '_type': 'identifiers',
            '_source': doc
        })
    helpers.bulk(es, actions)


def load_location_cell_centers(es):
    filename = 'location_cell_centers.csv'

    data = []

    with open(filename) as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            data.append(row)

    actions = []

    for doc in data:
        actions.append({
            '_index': 'location',
            '_type': 'cell_centers',
            '_source': doc
        })
    helpers.bulk(es, actions)


def load_regions(es):
    filename = 'regions.json'

    data = json.load(open(filename))

    actions = []

    for doc in data:
        actions.append({
            '_index': 'location',
            '_type': 'regions',
            '_source': {
                'region': doc
            }
        })
    helpers.bulk(es, actions)

def load_subways(es):
    filename = 'subways.json'

    data = json.load(open(filename))

    actions = []

    for id, doc in data.items():
        actions.append({
            '_index': 'subways',
            '_type': 'subway_info',
            '_id': id,
            '_source': doc
        })
    helpers.bulk(es, actions)

def create_airbnb_mapping(es):
    map_name = "listings"
    mapping = {
        map_name: {
            "properties": {
                "location": {
                    "type": "geo_point"
                },
                "id": {"type": "integer"},
                "name": {"type": "string"},
                "listing_url": {"type": "string"},
                "price": {"type": "float"},
                "beds": {"type": "integer"},
                "amenities": {"type": "string"},
                "summary": {"type": "string"},
                "state": {"type": "string"},
                "location_cell": {"type": "integer"},
            }
        }
    }
    es.indices.create(index="airbnb")
    es.indices.put_mapping(index="airbnb", doc_type=map_name, body=mapping)

def load_airbnb_geo_listings(es):
    filename = 'airbnb_listings_tagged.csv'

    data = []

    with open(filename) as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            data.append({
                "location": {
                    "lat": float(row['latitude']),
                    "lon": float(row['longitude'])
                },
                "id": int(row['id']),
                "name": row['name'],
                "listing_url": row['listing_url'],
                "price": float(row['price']),
                "beds": int(float(row['beds'])) if row['beds'] is not '' else None,
                "amenities": row['amenities'],
                "summary": row['summary'],
                "state": row['state'],
                "location_cell": int(float(row['location_cell'])),
                })

    actions = []

    for doc in data:
        actions.append({
            '_index': 'airbnb',
            '_type': 'listings',
            '_source': doc
        })
    helpers.bulk(es, actions)


    filename = 'airbnb_listings_tagged.csv'

    data = []

    with open(filename) as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            row['id'] = int(row['id'])
            row['price'] = float(row['price'])
            row['beds'] =  int(float(row['beds'])) if row['beds'] is not '' else None
            row['longitude'] = float(row['longitude'])
            row['latitude'] = float(row['latitude'])
            row['location_cell'] = int(float(row['location_cell']))
            data.append(row)

    actions = []

    for doc in data:
        actions.append({
            '_index': 'airbnb',
            '_type': 'listings',
            '_source': doc
        })
    helpers.bulk(es, actions)

def create_hotels_merged_mapping(es):
    map_name = "merged"
    mapping = {
        map_name: {
            "properties": {
                "location": {"type": "geo_point"},
            }
        }
    }
    es.indices.create(index="hotels")
    es.indices.put_mapping(index="hotels", doc_type=map_name, body=mapping)

def load_hotels_merged(es):
    filename = 'hotels_merged.json'

    data = json.load(open(filename))

    actions = []

    for doc in data:
        actions.append({
            '_index': 'hotels',
            '_type': 'merged',
            '_source': doc
        })
        break
    helpers.bulk(es, actions)

def load_hotels_merged_geo(es):
    filename = 'hotels_merged.json'

    data = json.load(open(filename))

    actions = []

    for doc in data:
        doc["location"] = {
            "lat": float(doc['lat']),
            "lon": float(doc['lon'])
        },
        actions.append({
            '_index': 'hotels',
            '_type': 'merged',
            '_source': doc
        })
    helpers.bulk(es, actions)

def load_airbnb_prices(es):
    filename = 'airbnb_price_output.csv'

    data = []

    with open(filename) as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            row['id'] = int(row['id'])
            row['location_cell'] = int(float(row['location_cell']))
            row['2017-12-06 to 2017-12-07'] = int(row['2017-12-06 to 2017-12-07'])
            row['2017-12-16 to 2017-12-17'] = int(row['2017-12-16 to 2017-12-17'])
            row['2017-12-26 to 2017-12-27'] = int(row['2017-12-26 to 2017-12-27'])
            data.append(row)

    actions = []

    for doc in data:
        actions.append({
            '_index': 'airbnb_prices',
            '_type': 'prices',
            '_source': doc
        })
    helpers.bulk(es, actions)

load_airbnb_prices(es)